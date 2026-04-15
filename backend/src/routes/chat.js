const express = require("express");
const mongoose = require("mongoose");
const requireAuth = require("../middleware/requireAuth");
const Conversation = require("../models/Conversation");
const ChatMessage = require("../models/ChatMessage");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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

// --- POST /api/chat/upload ---
// Upload a file (base64) to the server local filesystem
router.post("/upload", requireAuth, async (req, res) => {
  try {
    const { fileName, fileData } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ message: "File name and data are required." });
    }

    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ message: "Invalid file data format." });
    }

    const buffer = Buffer.from(matches[2], "base64");
    const ext = path.extname(fileName) || "";
    const safeName = crypto.randomUUID() + ext;
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(__dirname, "../../../uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, safeName);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${safeName}`;
    return res.status(200).json({ fileUrl });
  } catch (error) {
    console.error("Upload file error:", error);
    return res.status(500).json({ message: "Unable to upload file." });
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

    if (conversation.blockedBy) {
      return res.status(403).json({ message: "This chat is currently blocked." });
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

// --- DELETE /api/chat/:conversationId/messages ---
// Clears all messages in a conversation
router.delete("/:conversationId/messages", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ message: "Access denied." });
    }

    await ChatMessage.deleteMany({ conversationId });
    await Conversation.updateOne({ _id: conversationId }, { lastMessage: "", lastMessageAt: null });

    return res.status(200).json({ message: "Chat cleared." });
  } catch (error) {
    console.error("Clear chat error:", error);
    return res.status(500).json({ message: "Unable to clear chat." });
  }
});

// --- PATCH /api/chat/:conversationId/block ---
// Blocks or unblocks a conversation
router.patch("/:conversationId/block", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const { conversationId } = req.params;
    const { action } = req.body; // "block" or "unblock"

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (action === "block") {
      conversation.blockedBy = userId;
    } else if (action === "unblock") {
      // Only the user who blocked it can unblock it
      if (conversation.blockedBy && conversation.blockedBy.toString() === userId.toString()) {
        conversation.blockedBy = null;
      } else {
        return res.status(403).json({ message: "Only the blocker can unblock." });
      }
    } else {
      return res.status(400).json({ message: "Invalid action." });
    }

    await conversation.save();
    return res.status(200).json({ message: `Chat ${action}ed.` });
  } catch (error) {
    console.error("Block chat error:", error);
    return res.status(500).json({ message: "Unable to toggle block status." });
  }
});

module.exports = router;
