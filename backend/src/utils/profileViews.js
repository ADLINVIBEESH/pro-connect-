const { buildAvatarUrl, serializeClientProfile, serializeFreelancerProfile, serializeUser } = require("./session");
const { isPlainObject, normalizeRole, sanitizeNumber, sanitizeString, sanitizeStringArray } = require("./common");

const getNestedArray = (source, path) => {
  let current = source;

  for (const key of path) {
    if (!current || typeof current !== "object") {
      return [];
    }

    current = current[key];
  }

  return Array.isArray(current) ? current : [];
};

const getNestedString = (source, path, maxLength = 200) => {
  let current = source;

  for (const key of path) {
    if (!current || typeof current !== "object") {
      return "";
    }

    current = current[key];
  }

  return sanitizeString(current, maxLength);
};

const extractFreelancerDomains = (profileData) =>
  sanitizeStringArray(getNestedArray(profileData, ["professional", "domains"]), 20, 120);

const extractFreelancerSubdomains = (profileData) =>
  sanitizeStringArray(
    getNestedArray(profileData, ["professional", "specializations"]).concat(
      getNestedArray(profileData, ["expertise", "specializations"]),
    ),
    20,
    120,
  );

const extractFreelancerSkills = (profile, profileData) => {
  const directSkills = sanitizeStringArray(profile?.skills, 20, 80);
  if (directSkills.length > 0) return directSkills;

  const expertiseSkills = getNestedArray(profileData, ["expertise", "primarySkills"])
    .map((entry) => sanitizeString(entry?.name, 80))
    .filter(Boolean);

  return sanitizeStringArray(expertiseSkills, 20, 80);
};

const getFreelancerSummary = ({ user, profile }) => {
  const profileData = isPlainObject(profile?.profileData) ? profile.profileData : {};
  const domains = extractFreelancerDomains(profileData);
  const subdomains = extractFreelancerSubdomains(profileData);
  const skills = extractFreelancerSkills(profile, profileData);
  const hourlyRateMin = getNestedString(profileData, ["payment", "hourlyRateMin"], 40);
  const hourlyRateMax = getNestedString(profileData, ["payment", "hourlyRateMax"], 40);

  return {
    userId: user._id.toString(),
    name: sanitizeString(user.fullName, 120) || sanitizeString(user.username, 120) || user.email.split("@")[0],
    email: user.email,
    username: user.username,
    avatar: sanitizeString(user.avatar, 2000) || buildAvatarUrl(user.email || user.fullName || user._id.toString()),
    title:
      getNestedString(profileData, ["professional", "title"], 140) ||
      subdomains[0] ||
      domains[0] ||
      "Freelancer",
    bio:
      sanitizeString(profile?.bio, 2000) ||
      getNestedString(profileData, ["professional", "overview"], 2000) ||
      getNestedString(profileData, ["personal", "tagline"], 500),
    location:
      sanitizeString(profile?.location, 200) ||
      [getNestedString(profileData, ["personal", "city"], 80), getNestedString(profileData, ["personal", "country"], 80)]
        .filter(Boolean)
        .join(", "),
    domains,
    subdomains,
    skills,
    hourlyRateMin: sanitizeNumber(hourlyRateMin, 0),
    hourlyRateMax: sanitizeNumber(hourlyRateMax, 0),
    profileCompleted: Boolean(profile?.profileCompleted),
    createdAt: profile?.createdAt ?? user.createdAt,
    updatedAt: profile?.updatedAt ?? user.updatedAt,
  };
};

const getClientSummary = ({ user, profile }) => {
  const profileData = isPlainObject(profile?.profileData) ? profile.profileData : {};
  const companyName = getNestedString(profileData, ["basic", "companyName"], 160);
  const fullName = getNestedString(profileData, ["basic", "fullName"], 160);

  return {
    userId: user._id.toString(),
    name: companyName || fullName || sanitizeString(user.fullName, 120) || user.email.split("@")[0],
    email: user.email,
    username: user.username,
    avatar: sanitizeString(user.avatar, 2000) || buildAvatarUrl(user.email || user.fullName || user._id.toString()),
    bio: getNestedString(profileData, ["about", "bio"], 2000),
    skills: sanitizeStringArray(getNestedArray(profileData, ["hiring", "skills"]), 20, 80),
    domains: sanitizeStringArray(getNestedArray(profileData, ["hiring", "domains"]), 20, 120),
    subdomains: sanitizeStringArray(getNestedArray(profileData, ["hiring", "subdomains"]), 20, 120),
    createdAt: profile?.createdAt ?? user.createdAt,
    updatedAt: profile?.updatedAt ?? user.updatedAt,
  };
};

const buildReadOnlyProfilePayload = ({ user, freelancerProfile, clientProfile }) => {
  const role = normalizeRole(user.role) || null;
  const userPayload = serializeUser(user, {
    freelancerProfile: serializeFreelancerProfile(freelancerProfile),
    clientProfile: serializeClientProfile(clientProfile),
  });

  if (role === "freelancer") {
    return {
      role,
      user: userPayload,
      summary: getFreelancerSummary({ user, profile: freelancerProfile }),
    };
  }

  if (role === "client") {
    return {
      role,
      user: userPayload,
      summary: getClientSummary({ user, profile: clientProfile }),
    };
  }

  return {
    role,
    user: userPayload,
    summary: null,
  };
};

module.exports = {
  buildReadOnlyProfilePayload,
  getClientSummary,
  getFreelancerSummary,
};
