const express = require("express");
const router = express.Router();

const { getDashboard } = require("../controller/Dashboard.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");

router.get("/", authMiddleware, getDashboard);

module.exports = router;