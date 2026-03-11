const mongoose = require("mongoose");

const freelancerProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    profileCompleted: {
      type: Boolean,
      default: false,
    },
    profileData: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    skills: {
      type: [String],
      default: [],
    },
    portfolio: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    bio: {
      type: String,
      default: "",
      trim: true,
    },
    location: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports =
  mongoose.models.FreelancerProfile || mongoose.model("FreelancerProfile", freelancerProfileSchema);
