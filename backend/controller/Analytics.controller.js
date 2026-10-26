const DailyLog = require("../models/Dailylog.models.js");
const Routine = require("../models/Routine.models.js");
const handleError = require("../utils/Handleerror.js");
const {
  addDays,
  dateRange,
  dayOfWeek,
  isValidDateString,
  todayString,
} = require("../utils/Date.js");
const {
  isScheduledOn,
  buildSummaries,
  computeStreaks,
} = require("../service/Routine.service.js");

const rate = (done, total) => (total ? Math.round((done / total) * 100) : 0);

const summarizeRange = (routines, logs, from, to) => {
  const byDay = new Map();
  logs.forEach((log) => {
    if (!byDay.has(log.date)) byDay.set(log.date, []);
    byDay.get(log.date).push(log);
  });

  let total = 0;
  let done = 0;
  let skipped = 0;
  for (const date of dateRange(from, to)) {
    const rescheduledIds = new Set(
      (byDay.get(date) || [])
        .filter((log) => log.status === "rescheduled")
        .map((log) => log.routineId.toString())
    );
    const scheduled = routines.filter(
      (routine) =>
        routine.repeatType !== "weekly" &&
        isScheduledOn(routine, date) && !rescheduledIds.has(routine._id.toString())
    );
    const scheduledIds = new Set(scheduled.map((routine) => routine._id.toString()));
    const relevantLogs = (byDay.get(date) || []).filter((log) =>
      scheduledIds.has(log.routineId.toString())
    );
    total += scheduled.length;
    done += relevantLogs.filter((log) => log.status === "done").length;
    skipped += relevantLogs.filter((log) => log.status === "skipped").length;
  }

  const weeklyStarts = [...new Set(
    dateRange(from, to).map((date) => addDays(date, -dayOfWeek(date)))
  )];
  for (const routine of routines.filter((item) => item.repeatType === "weekly")) {
    for (const weekStart of weeklyStarts) {
      const weekEnd = addDays(weekStart, 6);
      const activeDates = dateRange(
        weekStart < from ? from : weekStart,
        weekEnd > to ? to : weekEnd
      );
      if (!activeDates.some((date) => isScheduledOn(routine, date))) continue;
      const weekLogs = logs.filter(
        (log) =>
          log.routineId.toString() === routine._id.toString() &&
          log.date >= weekStart &&
          log.date <= weekEnd &&
          isScheduledOn(routine, log.date)
      );
      const goal = routine.weeklyTarget || 7;
      total += goal;
      done += Math.min(goal, weekLogs.filter((log) => log.status === "done").length);
      skipped += Math.min(goal, weekLogs.filter((log) => log.status === "skipped").length);
    }
  }
  return { done, total, skipped, completionRate: rate(done, total) };
};

const getAnalytics = async (req, res) => {
  try {
    const today = req.query.date === undefined ? todayString() : String(req.query.date);
    if (!isValidDateString(today)) {
      return res.status(400).json({ success: false, message: "date must be YYYY-MM-DD" });
    }
    const weekFrom = addDays(today, -6);
    const monthFrom = addDays(today, -29);
    const previousMonthFrom = addDays(today, -59);
    const userId = req.user._id;
    const [routines, logs] = await Promise.all([
      Routine.find({ userId, isActive: true, isArchived: { $ne: true } }).lean(),
      DailyLog.find({ userId, date: { $gte: previousMonthFrom, $lte: today } }).lean(),
    ]);

    const weekly = summarizeRange(routines, logs, weekFrom, today);
    const currentMonth = summarizeRange(routines, logs, monthFrom, today);
    const previousMonth = summarizeRange(routines, logs, previousMonthFrom, addDays(monthFrom, -1));

    const byRoutine = new Map();
    for (const log of logs) {
      const key = log.routineId.toString();
      if (!byRoutine.has(key)) byRoutine.set(key, []);
      byRoutine.get(key).push(log);
    }

    const habitAnalytics = routines.map((routine) => {
      const routineLogs = byRoutine.get(routine._id.toString()) || [];
      const eligibleDates = dateRange(monthFrom, today).filter(
        (date) =>
          routine.repeatType !== "weekly" &&
          isScheduledOn(routine, date) &&
          !routineLogs.some((log) => log.date === date && log.status === "rescheduled")
      );
      let done = eligibleDates.filter((date) =>
        routineLogs.some((log) => log.date === date && log.status === "done")
      ).length;
      let skipped = eligibleDates.filter((date) =>
        routineLogs.some((log) => log.date === date && log.status === "skipped")
      ).length;
      let eligible = eligibleDates.length;
      if (routine.repeatType === "weekly") {
        const weeks = [...new Set(
          dateRange(monthFrom, today).map((date) => addDays(date, -dayOfWeek(date)))
        )].filter((start) => {
          const end = addDays(start, 6);
          return dateRange(
            start < monthFrom ? monthFrom : start,
            end > today ? today : end
          ).some((date) => isScheduledOn(routine, date));
        });
        const target = routine.weeklyTarget || 7;
        eligible = weeks.length * target;
        done = weeks.reduce((sum, start) => {
          const end = addDays(start, 6);
          return sum + Math.min(
            target,
            routineLogs.filter((log) => log.status === "done" && log.date >= start && log.date <= end && isScheduledOn(routine, log.date)).length
          );
        }, 0);
        skipped = weeks.reduce((sum, start) => {
          const end = addDays(start, 6);
          return sum + Math.min(
            target,
            routineLogs.filter((log) => log.status === "skipped" && log.date >= start && log.date <= end && isScheduledOn(routine, log.date)).length
          );
        }, 0);
      }
      return {
        _id: routine._id,
        title: routine.title,
        category: routine.category,
        done,
        skipped,
        eligible,
        completionRate: rate(done, eligible),
      };
    });

    const streakSummaries = await buildSummaries(userId, addDays(today, -364), today, today);
    const bestStreak = computeStreaks(streakSummaries, today);
    const milestones = [7, 30, 100].map((target) => ({
      days: target,
      achieved: bestStreak.best >= target,
    }));

    return res.status(200).json({
      success: true,
      weekly,
      consistency: currentMonth,
      habits: habitAnalytics.sort((a, b) => b.completionRate - a.completionRate),
      monthlyComparison: {
        current: currentMonth,
        previous: previousMonth,
        completionRateChange: currentMonth.completionRate - previousMonth.completionRate,
      },
      milestones,
    });
  } catch (error) {
    return handleError(res, error, "Analytics Error");
  }
};

module.exports = { getAnalytics };
