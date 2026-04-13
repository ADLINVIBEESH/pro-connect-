const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const ClientProfile = require("../models/ClientProfile");
const FreelancerProfile = require("../models/FreelancerProfile");
const Job = require("../models/Job");
const SavedJob = require("../models/SavedJob");
const User = require("../models/User");
const Notification = require("../models/Notification");
const SavedFreelancer = require("../models/SavedFreelancer");
const Conversation = require("../models/Conversation");
const ChatMessage = require("../models/ChatMessage");
const requireAuth = require("../middleware/requireAuth");
const { verifyGoogleCredential } = require("../utils/googleAuth");
const { isFreelancerRole, sanitizeString } = require("../utils/common");
const { buildReadOnlyProfilePayload, getFreelancerSummary } = require("../utils/profileViews");

const router = express.Router();

router.get("/freelancers", requireAuth, async (_req, res) => {
  try {
    const users = await User.find({ role: "freelancer" }).sort({ createdAt: -1 }).lean();

    if (users.length === 0) {
      return res.status(200).json({ freelancers: [] });
    }

    const userIds = users.map((user) => user._id);
    const profiles = await FreelancerProfile.find({ userId: { $in: userIds } }).lean();
    const profileMap = new Map(profiles.map((profile) => [profile.userId.toString(), profile]));

    const freelancers = users.map((user) =>
      getFreelancerSummary({
        user,
        profile: profileMap.get(user._id.toString()) ?? null,
      }),
    );

    return res.status(200).json({ freelancers });
  } catch (error) {
    console.error("freelancers list error:", error);
    return res.status(500).json({ message: "Unable to load freelancers right now." });
  }
});

router.get("/:userId/profile", requireAuth, async (req, res) => {
  try {
    const userId = String(req.params?.userId ?? "").trim();

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }

    const user = await User.findById(userId);

    if (!user || !user.role) {
      return res.status(404).json({ message: "Profile not found." });
    }

    const [freelancerProfile, clientProfile] = await Promise.all([
      FreelancerProfile.findOne({ userId: user._id }),
      ClientProfile.findOne({ userId: user._id }),
    ]);

    return res.status(200).json(
      buildReadOnlyProfilePayload({
        user,
        freelancerProfile,
        clientProfile,
      }),
    );
  } catch (error) {
    console.error("public profile error:", error);
    return res.status(500).json({ message: "Unable to load that profile right now." });
  }
});

// --- SAVED FREELANCERS ENDPOINTS ---

router.post("/save-freelancer/:freelancerId", requireAuth, async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const clientId = req.auth.userId;

    if (!mongoose.isValidObjectId(freelancerId)) {
      return res.status(400).json({ message: "Invalid freelancer id." });
    }

    const freelancer = await User.findById(freelancerId);
    if (!freelancer || !isFreelancerRole(freelancer.role)) {
      return res.status(404).json({ message: "Freelancer not found." });
    }

    const existing = await SavedFreelancer.findOne({ clientId, freelancerId });
    if (existing) {
      return res.status(400).json({ message: "Freelancer already saved." });
    }

    const saved = new SavedFreelancer({ clientId, freelancerId });
    await saved.save();

    return res.status(200).json({ message: "Freelancer saved successfully." });
  } catch (error) {
    console.error("Save freelancer error:", error);
    return res.status(500).json({ message: "Unable to save freelancer right now." });
  }
});

router.delete("/save-freelancer/:freelancerId", requireAuth, async (req, res) => {
  try {
    const { freelancerId } = req.params;
    const clientId = req.auth.userId;

    await SavedFreelancer.deleteOne({ clientId, freelancerId });
    return res.status(200).json({ message: "Freelancer removed from saved list." });
  } catch (error) {
    console.error("Remove saved freelancer error:", error);
    return res.status(500).json({ message: "Unable to remove saved freelancer right now." });
  }
});

router.get("/saved-freelancers", requireAuth, async (req, res) => {
  try {
    const clientId = req.auth.userId;
    const saved = await SavedFreelancer.find({ clientId }).sort({ createdAt: -1 }).lean();
    
    if (saved.length === 0) {
      return res.status(200).json({ freelancers: [] });
    }

    const userIds = saved.map(s => s.freelancerId);
    const users = await User.find({ _id: { $in: userIds }, role: "freelancer" }).lean();
    const profiles = await FreelancerProfile.find({ userId: { $in: userIds } }).lean();
    const profileMap = new Map(profiles.map(p => [p.userId.toString(), p]));

    const freelancers = users.map(user => 
      getFreelancerSummary({
        user,
        profile: profileMap.get(user._id.toString()) ?? null
      })
    );

    return res.status(200).json({ freelancers });
  } catch (error) {
    console.error("Get saved freelancers error:", error);
    return res.status(500).json({ message: "Unable to load saved freelancers right now." });
  }
});

