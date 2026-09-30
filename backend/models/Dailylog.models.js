const mongoose = require("mongoose");

// One document per (user, routine, date).
// Only "done" and "skipped" are stored. "pending" = no document.
// "missed" is derived: scheduled, date is in the past, and no document.
const dailyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    routineId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Routine",
      required: true,
    },

    // "YYYY-MM-DD"
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"],
    },

    status: {
      type: String,
      enum: ["done", "skipped"],
      required: true,
    },

    note: {
      type: String,
      trim: true,
      maxlength: [300, "Note must be 300 characters or less"],
      default: "",
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

dailyLogSchema.index({ userId: 1, routineId: 1, date: 1 }, { unique: true });
dailyLogSchema.index({ userId: 1, date: 1 });

module.exports =
  mongoose.models.DailyLog || mongoose.model("DailyLog", dailyLogSchema);