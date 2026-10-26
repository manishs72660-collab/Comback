const Routine = require("../models/Routine.models.js");
const DailyLog = require("../models/Dailylog.models.js");
const { addDays, dayOfWeek, dateRange } = require("../utils/Date.js");

// Does this routine apply on the given date?
const isScheduledOn = (routine, date) => {
  if (!routine.isActive) return false;
  if (routine.startDate && date < routine.startDate) return false;

  const dow = dayOfWeek(date);
  if ((routine.restDays || []).includes(dow)) return false;
  switch (routine.repeatType) {
    case "weekdays":
      return dow >= 1 && dow <= 5;
    case "custom":
      return (routine.repeatDays || []).includes(dow);
    case "weekly":
      return true;
    default:
      return true; // daily
  }
};

const getActiveRoutines = (userId) =>
  Routine.find({ userId, isActive: true, isArchived: { $ne: true } })
    .sort({ order: 1, createdAt: 1 })
    .lean();

// Routines scheduled for one date, each with its log status.
const getDayView = async (userId, date) => {
  const weekStart = addDays(date, -dayOfWeek(date));
  const weekEnd = addDays(weekStart, 6);
  const [routines, logs] = await Promise.all([
    getActiveRoutines(userId),
    DailyLog.find({ userId, date: { $gte: weekStart, $lte: weekEnd } }).lean(),
  ]);

  const dayLogs = logs.filter((log) => log.date === date);
  const logByRoutine = new Map(dayLogs.map((l) => [l.routineId.toString(), l]));
  const routinesById = new Map(routines.map((routine) => [routine._id.toString(), routine]));
  const weeklyDone = new Map();
  for (const log of logs) {
    const routine = routinesById.get(log.routineId.toString());
    if (
      log.status !== "done" ||
      log.date > date ||
      !routine ||
      !isScheduledOn(routine, log.date)
    ) continue;
    const key = log.routineId.toString();
    weeklyDone.set(key, (weeklyDone.get(key) || 0) + 1);
  }

  const items = routines
    .filter((r) => isScheduledOn(r, date))
    .filter((r) => logByRoutine.get(r._id.toString())?.status !== "rescheduled")
    .filter((r) => {
      if (r.repeatType !== "weekly") return true;
      return (
        logByRoutine.has(r._id.toString()) ||
        (weeklyDone.get(r._id.toString()) || 0) < (r.weeklyTarget || 7)
      );
    })
    .map((r) => {
      const log = logByRoutine.get(r._id.toString());
      return {
        routine: r,
        status: log ? log.status : "pending",
        note: log ? log.note : "",
        completedAt: log ? log.completedAt : null,
        amount: log?.amount ?? r.normalTarget ?? 1,
      };
    });

  const total = items.length;
  const done = items.filter((i) => i.status === "done").length;
  const skipped = items.filter((i) => i.status === "skipped").length;

  return {
    date,
    total,
    done,
    skipped,
    percent: total === 0 ? 0 : Math.round((done / total) * 100),
    items,
  };
};

// Per-day summary for a date range.
// day status: none | upcoming | pending | completed | partial | skipped | missed
const buildSummaries = async (userId, from, to, today) => {
  const [routines, logs] = await Promise.all([
    getActiveRoutines(userId),
    DailyLog.find({
      userId,
      date: { $gte: addDays(from, -dayOfWeek(from)), $lte: to },
    }).lean(),
  ]);

  const logsByDate = new Map();
  for (const log of logs) {
    if (!logsByDate.has(log.date)) logsByDate.set(log.date, []);
    logsByDate.get(log.date).push(log);
  }

  return dateRange(from, to).map((date) => {
    const dayLogs = logsByDate.get(date) || [];
    const rescheduledIds = new Set(
      dayLogs.filter((l) => l.status === "rescheduled").map((l) => l.routineId.toString())
    );
    const scheduled = routines.filter(
      (r) => isScheduledOn(r, date) && !rescheduledIds.has(r._id.toString())
    ).filter((r) => {
      if (r.repeatType !== "weekly") return true;
      return dayLogs.some(
        (log) =>
          log.routineId.toString() === r._id.toString() &&
          ["done", "skipped"].includes(log.status)
      );
    });
    const scheduledIds = new Set(scheduled.map((r) => r._id.toString()));
    const total = scheduled.length;

    const applicableLogs = dayLogs.filter((l) =>
      scheduledIds.has(l.routineId.toString())
    );
    const done = applicableLogs.filter((l) => l.status === "done").length;
    const skipped = applicableLogs.filter((l) => l.status === "skipped").length;

    let status;
    if (total === 0) status = "none";
    else if (date > today) status = "upcoming";
    else if (done === total) status = "completed";
    else if (skipped === total) status = "skipped";
    else if (date === today) status = done > 0 || skipped > 0 ? "partial" : "pending";
    else status = done > 0 || skipped > 0 ? "partial" : "missed";

    return {
      date,
      total,
      done,
      skipped,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
      status,
    };
  });
};

// A day counts toward the streak only when every scheduled routine is done.
// Days with no routines are neutral. Today never breaks a streak while unfinished.
const computeStreaks = (summaries, today) => {
  let best = 0;
  let run = 0;

  for (const day of summaries) {
    if (day.date > today || day.status === "none") continue;
    if (day.status === "completed") {
      run += 1;
      if (run > best) best = run;
    } else if (day.date !== today) {
      run = 0;
    }
  }

  let current = 0;
  for (let i = summaries.length - 1; i >= 0; i--) {
    const day = summaries[i];
    if (day.date > today || day.status === "none") continue;
    if (day.status === "completed") current += 1;
    else if (day.date === today) continue;
    else break;
  }

  return { current, best };
};

module.exports = {
  isScheduledOn,
  getActiveRoutines,
  getDayView,
  buildSummaries,
  computeStreaks,
};