// --- NOTIFICATION ENDPOINTS ---

router.post("/:userId/notify", requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const senderId = req.auth.userId;
    const { message, type = "general", jobId = null } = req.body;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id." });
    }
    if (!message) {
      return res.status(400).json({ message: "Notification message is required." });
    }
    if (jobId && !mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job id." });
    }

    const notification = new Notification({
      recipientId: userId,
      senderId,
      message,
      type,
      jobId,
    });
    await notification.save();

    return res.status(200).json({ message: "Notification sent successfully." });
  } catch (error) {
    console.error("Notify user error:", error);
    return res.status(500).json({ message: "Unable to notify user right now." });
  }
});

router.get("/notifications", requireAuth, async (req, res) => {
  try {
    const userId = req.auth.userId;
    const notifications = await Notification.find({ recipientId: userId })
      .populate("senderId", "fullName avatar email")
      .populate("jobId", "title description clientId status")
      .sort({ createdAt: -1 })
      .lean();
    return res.status(200).json({ notifications });
  } catch (error) {
    console.error("Fetch notifications error:", error);
    return res.status(500).json({ message: "Unable to fetch notifications right now." });
  }
});

router.put("/notifications/:id/read", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.updateOne({ _id: id, recipientId: req.auth.userId }, { isRead: true });
    return res.status(200).json({ message: "Notification marked as read." });
  } catch (error) {
    console.error("Mark notification read error:", error);
    return res.status(500).json({ message: "Unable to mark notification as read." });
  }
});

router.delete("/notifications", requireAuth, async (req, res) => {
  try {
    await Notification.deleteMany({ recipientId: req.auth.userId });
    return res.status(200).json({ message: "All notifications deleted." });
  } catch (error) {
    console.error("Delete all notifications error:", error);
    return res.status(500).json({ message: "Unable to clear notifications." });
  }
});

router.delete("/notifications/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.deleteOne({ _id: id, recipientId: req.auth.userId });
    return res.status(200).json({ message: "Notification deleted." });
  } catch (error) {
    console.error("Delete notification error:", error);
    return res.status(500).json({ message: "Unable to delete notification." });
  }
});

router.delete("/delete-account", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (user.password) {
      const password = String(req.body?.password ?? "");

      if (!password) {
        return res.status(400).json({ message: "Enter your password to delete the account." });
      }

      const isMatch = await bcrypt.compare(password, user.password);

      if (!isMatch) {
        return res.status(401).json({ message: "Incorrect password." });
      }
    } else {
      const googleAuth = await verifyGoogleCredential(req.body?.googleCredential);

      if (googleAuth.email !== user.email || googleAuth.googleId !== sanitizeString(user.googleId, 255)) {
        return res.status(401).json({ message: "Google re-authentication failed." });
      }
    }

    const ownedJobs = await Job.find({ clientId: user._id }).select("_id").lean();
    const ownedJobIds = ownedJobs.map((job) => job._id);

    await Promise.all([
      FreelancerProfile.deleteOne({ userId: user._id }),
      ClientProfile.deleteOne({ userId: user._id }),
      Application.deleteMany({
        $or: [{ freelancerId: user._id }, { jobId: { $in: ownedJobIds } }],
      }),
      SavedJob.deleteMany({
        $or: [{ freelancerId: user._id }, { jobId: { $in: ownedJobIds } }],
      }),
      Job.deleteMany({ clientId: user._id }),
      User.deleteOne({ _id: user._id }),
      SavedFreelancer.deleteMany({ $or: [{ clientId: user._id }, { freelancerId: user._id }] }),
      Notification.deleteMany({ $or: [{ recipientId: user._id }, { senderId: user._id }] }),
      Conversation.deleteMany({ participants: user._id }),
      ChatMessage.deleteMany({ senderId: user._id }),
    ]);

    return res.status(200).json({ message: "Account deleted successfully." });
  } catch (error) {
    console.error("delete-account error:", error);
    return res.status(500).json({
      message:
        error.message === "Google authentication is not configured." || error.message === "Google credential is required."
          ? error.message
          : "Unable to delete the account right now.",
    });
  }
});

module.exports = router;
