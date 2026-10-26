const mongoose = require("mongoose");
const User = require("../models/user.models.js");
const Follow = require("../models/Follow.models.js");
const Notification = require("../models/Notification.models.js");
const Message = require("../models/Message.models.js");
const { buildSummaries, computeStreaks } = require("../service/Routine.service.js");
const { addDays, todayString } = require("../utils/Date.js");

const getConsistency = async (userId) => {
  const today = todayString();
  const summaries = await buildSummaries(userId, addDays(today, -364), today, today);
  const active = summaries.filter((day) => day.status !== "none").slice(-30);
  const completed = active.filter((day) => day.status === "completed").length;
  return {
    currentStreak: computeStreaks(summaries, today).current,
    completionRate: active.length ? Math.round(completed / active.length * 100) : 0,
    activeDays: active.length,
  };
};

const searchUsers = async (req, res) => {
  const query = String(req.query.q || "").trim();
  if (query.length < 2) return res.json({ success: true, users: [] });
  const users = await User.find({
    _id: { $ne: req.user._id },
    name: { $regex: query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" },
  }).select("name avatar bio").limit(10).lean();
  const following = await Follow.find({ followerId: req.user._id, followingId: { $in: users.map((user) => user._id) } }).select("followingId").lean();
  const followingIds = new Set(following.map((row) => row.followingId.toString()));
  res.json({ success: true, users: users.map((user) => ({ ...user, following: followingIds.has(user._id.toString()) })) });
};

const followUser = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId) || userId === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "Invalid user" });
  }
  const user = await User.findById(userId).select("_id name");
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  let follow = await Follow.findOne({ followerId: req.user._id, followingId: userId });
  if (!follow) {
    try {
      follow = await Follow.create({ followerId: req.user._id, followingId: userId });
      const notification = await Notification.create({
        recipientId: userId, actorId: req.user._id, type: "follow", text: "started following you", link: "/friends",
      });
      req.app.get("io").to(`user:${userId}`).emit("notification:new", {
        ...notification.toObject(), actorId: { _id: req.user._id, name: req.user.name, avatar: req.user.avatar },
      });
    } catch (error) {
      if (error.code !== 11000) throw error;
      follow = await Follow.findOne({ followerId: req.user._id, followingId: userId });
    }
  }
  res.status(201).json({ success: true, follow });
};

const unfollowUser = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.userId)) return res.status(400).json({ success: false, message: "Invalid user" });
  await Follow.deleteOne({ followerId: req.user._id, followingId: req.params.userId });
  res.json({ success: true });
};

const getFollowing = async (req, res) => {
  const follows = await Follow.find({ followerId: req.user._id }).sort({ createdAt: -1 }).populate("followingId", "name avatar bio").lean();
  const userIds = follows.filter((row) => row.followingId).map((row) => row.followingId._id);
  const followsBack = await Follow.find({ followerId: { $in: userIds }, followingId: req.user._id }).select("followerId").lean();
  const followsBackIds = new Set(followsBack.map((row) => row.followerId.toString()));
  const users = follows.filter((row) => row.followingId).map(({ followingId }) => ({
    ...followingId,
    isFollowing: true,
    followsYou: followsBackIds.has(followingId._id.toString()),
  }));
  res.json({ success: true, users });
};

const getFollowers = async (req, res) => {
  const follows = await Follow.find({ followingId: req.user._id }).sort({ createdAt: -1 }).populate("followerId", "name avatar bio").lean();
  const userIds = follows.filter((row) => row.followerId).map((row) => row.followerId._id);
  const following = await Follow.find({ followerId: req.user._id, followingId: { $in: userIds } }).select("followingId").lean();
  const followingIds = new Set(following.map((row) => row.followingId.toString()));
  const users = follows.filter((row) => row.followerId).map(({ followerId }) => ({
    ...followerId,
    isFollowing: followingIds.has(followerId._id.toString()),
    followsYou: true,
  }));
  res.json({ success: true, users });
};

const getConnectionCounts = async (req, res) => {
  const [followers, following] = await Promise.all([
    Follow.countDocuments({ followingId: req.user._id }),
    Follow.countDocuments({ followerId: req.user._id }),
  ]);
  res.json({ success: true, followers, following });
};

const getConnectedProfile = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId) || userId === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: "Invalid user" });
  }
  const [person, isFollowing, followsYou] = await Promise.all([
    User.findById(userId).select("name avatar bio").lean(),
    Follow.exists({ followerId: req.user._id, followingId: userId }),
    Follow.exists({ followerId: userId, followingId: req.user._id }),
  ]);
  if (!person) return res.status(404).json({ success: false, message: "User not found" });
  if (!isFollowing && !followsYou) return res.status(403).json({ success: false, message: "Follow each other to view this profile" });
  res.json({
    success: true,
    user: { ...person, isFollowing: Boolean(isFollowing), followsYou: Boolean(followsYou), mutualFollow: Boolean(isFollowing && followsYou), consistency: await getConsistency(userId) },
  });
};

