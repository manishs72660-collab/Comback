const mongoose = require("mongoose");
const Task = require("../models/Task.models.js");

const createTask = async (req, res) => {
  try {
    const { title, description = "", deadline = null, priority = "medium", scheduledAt = "" } = req.body;
    if (typeof title !== "string" || !title.trim()) return res.status(400).json({ success: false, message: "Task title is required" });
    if (!["low", "medium", "high"].includes(priority)) return res.status(400).json({ success: false, message: "Invalid priority" });
    if (deadline && Number.isNaN(Date.parse(deadline))) return res.status(400).json({ success: false, message: "Invalid deadline" });
    const task = await Task.create({
      userId: req.user._id,
      title: title.trim(),
      description: String(description).slice(0, 1000),
      deadline: deadline || null,
      priority,
      scheduledAt: String(scheduledAt).slice(0, 80),
    });
    res.status(201).json({ success: true, task });
  } catch (error) {
    console.error("Create task error:", error);
    res.status(500).json({ success: false, message: "Unable to create task" });
  }
};

const getTasks = async (req, res) => {
  const filter = { userId: req.user._id };
  if (req.query.status === "pending" || req.query.status === "completed") filter.status = req.query.status;
  const tasks = await Task.find(filter).sort({ status: 1, deadline: 1, createdAt: -1 }).lean();
  res.json({ success: true, tasks, pending: tasks.filter((task) => task.status === "pending").length });
};

const updateTask = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid task id" });
  const allowed = ["title", "description", "deadline", "priority", "scheduledAt", "status"];
  const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (update.priority && !["low", "medium", "high"].includes(update.priority)) return res.status(400).json({ success: false, message: "Invalid priority" });
  if (update.status && !["pending", "completed"].includes(update.status)) return res.status(400).json({ success: false, message: "Invalid status" });
  if (update.title !== undefined && (typeof update.title !== "string" || !update.title.trim())) return res.status(400).json({ success: false, message: "Task title cannot be empty" });
  if (update.deadline && Number.isNaN(Date.parse(update.deadline))) return res.status(400).json({ success: false, message: "Invalid deadline" });
  const task = await Task.findOneAndUpdate({ _id: req.params.id, userId: req.user._id }, update, { new: true, runValidators: true });
  if (!task) return res.status(404).json({ success: false, message: "Task not found" });
  res.json({ success: true, task });
};

const deleteTask = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid task id" });
  const task = await Task.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
  if (!task) return res.status(404).json({ success: false, message: "Task not found" });
  res.json({ success: true });
};

module.exports = { createTask, getTasks, updateTask, deleteTask };
