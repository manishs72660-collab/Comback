const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const upload = require("../middleware/upload.middleware.js");
const { getProfile, updateProfile, uploadMedia, removeWallpaper } = require("../controller/Profile.controller.js");

const router = express.Router();
router.use(authMiddleware);
router.get("/", getProfile);
router.patch("/", updateProfile);
router.post("/media/:kind", upload.single("image"), uploadMedia);
router.delete("/wallpaper", removeWallpaper);
router.use((error, req, res, next) => {
  if (error instanceof require("multer").MulterError) {
    return res.status(400).json({ success: false, message: error.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller" : "Invalid upload" });
  }
  if (error.message === "Only JPEG, PNG, and WebP images are supported") {
    return res.status(400).json({ success: false, message: error.message });
  }
  next(error);
});
module.exports = router;
