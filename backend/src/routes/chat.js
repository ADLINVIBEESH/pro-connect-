const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middleware/requireAuth");
const Conversation = require("../models/Conversation");
const ChatMessage = require("../models/ChatMessage");

const router = express.Router();

// --- GET /api/chat/conversations ---
// Returns all conversations for the authenticated user
router.get("/conversations", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("participants", "fullName avatar email role")
      .populate("jobId", "title")
      .sort({ lastMessageAt: -1, createdAt: -1 })
      .lean();

    return res.status(200).json({ conversations });
  } catch (error) {
    console.error("Get conversations error:", error);
    return res.status(500).json({ message: "Unable to load conversations." });
  }
});

// --- POST /api/chat/conversations ---
// Find or create a conversation between two participants around a job
router.post("/conversations", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { otherUserId, jobId = null } = req.body;

    if (!otherUserId || !mongoose.isValidObjectId(otherUserId)) {
      return res.status(400).json({ message: "Invalid other user ID." });
    }

    if (jobId && !mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job ID." });
    }

    const participants = [userId, otherUserId].sort(); // canonical order

    // Try to find existing conversation
    let conversation = await Conversation.findOne({
      participants: { $all: participants, $size: 2 },
      ...(jobId ? { jobId } : {}),
    })
      .populate("participants", "fullName avatar email role")
      .populate("jobId", "title");

    if (!conversation) {
      conversation = await Conversation.create({ participants, jobId: jobId || null });
      conversation = await conversation.populate([
        { path: "participants", select: "fullName avatar email role" },
        { path: "jobId", select: "title" },
      ]);
    }

    return res.status(200).json({ conversation });
  } catch (error) {
    console.error("Create/find conversation error:", error);
    return res.status(500).json({ message: "Unable to create conversation." });
  }
});

// --- GET /api/chat/:conversationId/messages ---
// Fetch messages for a specific conversation (paginated — newest last)
router.get("/:conversationId/messages", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { conversationId } = req.params;

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID." });
    }

    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ message: "Access denied." });
    }

    const messages = await ChatMessage.find({ conversationId })
      .populate("senderId", "fullName avatar")
      .sort({ createdAt: 1 })
      .lean();

    // Mark unread messages sent by the other user as read
    await ChatMessage.updateMany(
      { conversationId, senderId: { $ne: userId }, isRead: false },
      { isRead: true },
    );

    return res.status(200).json({ messages });
  } catch (error) {
    console.error("Get messages error:", error);
    return res.status(500).json({ message: "Unable to load messages." });
  }
});

// --- POST /api/chat/:conversationId/messages ---
// Send a new message in a conversation
router.post("/:conversationId/messages", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { conversationId } = req.params;
    const text = String(req.body?.text ?? "").trim();

    if (!mongoose.isValidObjectId(conversationId)) {
      return res.status(400).json({ message: "Invalid conversation ID." });
    }

    if (!text) {
      return res.status(400).json({ message: "Message text is required." });
    }

    // Verify user is a participant
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ message: "Access denied." });
    }

    const message = await ChatMessage.create({ conversationId, senderId: userId, text });

    // Update last message cache on conversation
    await Conversation.updateOne(
      { _id: conversationId },
      { lastMessage: text.slice(0, 80), lastMessageAt: new Date() },
    );

    const populated = await message.populate("senderId", "fullName avatar");

    return res.status(201).json({ message: populated });
  } catch (error) {
    console.error("Send message error:", error);
    return res.status(500).json({ message: "Unable to send message." });
  }
});

module.exports = router;
