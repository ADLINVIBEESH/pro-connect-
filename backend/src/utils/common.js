const validRoles = new Set(["freelancer", "client"]);

const normalizeEmail = (value = "") => String(value).trim().toLowerCase();

const normalizeUsername = (value = "") =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 24);

const normalizeRole = (value = "") => {
  const normalized = String(value).trim().toLowerCase();

  if (normalized === "hirer") {
    return "client";
  }

  return validRoles.has(normalized) ? normalized : "";
};

const isPlainObject = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);

const sanitizeString = (value = "", maxLength = 5000) => String(value ?? "").trim().slice(0, maxLength);

const sanitizeStringArray = (value, maxItems = 50, maxItemLength = 120) => {
  if (!Array.isArray(value)) return [];

  const items = value
    .map((item) => sanitizeString(item, maxItemLength))
    .filter(Boolean);

  return Array.from(new Set(items)).slice(0, maxItems);
};

const sanitizePortfolio = (value, maxItems = 20) => (Array.isArray(value) ? value.slice(0, maxItems) : []);

const sanitizeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseStringArray = (value, maxItems = 20, maxItemLength = 120) =>
  sanitizeStringArray(Array.isArray(value) ? value : [], maxItems, maxItemLength);

module.exports = {
  isPlainObject,
  normalizeEmail,
  normalizeRole,
  normalizeUsername,
  parseStringArray,
  sanitizeNumber,
  sanitizePortfolio,
  sanitizeString,
  sanitizeStringArray,
};
