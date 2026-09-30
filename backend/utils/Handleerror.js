const mongoose = require("mongoose");

module.exports = (res, error, label) => {
  if (error instanceof mongoose.Error.ValidationError) {
    const message = Object.values(error.errors)
      .map((e) => e.message)
      .join(", ");
    return res.status(400).json({ success: false, message });
  }

  console.error(`${label}:`, error);
  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};