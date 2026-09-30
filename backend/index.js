require("dotenv").config();
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const client = require("./config/redis");
const main = require("./config/db");

const authRouter = require("./routes/auth.routes");
const routineRouter = require("./routes/routine.routes");
const logRouter = require("./routes/Log.routes");
const dashboardRouter = require("./routes/Dashboard.routes");

const app = express();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.json({ message: "comeback" });
});

// Routes
app.use("/auth", authRouter);
app.use("/routines", routineRouter);
app.use("/logs", logRouter);
app.use("/dashboard", dashboardRouter);

const InitlizeConnection = async () => {
  try {
    await Promise.all([
      client.connect(),
      main(),
    ]);

    console.log("DB connected");
    console.log("Redis connected");

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server initialization error:", err);
  }
};

InitlizeConnection();