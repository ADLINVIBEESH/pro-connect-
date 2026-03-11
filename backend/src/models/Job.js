const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000,
    },
    domain: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
      index: true,
    },
    subdomain: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
      index: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    budgetMin: {
      type: Number,
      default: 0,
      min: 0,
    },
    budgetMax: {
      type: Number,
      default: 0,
      min: 0,
    },
    timeline: {
      type: String,
      default: "",
      trim: true,
      maxlength: 200,
    },
    experienceLevel: {
      type: String,
      default: "",
      trim: true,
      maxlength: 120,
    },
    status: {
      type: String,
      enum: ["open", "closed"],
      default: "open",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.Job || mongoose.model("Job", jobSchema);
