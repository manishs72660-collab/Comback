const mongoose = require("mongoose");

const Routine = require("../models/Routine.models.js");
const DailyLog = require("../models/Dailylog.models.js");
const handleError = require("../utils/Handleerror.js");
const { isValidDateString, todayString } = require("../utils/Date.js");

const ALLOWED_FIELDS = [
  "title",
  "description",
  "category",
  "timeOfDay",
  "reminderTime",
  "repeatType",
  "repeatDays",
  "weeklyTarget",
  "minimumTarget",
  "normalTarget",
  "restDays",
  "startDate",
  "order",
  "isActive",
  "isArchived",
];

const pickFields = (body) => {
  const data = {};
  for (const key of ALLOWED_FIELDS) {
    if (body[key] !== undefined) data[key] = body[key];
  }
  return data;
};

const badRequest = (res, message) =>
  res.status(400).json({ success: false, message });

const notFound = (res) =>
  res.status(404).json({ success: false, message: "Routine not found" });

// ================= CREATE =================

const createRoutine = async (req, res) => {
  try {
    const data = pickFields(req.body);

    if (data.startDate === undefined) data.startDate = todayString();
    if (!isValidDateString(data.startDate)) {
      return badRequest(res, "startDate must be a valid YYYY-MM-DD date");
    }

    const routine = await Routine.create({ ...data, userId: req.user._id });

    return res.status(201).json({
      success: true,
      message: "Routine created",
      routine,
    });
  } catch (error) {
    return handleError(res, error, "Create Routine Error");
  }
};

const createRoutineBatch = async (req, res) => {
  try {
    const { routines } = req.body;
    if (!Array.isArray(routines) || routines.length < 1 || routines.length > 20) {
      return badRequest(res, "A routine plan must contain between 1 and 20 routines");
    }
    if (routines.some((entry) => !entry || typeof entry !== "object" || Array.isArray(entry))) {
      return badRequest(res, "Every routine in the plan must be a valid object");
    }
    const entries = routines.map((entry, index) => {
      const data = pickFields(entry);
      if (data.startDate === undefined) data.startDate = todayString();
      if (!isValidDateString(data.startDate)) {
        return null;
      }
      return { ...data, order: index, userId: req.user._id };
    });
    if (entries.some((entry) => entry === null)) {
      return badRequest(res, "startDate must be a valid YYYY-MM-DD date");
    }
    const created = await Routine.insertMany(entries);
    return res.status(201).json({
      success: true,
      message: "Routine plan created",
      count: created.length,
      routines: created,
    });
  } catch (error) {
    return handleError(res, error, "Create Routine Plan Error");
  }
};

// ================= LIST =================
// GET /routines?active=true|false&category=health

const getRoutines = async (req, res) => {
  try {
    const filter = { userId: req.user._id };

    if (req.query.active === "true") filter.isActive = true;
    if (req.query.active === "false") filter.isActive = false;
    if (req.query.archived === "true") filter.isArchived = true;
    if (req.query.archived !== "true") filter.isArchived = { $ne: true };
    if (req.query.category) filter.category = String(req.query.category);

    const routines = await Routine.find(filter).sort({ order: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: routines.length,
      routines,
    });
  } catch (error) {
    return handleError(res, error, "Get Routines Error");
  }
};

// ================= GET ONE =================

const getRoutineById = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return badRequest(res, "Invalid routine id");

    const routine = await Routine.findOne({ _id: id, userId: req.user._id });
    if (!routine) return notFound(res);

    return res.status(200).json({ success: true, routine });
  } catch (error) {
    return handleError(res, error, "Get Routine Error");
  }
};

// ================= UPDATE =================

const updateRoutine = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return badRequest(res, "Invalid routine id");

    const data = pickFields(req.body);
    if (data.startDate !== undefined && !isValidDateString(data.startDate)) {
      return badRequest(res, "startDate must be a valid YYYY-MM-DD date");
    }

    const routine = await Routine.findOne({ _id: id, userId: req.user._id });
    if (!routine) return notFound(res);

    // save() (not findOneAndUpdate) so the repeatDays validation hook runs
    routine.set(data);
    await routine.save();

    return res.status(200).json({
      success: true,
      message: "Routine updated",
      routine,
    });
  } catch (error) {
    return handleError(res, error, "Update Routine Error");
  }
};

// ================= TOGGLE ACTIVE =================

const toggleRoutine = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return badRequest(res, "Invalid routine id");

    const routine = await Routine.findOne({ _id: id, userId: req.user._id });
    if (!routine) return notFound(res);

    routine.isActive = !routine.isActive;
    await routine.save();

    return res.status(200).json({
      success: true,
      message: routine.isActive ? "Routine activated" : "Routine paused",
      routine,
    });
  } catch (error) {
    return handleError(res, error, "Toggle Routine Error");
  }
};

const archiveRoutine = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return badRequest(res, "Invalid routine id");

    const routine = await Routine.findOne({ _id: id, userId: req.user._id });
    if (!routine) return notFound(res);

    routine.isArchived = !routine.isArchived;
    await routine.save();

    return res.status(200).json({
      success: true,
      message: routine.isArchived ? "Routine archived" : "Routine restored",
      routine,
    });
  } catch (error) {
    return handleError(res, error, "Archive Routine Error");
  }
};

// ================= DELETE =================
// Removes the routine and all of its logs.

const deleteRoutine = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return badRequest(res, "Invalid routine id");

    const routine = await Routine.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });
    if (!routine) return notFound(res);

    await DailyLog.deleteMany({ userId: req.user._id, routineId: routine._id });

    return res.status(200).json({
      success: true,
      message: "Routine deleted",
    });
  } catch (error) {
    return handleError(res, error, "Delete Routine Error");
  }
};

module.exports = {
  createRoutine,
  createRoutineBatch,
  getRoutines,
  getRoutineById,
  updateRoutine,
  toggleRoutine,
  archiveRoutine,
  deleteRoutine,
};