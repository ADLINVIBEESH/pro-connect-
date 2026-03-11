const mongoose = require("mongoose");

const clientProfileSchema = new mongoose.Schema(
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
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.ClientProfile || mongoose.model("ClientProfile", clientProfileSchema);
