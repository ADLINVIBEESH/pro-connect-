const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
      index: true,
    },
    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    coverLetter: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    status: {
      type: String,
      enum: ["pending", "shortlisted", "hired", "rejected"],
      default: "pending",
      index: true,
    },
  },
  {
    timestamps: true,
  },
);

applicationSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });

module.exports = mongoose.models.Application || mongoose.model("Application", applicationSchema);
