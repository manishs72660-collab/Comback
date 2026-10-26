require("dotenv").config({ path: require("node:path").join(__dirname, ".env") });
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const redisClient = require("./config/redis");
const connectMongo = require("./config/db");
const Notification = require("./models/Notification.models");
const { corsOptions } = require("./config/cors");

const authRouter = require("./routes/auth.routes");
const routineRouter = require("./routes/Routine.routes");
const logRouter = require("./routes/Log.routes");
const dashboardRouter = require("./routes/Dashboard.routes");
const analyticsRouter = require("./routes/Analytics.routes");
const profileRouter = require("./routes/Profile.routes");
const socialRouter = require("./routes/Social.routes");
const taskRouter = require("./routes/Task.routes");
const assistantRouter = require("./routes/Assistant.routes");

const app = express();
let connectionPromise;

const connectServices = () => {
  if (!connectionPromise) {
    connectionPromise = Promise.all([
      mongoose.connection.readyState === 1 ? Promise.resolve() : connectMongo(),
      redisClient.isReady ? Promise.resolve() : redisClient.connect(),
    ]).then(() => Notification.createIndexes()).catch((error) => {
      connectionPromise = null;
      throw error;
    });
  }
  return connectionPromise;
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.set("io", { to: () => ({ emit: () => {} }) });
app.use(async (req, res, next) => {
  try {
    await connectServices();
    next();
  } catch (error) {
    console.error("API service connection error:", error);
    res.status(503).json({ success: false, message: "API services are temporarily unavailable" });
  }
});

app.get("/", (req, res) => res.json({ message: "comeback" }));
app.use("/auth", authRouter);
app.use("/routines", routineRouter);
app.use("/logs", logRouter);
app.use("/dashboard", dashboardRouter);
app.use("/analytics", analyticsRouter);
app.use("/profile", profileRouter);
app.use("/social", socialRouter);
app.use("/tasks", taskRouter);
app.use("/assistant", assistantRouter);

module.exports = app;
