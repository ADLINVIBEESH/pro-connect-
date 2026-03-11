const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authHeader = req.get("authorization") || req.get("Authorization") || "";

  if (!authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authentication required." });
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ message: "JWT secret is not configured." });
  }

  try {
    const token = authHeader.slice("Bearer ".length).trim();
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    req.auth = {
      userId: String(payload.userId ?? ""),
      email: String(payload.email ?? ""),
    };

    return next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
  }
};
