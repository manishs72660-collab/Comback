const mongoose = require("mongoose");

const Routine = require("../models/Routine.models.js");
const DailyLog = require("../models/Dailylog.models.js");
const DayNote = require("../models/DayNote.models.js");
const handleError = require("../utils/Handleerror.js");
const {
  isValidDateString,
  todayString,
  addDays,
  diffDays,
  dayOfWeek,
} = require("../utils/Date.js");
const {
  getDayView,
  buildSummaries,
  isScheduledOn,
} = require("../service/Routine.service.js");

const MAX_HISTORY_DAYS = 366;

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });

// Client should send its own local date (YYYY-MM-DD). Falls back to server date (UTC).
const resolveDate = (value) => (value === undefined ? todayString() : value);

// ================= DAY VIEW =================
// GET /logs/day?date=YYYY-MM-DD
// Routines scheduled for that day with done / skipped / pending status.

const getDay = async (req, res) => {
  try {
    const date = resolveDate(req.query.date);
    if (!isValidDateString(date)) return badRequest(res, "date must be YYYY-MM-DD");

    const day = await getDayView(req.user._id, date);
    return res.status(200).json({ success: true, ...day });
  } catch (error) {
    return handleError(res, error, "Get Day Error");
  }
};

// ================= SET LOG =================
// PUT /logs   body: { routineId, date, status, note, amount }
// "pending" removes the log (undo).

const setLog = async (req, res) => {
  try {
    const { routineId, status, note } = req.body;
    const date = resolveDate(req.body.date);

    if (!mongoose.isValidObjectId(routineId)) {
      return badRequest(res, "Invalid routineId");
    }
    if (!isValidDateString(date)) return badRequest(res, "date must be YYYY-MM-DD");
    if (!["done", "skipped", "pending"].includes(status)) {
      return badRequest(res, "status must be done, skipped or pending");
    }

    // 1 day of slack so users ahead of server time (UTC) are not blocked
    if (date > addDays(todayString(), 1)) {
      return badRequest(res, "You cannot log a future date");
    }

    const routine = await Routine.findOne({
      _id: routineId,
      userId: req.user._id,
    });
    if (!routine) {
      return res.status(404).json({ success: false, message: "Routine not found" });
    }

    const filter = { userId: req.user._id, routineId, date };
    const existingLog = await DailyLog.findOne(filter).lean();
    const amount =
      req.body.amount === undefined
        ? existingLog?.amount ?? routine.normalTarget
        : Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1000) {
      return badRequest(res, "amount must be a number between 0 and 1000");
    }
    if (status === "done" && amount < routine.minimumTarget) {
      return badRequest(res, `Complete at least the minimum target of ${routine.minimumTarget}`);
    }

    if (status === "pending") {
      await DailyLog.deleteOne(filter);
      return res.status(200).json({
        success: true,
        message: "Log removed",
        log: null,
      });
    }

    const update = {
      status,
      amount,
      completedAt: status === "done" ? new Date() : null,
    };
    if (note !== undefined) update.note = note;

    const log = await DailyLog.findOneAndUpdate(
      filter,
      { $set: update },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Log saved",
      log,
    });
  } catch (error) {
    return handleError(res, error, "Set Log Error");
  }
};

// ================= HISTORY =================
// GET /logs/history?from=YYYY-MM-DD&to=YYYY-MM-DD
// One summary row per day, newest first. Defaults to the last 30 days.

const getHistory = async (req, res) => {
  try {
    const to = resolveDate(req.query.to);
    if (!isValidDateString(to)) return badRequest(res, "to must be YYYY-MM-DD");

    const from = req.query.from !== undefined ? req.query.from : addDays(to, -29);

    if (!isValidDateString(from)) return badRequest(res, "from must be YYYY-MM-DD");
    if (from > to) return badRequest(res, "from must not be after to");
    if (diffDays(from, to) + 1 > MAX_HISTORY_DAYS) {
      return badRequest(res, `Range cannot exceed ${MAX_HISTORY_DAYS} days`);
    }

    const today =
      req.query.today && isValidDateString(req.query.today)
        ? req.query.today
        : todayString();

    const summaries = await buildSummaries(req.user._id, from, to, today);

    return res.status(200).json({
      success: true,
      from,
      to,
      days: summaries.reverse(),
    });
  } catch (error) {
    return handleError(res, error, "Get History Error");
  }
};

