require("dotenv").config();
require("node:dns/promises").setServers(["1.1.1.1", "8.8.8.8"]);

const http = require("http");
const { Server } = require("socket.io");

const client = require("./config/redis");
const main = require("./config/db");
const { corsOptions } = require("./config/cors");

const app = require("./app");
const Message = require("./models/Message.models");
const Notification = require("./models/Notification.models");
const Follow = require("./models/Follow.models");
const User = require("./models/user.models");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const server = http.createServer(app);

const io = new Server(server, {
  cors: corsOptions,
});
app.set("io", io);

io.use(async (socket, next) => {
  try {
    const cookies = Object.fromEntries(
      (socket.handshake.headers.cookie || "").split(";").filter(Boolean).map((part) => {
        const separator = part.indexOf("=");
        return [part.slice(0, separator).trim(), decodeURIComponent(part.slice(separator + 1).trim())];
      })
    );
    if (!cookies.accessToken) return next(new Error("Authentication required"));
    const token = jwt.verify(cookies.accessToken, process.env.ACCESS_TOKEN_SECRET);
    if (token.type !== "access" || await client.get(`blacklist:${token.jti}`)) {
      return next(new Error("Invalid session"));
    }
    socket.userId = token.userId;
    next();
  } catch (error) {
    next(new Error("Authentication required"));
  }
});

io.on("connection", (socket) => {
  socket.join(`user:${socket.userId}`);
  socket.on("message:send", async ({ recipientId, body } = {}, acknowledge = () => {}) => {
    try {
      if (typeof recipientId !== "string" || !mongoose.isValidObjectId(recipientId) || typeof body !== "string" || !body.trim() || body.trim().length > 2000) {
        return acknowledge({ success: false, message: "A recipient and message of up to 2000 characters are required" });
      }
        const [followsRecipient, recipientFollows] = await Promise.all([
        Follow.exists({ followerId: socket.userId, followingId: recipientId }),

        Follow.exists({ followerId: recipientId, followingId: socket.userId }),
      ]);
      if (!followsRecipient || !recipientFollows) return acknowledge({ success: false, message: "Follow each other to message" });
      const message = await Message.create({ senderId: socket.userId, recipientId, body: body.trim() });
      const notification = await Notification.create({
        recipientId, actorId: socket.userId, type: "message", text: "sent you a message", link: `/messages/${socket.userId}`,
      });
      
      const sender = await User.findById(socket.userId).select("name avatar").lean();
      io.to(`user:${recipientId}`).emit("message:new", message);
      io.to(`user:${recipientId}`).emit("notification:new", {
        ...notification.toObject(),
        actorId: sender ? { ...sender, _id: socket.userId } : { _id: socket.userId },
      });
      acknowledge({ success: true, message });
    } catch (error) {
      console.error("Socket message error:", error);
      acknowledge({ success: false, message: "Unable to send message" });
    }
  });
});

const InitlizeConnection = async () => {
  try {
    await Promise.all([
      client.connect(),
      main(),
    ]);
    await Notification.createIndexes();

    console.log("DB connected");
    console.log("Redis connected");

    const PORT = process.env.PORT || 3000;

    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server initialization error:", err);
  }
};

InitlizeConnection();