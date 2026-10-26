const express = require("express");
const router = express.Router();

const {
  createRoutine,
  createRoutineBatch,
  getRoutines,
  getRoutineById,
  updateRoutine,
  toggleRoutine,
  archiveRoutine,
  deleteRoutine,
} = require("../controller/Routine.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");

router.use(authMiddleware);

router.post("/", createRoutine);
router.post("/batch", createRoutineBatch);
router.get("/", getRoutines);
router.get("/:id", getRoutineById);
router.put("/:id", updateRoutine);
router.patch("/:id/archive", archiveRoutine);
router.patch("/:id/toggle", toggleRoutine);
router.delete("/:id", deleteRoutine);

module.exports = router;