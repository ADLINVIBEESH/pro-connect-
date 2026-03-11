const mongoose = require("mongoose");

const savedJobSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  },
);

savedJobSchema.index({ jobId: 1, freelancerId: 1 }, { unique: true });

module.exports = mongoose.models.SavedJob || mongoose.model("SavedJob", savedJobSchema);
