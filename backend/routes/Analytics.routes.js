const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth.middleware.js");
const { getAnalytics } = require("../controller/Analytics.controller.js");

router.get("/", authMiddleware, getAnalytics);

module.exports = router;
