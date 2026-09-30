const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const User = require("../models/user.models.js");
const redisClient = require("../config/redis.js");

const REFRESH_TTL = 7 * 24 * 60 * 60; // seconds

// ================= TOKENS =================

const generateAccessToken = (userId, jti) =>
  jwt.sign({ userId, jti, type: "access" }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "15m",
  });

const generateRefreshToken = (userId, jti) =>
  jwt.sign({ userId, jti, type: "refresh" }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });

// ================= COOKIES =================

const cookieBase = () => {
  const isProduction = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  };
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie("accessToken", accessToken, {
    ...cookieBase(),
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", refreshToken, {
    ...cookieBase(),
    maxAge: REFRESH_TTL * 1000,
  });
};

// Must use the same options as when the cookie was set,
// otherwise browsers ignore the clear in production (sameSite none).
const clearAuthCookies = (res) => {
  res.clearCookie("accessToken", cookieBase());
  res.clearCookie("refreshToken", cookieBase());
};

// Creates a new session: tokens + redis entry + cookies
const issueSession = async (res, userId) => {
  const accessJti = crypto.randomUUID();
  const refreshJti = crypto.randomUUID();

  const accessToken = generateAccessToken(userId, accessJti);
  const refreshToken = generateRefreshToken(userId, refreshJti);

  await redisClient.set(`session:${refreshJti}`, userId, { EX: REFRESH_TTL });

  setAuthCookies(res, accessToken, refreshToken);
};

const publicUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  avatar: user.avatar,
});

// ================= REGISTER =================

const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({ name, email, password: hashedPassword });

    await issueSession(res, user._id.toString());

    return res.status(201).json({
      success: true,
      message: "Registration successful",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Register Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ================= LOGIN =================

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    await issueSession(res, user._id.toString());

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ================= REFRESH =================
// Reads the refresh cookie, rotates it (old one is deleted) and issues new tokens.

const refresh = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Refresh token missing",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired refresh token",
      });
    }

    if (decoded.type !== "refresh") {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    // Session must still exist in Redis (not logged out, not already used)
    const storedUserId = await redisClient.get(`session:${decoded.jti}`);

    if (!storedUserId || storedUserId !== decoded.userId) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again",
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      await redisClient.del(`session:${decoded.jti}`);
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Rotate: old refresh session is removed, a new one is created
    await redisClient.del(`session:${decoded.jti}`);
    await issueSession(res, user._id.toString());

    return res.status(200).json({
      success: true,
      message: "Token refreshed",
    });
  } catch (error) {
    console.error("Refresh Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// ================= ME =================
// Route uses authMiddleware, so req.user is already loaded.

const me = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: publicUser(req.user),
  });
};

// ================= LOGOUT =================

const logout = async (req, res) => {
  try {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    // Blacklist access token until it would have expired
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
        const remainingTime = decoded.exp - Math.floor(Date.now() / 1000);

        if (remainingTime > 0) {
          await redisClient.set(`blacklist:${decoded.jti}`, "true", {
            EX: remainingTime,
          });
        }
      } catch (error) {
        // Already expired or invalid, nothing to blacklist
      }
    }

    // Delete refresh session
    if (refreshToken) {
      try {
        const decoded = jwt.verify(
          refreshToken,
          process.env.REFRESH_TOKEN_SECRET
        );
        await redisClient.del(`session:${decoded.jti}`);
      } catch (error) {
        // Already invalid or expired
      }
    }

    clearAuthCookies(res);

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { register, login, refresh, me, logout };