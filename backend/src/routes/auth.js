const express = require("express");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const FreelancerProfile = require("../models/FreelancerProfile");
const ClientProfile = require("../models/ClientProfile");
const requireAuth = require("../middleware/requireAuth");
const { createMailer, getTransportConfig, hasEmailConfig } = require("../config/email");
const { verifyGoogleCredential } = require("../utils/googleAuth");
const {
  isPlainObject,
  isClientRole,
  isFreelancerRole,
  normalizeEmail,
  normalizeRole,
  normalizeUsername,
  sanitizePortfolio,
  sanitizeString,
  sanitizeStringArray,
} = require("../utils/common");
const {
  createSessionResponse,
  hasGoogleProvider,
  loadUserSession,
  resolveAuthProviders,
  serializeClientProfile,
  serializeFreelancerProfile,
  serializeUser,
} = require("../utils/session");

const router = express.Router();

const OTP_EXPIRY_MS = 10 * 60 * 1000;
const PASSWORD_MIN_LENGTH = 8;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const otpPattern = /^\d{6}$/;
const usernamePattern = /^[a-z0-9._-]{3,24}$/;

const isProduction = () => process.env.NODE_ENV === "production";
const generateOtp = () => `${Math.floor(100000 + Math.random() * 900000)}`;

const sendOtpEmail = async ({ email, otp, subject, heading, intro }) => {
  if (!hasEmailConfig()) {
    if (isProduction()) {
      throw new Error("Email service is not configured.");
    }

    console.warn(`[auth] Email service not configured. OTP for ${email}: ${otp}`);
    return { deliveredWith: "console" };
  }

  const transporter = createMailer();
  const config = getTransportConfig();

  await transporter.sendMail({
    from: `"${config.fromName}" <${config.fromAddress}>`,
    to: email,
    subject,
    text: `${intro} ${otp}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:Arial,sans-serif;background:#f7f7f5;padding:24px;">
        <div style="max-width:480px;margin:0 auto;background:#ffffff;border:1px solid #e7e5df;border-radius:16px;padding:28px;">
          <h2 style="margin:0 0 8px;color:#111827;">${heading}</h2>
          <p style="margin:0 0 20px;color:#4b5563;line-height:1.6;">${intro} It expires in 10 minutes.</p>
          <div style="margin:0 auto 20px;width:max-content;background:#f3f4f6;border-radius:12px;padding:14px 18px;font-size:28px;letter-spacing:8px;font-weight:700;color:#111827;">
            ${otp}
          </div>
          <p style="margin:0;color:#6b7280;font-size:14px;">If you did not request this code, you can ignore this email.</p>
        </div>
      </div>
    `,
  });

  return { deliveredWith: "email" };
};

const sendVerificationEmail = (email, otp) =>
  sendOtpEmail({
    email,
    otp,
    subject: "Your ProConnect verification code",
    heading: "Verify your email",
    intro: "Use this code to continue your ProConnect signup.",
  });

const sendPasswordResetEmail = (email, otp) =>
  sendOtpEmail({
    email,
    otp,
    subject: "Your ProConnect password reset code",
    heading: "Reset your password",
    intro: "Use this code to reset your ProConnect password.",
  });

const handleDuplicateKey = (error, res) => {
  if (error?.code !== 11000) return false;

  const field = Object.keys(error.keyPattern ?? error.keyValue ?? {})[0];

  if (field === "email") {
    res.status(409).json({ message: "Email already registered" });
    return true;
  }

  if (field === "username") {
    res.status(409).json({ message: "Username already taken." });
    return true;
  }

  if (field === "googleId") {
    res.status(409).json({ message: "Google account already linked elsewhere." });
    return true;
  }

  return false;
};

const mergeAuthProvider = (user, provider) => {
  user.authProviders = Array.from(new Set(resolveAuthProviders(user).concat(provider)));
};

router.post("/send-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser && (existingUser.password || existingUser.username || existingUser.fullName || existingUser.googleId)) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const verificationCode = generateOtp();
    const verificationCodeExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    const user = existingUser ?? new User({ email, authProviders: ["local"] });

    user.isVerified = false;
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = verificationCodeExpires;
    if (!user.authProviders || user.authProviders.length === 0) {
      user.authProviders = ["local"];
    }

    await user.save();
    const delivery = await sendVerificationEmail(email, verificationCode);

    return res.status(200).json({
      message:
        delivery.deliveredWith === "console"
          ? "OTP generated. Email is not configured locally, so use the code printed in the backend terminal."
          : "OTP sent successfully.",
    });
  } catch (error) {
    if (handleDuplicateKey(error, res)) return;

    console.error("send-otp error:", error);
    return res.status(500).json({
      message: error.message === "Email service is not configured." ? error.message : "Unable to send OTP right now.",
    });
  }
});

