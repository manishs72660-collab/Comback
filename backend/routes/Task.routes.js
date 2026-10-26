const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const { createTask, getTasks, updateTask, deleteTask } = require("../controller/Task.controller.js");

const router = express.Router();
router.use(authMiddleware);
router.get("/", getTasks);
router.post("/", createTask);
router.patch("/:id", updateTask);
router.delete("/:id", deleteTask);
module.exports = router;
