const mongoose = require("mongoose");

const dayNoteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"],
    },
    note: {
      type: String,
      trim: true,
      maxlength: [1000, "Daily note must be 1000 characters or less"],
      default: "",
    },
  },
  { timestamps: true }
);

dayNoteSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports =
  mongoose.models.DayNote || mongoose.model("DayNote", dayNoteSchema);
