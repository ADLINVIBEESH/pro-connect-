const nodemailer = require("nodemailer");

const trimEnv = (value) => (typeof value === "string" ? value.trim() : "");

const firstEnv = (...keys) => {
  for (const key of keys) {
    const value = trimEnv(process.env[key]);

    if (value) {
      return value;
    }
  }

  return "";
};

const parseBoolean = (value, fallback = false) => {
  if (typeof value !== "string") {
    return fallback;
  }

  switch (value.trim().toLowerCase()) {
    case "1":
    case "true":
    case "yes":
    case "on":
      return true;
    case "0":
    case "false":
    case "no":
    case "off":
      return false;
    default:
      return fallback;
  }
};

const getTransportConfig = () => {
  const user = firstEnv("SMTP_USER", "EMAIL_USER");
  const pass = firstEnv("SMTP_PASS", "EMAIL_APP_PASSWORD", "EMAIL_PASSWORD", "EMAIL_PASS");

  if (!user || !pass) {
    return null;
  }

  const fromAddress = firstEnv("SMTP_FROM", "EMAIL_FROM") || user;
  const fromName = firstEnv("SMTP_FROM_NAME", "EMAIL_FROM_NAME") || "ProConnect";
  const service = firstEnv("SMTP_SERVICE", "EMAIL_SERVICE");
  const host = firstEnv("SMTP_HOST");
  const portValue = firstEnv("SMTP_PORT");
  const parsedPort = Number.parseInt(portValue, 10);
  const port = Number.isFinite(parsedPort) ? parsedPort : undefined;

  if (host) {
    return {
      description: `SMTP ${host}:${port ?? 587}`,
      fromAddress,
      fromName,
      transport: {
        host,
        port: port ?? 587,
        secure: parseBoolean(process.env.SMTP_SECURE, (port ?? 587) === 465),
        auth: {
          user,
          pass,
        },
      },
    };
  }

  const resolvedService = service || (user.toLowerCase().endsWith("@gmail.com") ? "gmail" : "");

  if (!resolvedService) {
    return null;
  }

  return {
    description: resolvedService,
    fromAddress,
    fromName,
    transport: {
      service: resolvedService,
      auth: {
        user,
        pass,
      },
    },
  };
};

const hasEmailConfig = () => Boolean(getTransportConfig());

const createMailer = () => {
  const config = getTransportConfig();

  if (!config) {
    throw new Error("Email service is not configured.");
  }

  return nodemailer.createTransport(config.transport);
};

module.exports = {
  createMailer,
  getTransportConfig,
  hasEmailConfig,
};
