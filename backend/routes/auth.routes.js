const express = require("express");
const router = express.Router();

const {
  register,
  login,
  refresh,
  me,
  logout,
} = require("../controller/auth.controller.js");
const authMiddleware = require("../middleware/auth.middleware.js");

router.post("/register", register);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authMiddleware, me);

module.exports = router;