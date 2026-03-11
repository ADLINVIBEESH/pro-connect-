const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // Sparse keeps OTP-only signup records from colliding before usernames exist.
    username: {
      type: String,
      unique: true,
      sparse: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
    },
    authProviders: {
      type: [
        {
          type: String,
          enum: ["local", "google"],
        },
      ],
      default: ["local"],
    },
    googleId: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    avatar: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ["freelancer", "client"],
      default: null,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationCode: {
      type: String,
    },
    verificationCodeExpires: {
      type: Date,
    },
    passwordResetCode: {
      type: String,
    },
    passwordResetCodeExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
