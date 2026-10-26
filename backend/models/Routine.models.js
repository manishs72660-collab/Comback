const mongoose = require("mongoose");

const routineSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title must be 100 characters or less"],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description must be 500 characters or less"],
      default: "",
    },

    category: {
      type: String,
      enum: ["health", "fitness", "study", "work", "personal", "development", "other"],
      default: "personal",
    },

    minimumTarget: {
      type: Number,
      min: 1,
      max: 1000,
      default: 1,
      validate: Number.isInteger,
    },

    normalTarget: {
      type: Number,
      min: 1,
      max: 1000,
      default: 1,
      validate: Number.isInteger,
    },

    weeklyTarget: {
      type: Number,
      min: 1,
      max: 7,
      default: 7,
      validate: Number.isInteger,
    },

    restDays: {
      type: [{ type: Number, min: 0, max: 6 }],
      default: [],
    },

    timeOfDay: {
      type: String,
      enum: ["morning", "afternoon", "evening", "anytime"],
      default: "anytime",
    },

    // Optional exact time, "HH:mm" (24h). Empty string = no reminder time.
    reminderTime: {
      type: String,
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, "reminderTime must be HH:mm"],
      default: "",
    },

    repeatType: {
      type: String,
      enum: ["daily", "weekdays", "custom", "weekly"],
      default: "daily",
    },

    // Used only when repeatType === "custom". 0 = Sunday ... 6 = Saturday
    repeatDays: {
      type: [{ type: Number, min: 0, max: 6 }],
      default: [],
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    isArchived: {
      type: Boolean,
      default: false,
    },

    // "YYYY-MM-DD". Routine does not count for days before this date.
    startDate: {
      type: String,
      required: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, "startDate must be YYYY-MM-DD"],
    },

    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

routineSchema.pre("validate", function () {
  this.repeatDays = [...new Set(this.repeatDays || [])];
  this.restDays = [...new Set(this.restDays || [])];
  if (this.normalTarget < this.minimumTarget) {
    this.invalidate("normalTarget", "Normal target must be at least the minimum target");
  }
  if (this.repeatType === "custom") {
    if (!this.repeatDays || this.repeatDays.length === 0) {
      this.invalidate("repeatDays", "Select at least one day for a custom repeat");
    }
  } else {
    this.repeatDays = [];
  }
});

module.exports =
  mongoose.models.Routine || mongoose.model("Routine", routineSchema);