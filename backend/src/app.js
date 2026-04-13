const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth");
const networkRoutes = require("./routes/network");
const userRoutes = require("./routes/users");
const chatRoutes = require("./routes/chat");

const createApp = () => {
  const app = express();
  const allowedOrigin = process.env.FRONTEND_URL || "http://localhost:8080";
  const allowedOrigins = allowedOrigin
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const jsonBodyLimit = "12mb";

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          return callback(null, true);
        }

        if (process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }

        return callback(new Error("Not allowed by CORS"));
      },
    }),
  );
  app.use(express.json({ limit: jsonBodyLimit }));
  app.use(express.urlencoded({ extended: true, limit: jsonBodyLimit }));

  app.get("/", (_req, res) => {
    res.json({ message: "ProConnect backend running!" });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/users", userRoutes);
  app.use("/api/chat", chatRoutes);
  app.use("/api", networkRoutes);

  app.use((error, _req, res, next) => {
    if (error?.type === "entity.too.large") {
      return res.status(413).json({
        message: "Uploaded profile data is too large. Use fewer or smaller images and try again.",
      });
    }

    return next(error);
  });

  return app;
};

module.exports = createApp;
