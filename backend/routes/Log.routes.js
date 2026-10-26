const express = require("express");
const router = express.Router();

const {
  getDay,
  setLog,
  getHistory,
  getDayNote,
  setDayNote,
  rescheduleLog,
} = require("../controller/Log.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");

router.use(authMiddleware);
router.get("/day", getDay);
router.get("/history", getHistory);
router.get("/note", getDayNote);
router.put("/note", setDayNote);
router.post("/reschedule", rescheduleLog);
router.put("/", setLog);

module.exports = router;