const getNotifications = async (req, res) => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const notifications = await Notification.find({ recipientId: req.user._id, createdAt: { $gte: cutoff } }).sort({ createdAt: -1 }).limit(40)
    .populate("actorId", "name avatar").lean();
  res.json({ success: true, notifications, unread: notifications.filter((item) => !item.readAt).length });
};

const readNotifications = async (req, res) => {
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  await Notification.updateMany({ recipientId: req.user._id, createdAt: { $gte: cutoff }, readAt: null }, { $set: { readAt: new Date() } });
  res.json({ success: true });
};

const getMessages = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) return res.status(400).json({ success: false, message: "Invalid user" });
  const [followsYou, youFollow] = await Promise.all([
    Follow.exists({ followerId: userId, followingId: req.user._id }),
    Follow.exists({ followerId: req.user._id, followingId: userId }),
  ]);
  if (!followsYou || !youFollow) return res.status(403).json({ success: false, message: "Follow each other to access this conversation" });
  const relationQuery = {
    $or: [
      { senderId: req.user._id, recipientId: userId },
      { senderId: userId, recipientId: req.user._id },
    ],
  };
  const before = req.query.before ? new Date(req.query.before) : null;
  if (before && Number.isNaN(before.getTime())) return res.status(400).json({ success: false, message: "Invalid message cursor" });
  if (before && !mongoose.isValidObjectId(req.query.beforeId)) return res.status(400).json({ success: false, message: "Invalid message cursor" });
  const query = before ? {
    $and: [
      relationQuery,
      { $or: [{ createdAt: { $lt: before } }, { createdAt: before, _id: { $lt: req.query.beforeId } }] },
    ],
  } : relationQuery;
  const results = await Message.find(query).sort({ createdAt: -1, _id: -1 }).limit(101).lean();
  const hasMore = results.length > 100;
  const messages = results.slice(0, 100).reverse();
  if (!before) await Message.updateMany({ senderId: userId, recipientId: req.user._id, readAt: null }, { $set: { readAt: new Date() } });
  res.json({ success: true, messages, hasMore });
};

const getConversations = async (req, res) => {
  const recentMessages = await Message.find({
    $or: [{ senderId: req.user._id }, { recipientId: req.user._id }],
  }).sort({ createdAt: -1, _id: -1 }).limit(500).lean();
  const conversations = new Map();
  for (const message of recentMessages) {
    const otherId = message.senderId.toString() === req.user._id.toString()
      ? message.recipientId.toString()
      : message.senderId.toString();
    if (!conversations.has(otherId)) {
      conversations.set(otherId, {
        userId: otherId,
        lastMessage: message.body,
        lastMessageAt: message.createdAt,
        unread: message.recipientId.toString() === req.user._id.toString() && !message.readAt ? 1 : 0,
      });
    } else if (message.recipientId.toString() === req.user._id.toString() && !message.readAt) {
      conversations.get(otherId).unread += 1;
    }
  }
  const people = await User.find({ _id: { $in: [...conversations.keys()] } }).select("name avatar bio").lean();
  const peopleById = new Map(people.map((person) => [person._id.toString(), person]));
  const otherIds = [...conversations.keys()].map((id) => new mongoose.Types.ObjectId(id));
  const mutualFollows = await Follow.find({
    $or: [
      { followerId: req.user._id, followingId: { $in: otherIds } },
      { followerId: { $in: otherIds }, followingId: req.user._id },
    ],
  }).select("followerId followingId").lean();
  const followsOut = new Set(mutualFollows.filter((row) => row.followerId.toString() === req.user._id.toString()).map((row) => row.followingId.toString()));
  const followsIn = new Set(mutualFollows.filter((row) => row.followingId.toString() === req.user._id.toString()).map((row) => row.followerId.toString()));
  res.json({
    success: true,
    conversations: [...conversations.values()]
      .map((conversation) => ({ ...conversation, user: peopleById.get(conversation.userId) }))
      .filter((conversation) => conversation.user && followsOut.has(conversation.userId) && followsIn.has(conversation.userId))
      .sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)),
  });
};

module.exports = { searchUsers, followUser, unfollowUser, getFollowing, getFollowers, getConnectionCounts, getConnectedProfile, getNotifications, readNotifications, getMessages, getConversations };
