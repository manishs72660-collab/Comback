const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const { chat, suggestSchedule, getQuote } = require("../controller/Assistant.controller.js");

const router = express.Router();
router.use(authMiddleware);
router.post("/chat", chat);
router.post("/schedule", suggestSchedule);
router.get("/quote", getQuote);
module.exports = router;
