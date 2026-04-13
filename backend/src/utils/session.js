const jwt = require("jsonwebtoken");
const ClientProfile = require("../models/ClientProfile");
const FreelancerProfile = require("../models/FreelancerProfile");
const User = require("../models/User");
const { isPlainObject, normalizeRole, sanitizePortfolio, sanitizeString, sanitizeStringArray } = require("./common");

const buildAvatarUrl = (seed = "proconnect") =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed || "proconnect")}`;

const resolveAuthProviders = (user) => {
  const providers = Array.isArray(user?.authProviders) ? user.authProviders.filter(Boolean) : [];

  if (providers.length > 0) {
    return Array.from(new Set(providers));
  }

  const inferred = [];
  if (user?.password) inferred.push("local");
  if (user?.googleId) inferred.push("google");
  if (inferred.length === 0) inferred.push("local");
  return inferred;
};

const hasGoogleProvider = (user) => resolveAuthProviders(user).includes("google");

const serializeFreelancerProfile = (profile) => {
  if (!profile) return null;

  return {
    id: profile._id.toString(),
    userId: profile.userId.toString(),
    profileCompleted: Boolean(profile.profileCompleted),
    profileData: isPlainObject(profile.profileData) ? profile.profileData : {},
    skills: sanitizeStringArray(profile.skills),
    portfolio: sanitizePortfolio(profile.portfolio),
    bio: sanitizeString(profile.bio, 5000),
    location: sanitizeString(profile.location, 200),
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
};

const serializeClientProfile = (profile) => {
  if (!profile) return null;

  return {
    id: profile._id.toString(),
    userId: profile.userId.toString(),
    profileCompleted: Boolean(profile.profileCompleted),
    profileData: isPlainObject(profile.profileData) ? profile.profileData : {},
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
};

const serializeUser = (user, profiles = {}) => ({
  id: user._id.toString(),
  email: user.email,
  username: user.username,
  fullName: user.fullName,
  role: normalizeRole(user.role) || null,
  isVerified: user.isVerified,
  avatar: sanitizeString(user.avatar, 2000) || buildAvatarUrl(user.email || user.fullName || user._id.toString()),
  authProviders: resolveAuthProviders(user),
  hasPassword: Boolean(user.password),
  freelancerProfile: profiles.freelancerProfile ?? null,
  clientProfile: profiles.clientProfile ?? null,
});

const loadUserSession = async (userOrId) => {
  const user = userOrId?._id ? userOrId : await User.findById(userOrId);

  if (!user) {
    return null;
  }

  const normalizedRole = normalizeRole(user.role);
  if (normalizedRole && user.role !== normalizedRole) {
    user.role = normalizedRole;
    await user.save();
  }

  const [freelancerProfile, clientProfile] = await Promise.all([
    FreelancerProfile.findOne({ userId: user._id }),
    ClientProfile.findOne({ userId: user._id }),
  ]);

  return {
    user,
    sessionUser: serializeUser(user, {
      freelancerProfile: serializeFreelancerProfile(freelancerProfile),
      clientProfile: serializeClientProfile(clientProfile),
    }),
  };
};

const createToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT secret is not configured.");
  }

  return jwt.sign(
    {
      userId: user._id.toString(),
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );
};

const createSessionResponse = async (user) => {
  const session = await loadUserSession(user);

  if (!session) {
    throw new Error("Unable to load the current session.");
  }

  return {
    token: createToken(session.user),
    user: session.sessionUser,
  };
};

module.exports = {
  buildAvatarUrl,
  createSessionResponse,
  hasGoogleProvider,
  loadUserSession,
  resolveAuthProviders,
  serializeClientProfile,
  serializeFreelancerProfile,
  serializeUser,
};
