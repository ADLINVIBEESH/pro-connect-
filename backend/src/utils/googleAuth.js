const { OAuth2Client } = require("google-auth-library");

let cachedClient = null;

const getGoogleClientId = () => String(process.env.GOOGLE_CLIENT_ID ?? "").trim();

const getGoogleClient = () => {
  if (!cachedClient) {
    cachedClient = new OAuth2Client();
  }

  return cachedClient;
};

const verifyGoogleCredential = async (credential) => {
  const token = String(credential ?? "").trim();
  const clientId = getGoogleClientId();

  if (!clientId) {
    throw new Error("Google authentication is not configured.");
  }

  if (!token) {
    throw new Error("Google credential is required.");
  }

  const ticket = await getGoogleClient().verifyIdToken({
    idToken: token,
    audience: clientId,
  });

  const payload = ticket.getPayload();

  if (!payload?.email || !payload.sub) {
    throw new Error("Unable to verify the Google account.");
  }

  if (!payload.email_verified) {
    throw new Error("Google account email is not verified.");
  }

  return {
    email: String(payload.email).trim().toLowerCase(),
    emailVerified: Boolean(payload.email_verified),
    googleId: String(payload.sub),
    fullName: String(payload.name ?? "").trim(),
    avatar: String(payload.picture ?? "").trim(),
  };
};

module.exports = {
  verifyGoogleCredential,
};
