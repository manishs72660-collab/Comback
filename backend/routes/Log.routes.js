const express = require("express");
const router = express.Router();

const { getDay, setLog, getHistory } = require("../controller/Log.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");

router.use(authMiddleware);
router.get("/day", getDay);
router.get("/history", getHistory);
router.put("/", setLog);

module.exports = router;