router.post("/verify-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp ?? "").trim();

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (!otpPattern.test(otp)) {
      return res.status(400).json({ message: "Enter the 6-digit OTP." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No signup request found for this email." });
    }

    if (user.password || user.googleId) {
      return res.status(409).json({ message: "Email already registered" });
    }

    if (!user.verificationCode || user.verificationCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (!user.verificationCodeExpires || user.verificationCodeExpires.getTime() < Date.now()) {
      user.isVerified = false;
      user.verificationCode = undefined;
      user.verificationCodeExpires = undefined;
      await user.save();

      return res.status(400).json({ message: "OTP expired. Request a new code." });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    return res.status(200).json({
      message: "OTP verified successfully.",
      userId: user._id.toString(),
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    return res.status(500).json({ message: "Unable to verify OTP right now." });
  }
});

router.post("/complete-signup", async (req, res) => {
  try {
    const userId = String(req.body?.userId ?? "").trim();
    const username = normalizeUsername(req.body?.username);
    const fullName = sanitizeString(req.body?.fullName, 120);
    const password = String(req.body?.password ?? "");

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid signup session." });
    }

    if (!usernamePattern.test(username)) {
      return res.status(400).json({
        message: "Username must be 3-24 characters and use letters, numbers, dots, underscores, or hyphens.",
      });
    }

    if (fullName.length < 2) {
      return res.status(400).json({ message: "Full name must be at least 2 characters." });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Signup session not found." });
    }

    if (user.password || user.googleId) {
      return res.status(409).json({ message: "Email already registered" });
    }

    if (!user.isVerified) {
      return res.status(403).json({ message: "Verify your email before continuing." });
    }

    const usernameOwner = await User.findOne({ username });

    if (usernameOwner && usernameOwner._id.toString() !== user._id.toString()) {
      return res.status(409).json({ message: "Username already taken." });
    }

    user.username = username;
    user.fullName = fullName;
    user.password = await bcrypt.hash(password, 12);
    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    mergeAuthProvider(user, "local");

    await user.save();

    return res.status(201).json({
      message: "Account created successfully.",
      ...(await createSessionResponse(user)),
    });
  } catch (error) {
    if (handleDuplicateKey(error, res)) return;

    console.error("complete-signup error:", error);
    return res.status(500).json({ message: "Unable to create the account right now." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password ?? "");

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (!password) {
      return res.status(400).json({ message: "Enter your password." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    if (!user.password) {
      if (hasGoogleProvider(user)) {
        return res.status(400).json({ message: "This account uses Google sign-in. Continue with Google instead." });
      }

      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Incorrect password." });
    }

    return res.status(200).json(await createSessionResponse(user));
  } catch (error) {
    console.error("login error:", error);
    return res.status(500).json({ message: "Unable to log in right now." });
  }
});

router.post("/google", async (req, res) => {
  try {
    const googleAccount = await verifyGoogleCredential(req.body?.credential);
    const existingByGoogleId = await User.findOne({ googleId: googleAccount.googleId });

    if (existingByGoogleId) {
      if (existingByGoogleId.email !== googleAccount.email) {
        return res.status(409).json({ message: "Google account is already linked to another ProConnect user." });
      }

      if (!existingByGoogleId.avatar && googleAccount.avatar) {
        existingByGoogleId.avatar = googleAccount.avatar;
        await existingByGoogleId.save();
      }

      return res.status(200).json({
        message: "Signed in with Google.",
        ...(await createSessionResponse(existingByGoogleId)),
      });
    }

    const existingByEmail = await User.findOne({ email: googleAccount.email });

    if (existingByEmail) {
      if (existingByEmail.googleId && existingByEmail.googleId !== googleAccount.googleId) {
        return res.status(409).json({ message: "A different Google account is already linked to this email." });
      }

      existingByEmail.googleId = googleAccount.googleId;
      existingByEmail.isVerified = true;
      if (!existingByEmail.fullName && googleAccount.fullName) {
        existingByEmail.fullName = googleAccount.fullName;
      }
      if (!existingByEmail.avatar && googleAccount.avatar) {
        existingByEmail.avatar = googleAccount.avatar;
      }
      mergeAuthProvider(existingByEmail, "google");
      await existingByEmail.save();

      return res.status(200).json({
        message: "Signed in with Google.",
        ...(await createSessionResponse(existingByEmail)),
      });
    }

    const user = await User.create({
      email: googleAccount.email,
      fullName: googleAccount.fullName || googleAccount.email.split("@")[0],
      googleId: googleAccount.googleId,
      avatar: googleAccount.avatar,
      isVerified: true,
      authProviders: ["google"],
    });

    return res.status(200).json({
      message: "Signed in with Google.",
      ...(await createSessionResponse(user)),
    });
  } catch (error) {
    if (handleDuplicateKey(error, res)) return;

    console.error("google auth error:", error);
    return res.status(500).json({
      message:
        error.message === "Google authentication is not configured." ||
        error.message === "Google credential is required." ||
        error.message === "Google account email is not verified."
          ? error.message
          : "Unable to sign in with Google right now.",
    });
  }
});

router.post("/send-password-reset-otp", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    if (!user.password) {
      if (hasGoogleProvider(user)) {
        return res.status(400).json({ message: "This account uses Google sign-in. Continue with Google instead." });
      }

      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    user.passwordResetCode = generateOtp();
    user.passwordResetCodeExpires = new Date(Date.now() + OTP_EXPIRY_MS);
    await user.save();

    const delivery = await sendPasswordResetEmail(email, user.passwordResetCode);

    return res.status(200).json({
      message:
        delivery.deliveredWith === "console"
          ? "OTP generated. Email is not configured locally, so use the code printed in the backend terminal."
          : "Password reset OTP sent successfully.",
    });
  } catch (error) {
    console.error("send-password-reset-otp error:", error);
    return res.status(500).json({
      message: error.message === "Email service is not configured." ? error.message : "Unable to send OTP right now.",
    });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const otp = String(req.body?.otp ?? "").trim();
    const password = String(req.body?.password ?? "");

    if (!emailPattern.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (!otpPattern.test(otp)) {
      return res.status(400).json({ message: "Enter the 6-digit OTP." });
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      return res.status(400).json({ message: "Password must be at least 8 characters." });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    if (!user.password) {
      if (hasGoogleProvider(user)) {
        return res.status(400).json({ message: "This account uses Google sign-in. Continue with Google instead." });
      }

      return res.status(404).json({ message: "No account found with this email. Please sign up first." });
    }

    if (!user.passwordResetCode || user.passwordResetCode !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    if (!user.passwordResetCodeExpires || user.passwordResetCodeExpires.getTime() < Date.now()) {
      user.passwordResetCode = undefined;
      user.passwordResetCodeExpires = undefined;
      await user.save();

      return res.status(400).json({ message: "OTP expired. Request a new code." });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetCode = undefined;
    user.passwordResetCodeExpires = undefined;
    mergeAuthProvider(user, "local");
    await user.save();

    return res.status(200).json({
      message: "Password reset successfully.",
      ...(await createSessionResponse(user)),
    });
  } catch (error) {
    console.error("reset-password error:", error);
    return res.status(500).json({ message: "Unable to reset the password right now." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  try {
    const session = await loadUserSession(req.auth.userId);

    if (!session) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    return res.status(200).json({ user: session.sessionUser });
  } catch (error) {
    console.error("me error:", error);
    return res.status(500).json({ message: "Unable to load the current session." });
  }
});

router.post("/select-role", requireAuth, async (req, res) => {
  try {
    const role = normalizeRole(req.body?.role);

    if (!role) {
      return res.status(400).json({ message: "Choose either freelancer or client." });
    }

    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (!user.isVerified || (!user.password && !hasGoogleProvider(user))) {
      return res.status(403).json({ message: "Complete signup before selecting a role." });
    }

    const currentRole = normalizeRole(user.role);

    if (currentRole && currentRole !== role) {
      return res.status(409).json({ message: "Role already selected for this account." });
    }

    if (currentRole === role) {
      if (user.role !== role) {
        user.role = role;
        await user.save();
      }

      return res.status(200).json({
        message: "Role already selected.",
        ...(await createSessionResponse(user)),
      });
    }

    if (role === "freelancer") {
      await FreelancerProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $setOnInsert: {
            userId: user._id,
            profileCompleted: false,
            profileData: {},
            skills: [],
            portfolio: [],
            bio: "",
            location: "",
          },
        },
        {
          new: true,
          upsert: true,
        },
      );
    } else {
      await ClientProfile.findOneAndUpdate(
        { userId: user._id },
        {
          $setOnInsert: {
            userId: user._id,
            profileCompleted: false,
            profileData: {},
          },
        },
        {
          new: true,
          upsert: true,
        },
      );
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      message: "Role saved successfully.",
      ...(await createSessionResponse(user)),
    });
  } catch (error) {
    console.error("select-role error:", error);
    return res.status(500).json({ message: "Unable to save the selected role right now." });
  }
});

router.put("/freelancer-profile", requireAuth, async (req, res) => {
  try {
    if (req.body?.profileData !== undefined && !isPlainObject(req.body.profileData)) {
      return res.status(400).json({ message: "Freelancer profile data must be an object." });
    }

    if (req.body?.skills !== undefined && !Array.isArray(req.body.skills)) {
      return res.status(400).json({ message: "Skills must be sent as an array." });
    }

    if (req.body?.portfolio !== undefined && !Array.isArray(req.body.portfolio)) {
      return res.status(400).json({ message: "Portfolio must be sent as an array." });
    }

    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (!isFreelancerRole(user.role)) {
      return res.status(403).json({ message: "Only freelancer accounts can update freelancer profiles." });
    }

    const fullName = sanitizeString(req.body?.fullName, 120);
    const profileData = isPlainObject(req.body?.profileData) ? req.body.profileData : {};
    const skills = sanitizeStringArray(req.body?.skills, 50, 80);
    const portfolio = sanitizePortfolio(req.body?.portfolio);
    const bio = sanitizeString(req.body?.bio, 5000);
    const location = sanitizeString(req.body?.location, 200);
    const profileCompleted = Boolean(req.body?.profileCompleted);
    const profilePhoto = sanitizeString(profileData?.personal?.profilePhoto, 2000);

    const freelancerProfile = await FreelancerProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          profileCompleted,
          profileData,
          skills,
          portfolio,
          bio,
          location,
        },
        $setOnInsert: {
          userId: user._id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    if (fullName.length >= 2 && fullName !== user.fullName) {
      user.fullName = fullName;
    }

    if (profilePhoto && profilePhoto !== user.avatar) {
      user.avatar = profilePhoto;
    }

    await user.save();

    return res.status(200).json({
      message: "Freelancer profile saved.",
      user: serializeUser(user, {
        freelancerProfile: serializeFreelancerProfile(freelancerProfile),
        clientProfile: serializeClientProfile(await ClientProfile.findOne({ userId: user._id })),
      }),
    });
  } catch (error) {
    console.error("freelancer-profile error:", error);
    return res.status(500).json({ message: "Unable to save the freelancer profile right now." });
  }
});

router.put("/client-profile", requireAuth, async (req, res) => {
  try {
    if (req.body?.profileData !== undefined && !isPlainObject(req.body.profileData)) {
      return res.status(400).json({ message: "Client profile data must be an object." });
    }

    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (!isClientRole(user.role)) {
      return res.status(403).json({ message: "Only client accounts can update client profiles." });
    }

    const fullName = sanitizeString(req.body?.fullName, 120);
    const profileData = isPlainObject(req.body?.profileData) ? req.body.profileData : {};
    const profileCompleted = Boolean(req.body?.profileCompleted);
    const profilePhoto = sanitizeString(profileData?.basic?.profilePhoto, 2000);

    const clientProfile = await ClientProfile.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          profileCompleted,
          profileData,
        },
        $setOnInsert: {
          userId: user._id,
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    if (fullName.length >= 2 && fullName !== user.fullName) {
      user.fullName = fullName;
    }

    if (profilePhoto && profilePhoto !== user.avatar) {
      user.avatar = profilePhoto;
    }

    await user.save();

    return res.status(200).json({
      message: "Client profile saved.",
      user: serializeUser(user, {
        freelancerProfile: serializeFreelancerProfile(await FreelancerProfile.findOne({ userId: user._id })),
        clientProfile: serializeClientProfile(clientProfile),
      }),
    });
  } catch (error) {
    console.error("client-profile error:", error);
    return res.status(500).json({ message: "Unable to save the client profile right now." });
  }
});

module.exports = router;