const getDayNote = async (req, res) => {
  try {
    const date = resolveDate(req.query.date);
    if (!isValidDateString(date)) return badRequest(res, "date must be YYYY-MM-DD");
    const dayNote = await DayNote.findOne({ userId: req.user._id, date }).lean();
    return res.status(200).json({ success: true, date, note: dayNote?.note || "" });
  } catch (error) {
    return handleError(res, error, "Get Daily Note Error");
  }
};

const setDayNote = async (req, res) => {
  try {
    const date = resolveDate(req.body.date);
    const note = typeof req.body.note === "string" ? req.body.note.trim() : null;
    if (!isValidDateString(date)) return badRequest(res, "date must be YYYY-MM-DD");
    if (note === null || note.length > 1000) {
      return badRequest(res, "note must be a string of 1000 characters or less");
    }

    if (!note) {
      await DayNote.deleteOne({ userId: req.user._id, date });
      return res.status(200).json({ success: true, date, note: "" });
    }

    const dayNote = await DayNote.findOneAndUpdate(
      { userId: req.user._id, date },
      { $set: { note } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ success: true, date, note: dayNote.note });
  } catch (error) {
    return handleError(res, error, "Save Daily Note Error");
  }
};

const rescheduleLog = async (req, res) => {
  try {
    const { routineId } = req.body;
    const date = resolveDate(req.body.date);
    if (!mongoose.isValidObjectId(routineId)) return badRequest(res, "Invalid routineId");
    if (!isValidDateString(date)) return badRequest(res, "date must be YYYY-MM-DD");
    if (date > addDays(todayString(), 1)) {
      return badRequest(res, "Only today's or past tasks can be rescheduled");
    }

    const routine = await Routine.findOne({
      _id: routineId,
      userId: req.user._id,
      isArchived: { $ne: true },
    });
    if (!routine) return res.status(404).json({ success: false, message: "Routine not found" });

    const sourceLog = await DailyLog.findOne({ userId: req.user._id, routineId, date });
    if (sourceLog?.status === "done") {
      return badRequest(res, "Completed habits cannot be rescheduled");
    }
    if (sourceLog?.status === "rescheduled") {
      return badRequest(res, "This habit has already been rescheduled");
    }

    let target = addDays(date, 1);
    let attempts = 0;
    while (attempts < 14) {
      const existing = await DailyLog.findOne({ userId: req.user._id, routineId, date: target }).lean();
      let weeklyQuotaReached = false;
      if (routine.repeatType === "weekly") {
        const weekStart = addDays(target, -dayOfWeek(target));
        const completed = await DailyLog.countDocuments({
          userId: req.user._id,
          routineId,
          date: { $gte: weekStart, $lte: target },
          status: "done",
        });
        weeklyQuotaReached = completed >= (routine.weeklyTarget || 7);
      }
      if (isScheduledOn(routine, target) && !existing && !weeklyQuotaReached) break;
      target = addDays(target, 1);
      attempts += 1;
    }
    if (attempts === 14) return badRequest(res, "No available scheduled day found in the next 14 days");

    await DailyLog.findOneAndUpdate(
      { userId: req.user._id, routineId, date },
      { $set: { status: "rescheduled", rescheduledTo: target, completedAt: null } },
      { upsert: true, runValidators: true, setDefaultsOnInsert: true }
    );
    return res.status(200).json({ success: true, date, rescheduledTo: target });
  } catch (error) {
    return handleError(res, error, "Reschedule Habit Error");
  }
};

module.exports = { getDay, setLog, getHistory, getDayNote, setDayNote, rescheduleLog };