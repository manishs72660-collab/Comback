const express = require("express");
const authMiddleware = require("../middleware/auth.middleware.js");
const {
  searchUsers, followUser, unfollowUser, getFollowing, getFollowers, getConnectionCounts, getConnectedProfile,
  getNotifications, readNotifications, getMessages, getConversations,
} = require("../controller/Social.controller.js");

const router = express.Router();
router.use(authMiddleware);
router.get("/users", searchUsers);
router.get("/users/:userId", getConnectedProfile);
router.get("/following", getFollowing);
router.get("/followers", getFollowers);
router.get("/connections/counts", getConnectionCounts);
router.post("/follow/:userId", followUser);
router.delete("/follow/:userId", unfollowUser);
router.get("/notifications", getNotifications);
router.patch("/notifications/read", readNotifications);
router.get("/conversations", getConversations);
router.get("/messages/:userId", getMessages);
module.exports = router;
