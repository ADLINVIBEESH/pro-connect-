const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const ClientProfile = require("../models/ClientProfile");
const FreelancerProfile = require("../models/FreelancerProfile");
const Job = require("../models/Job");
const SavedJob = require("../models/SavedJob");
const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");
const { verifyGoogleCredential } = require("../utils/googleAuth");
const { sanitizeString } = require("../utils/common");
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
