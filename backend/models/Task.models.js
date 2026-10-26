const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, trim: true, maxlength: 1000, default: "" },
    deadline: { type: Date, default: null },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status: { type: String, enum: ["pending", "completed"], default: "pending" },
    scheduledAt: { type: String, default: "" },
  },
  { timestamps: true }
);

taskSchema.index({ userId: 1, status: 1, deadline: 1 });

module.exports = mongoose.models.Task || mongoose.model("Task", taskSchema);
