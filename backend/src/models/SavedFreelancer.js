const mongoose = require("mongoose");

const savedFreelancerSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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

savedFreelancerSchema.index({ clientId: 1, freelancerId: 1 }, { unique: true });

module.exports =
  mongoose.models.SavedFreelancer || mongoose.model("SavedFreelancer", savedFreelancerSchema);
