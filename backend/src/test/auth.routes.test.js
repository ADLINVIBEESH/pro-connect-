const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");
const request = require("supertest");
const { afterAll, beforeAll, beforeEach, describe, expect, it, vi } = require("vitest");
const googleAuth = require("../utils/googleAuth");
googleAuth.verifyGoogleCredential = vi.fn();
const createApp = require("../app");
const Application = require("../models/Application");
const ClientProfile = require("../models/ClientProfile");
const FreelancerProfile = require("../models/FreelancerProfile");
const Job = require("../models/Job");
const SavedJob = require("../models/SavedJob");
const User = require("../models/User");
const { verifyGoogleCredential } = googleAuth;

describe("auth and account routes", () => {
  let mongoServer;
  let app;

  beforeAll(async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "test-secret";
    process.env.GOOGLE_CLIENT_ID = "test-google-client-id.apps.googleusercontent.com";
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri(), { dbName: "proconnect-test" });
    app = createApp();
  });

  beforeEach(async () => {
    vi.clearAllMocks();
    await Promise.all([
      User.deleteMany({}),
      FreelancerProfile.deleteMany({}),
      ClientProfile.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      SavedJob.deleteMany({}),
    ]);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  const signToken = (user) =>
    jwt.sign(
      {
        userId: user._id.toString(),
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

  it("completes OTP signup and password login without breaking the local flow", async () => {
    const email = "local.user@example.com";

    const sendOtpResponse = await request(app).post("/api/auth/send-otp").send({ email });
    expect(sendOtpResponse.status).toBe(200);

    const pendingUser = await User.findOne({ email });
    expect(pendingUser).toBeTruthy();

    const verifyOtpResponse = await request(app).post("/api/auth/verify-otp").send({
      email,
      otp: pendingUser.verificationCode,
    });
    expect(verifyOtpResponse.status).toBe(200);

    const completeSignupResponse = await request(app).post("/api/auth/complete-signup").send({
      userId: pendingUser._id.toString(),
      username: "local.user",
      fullName: "Local User",
      password: "Password123!",
    });

    expect(completeSignupResponse.status).toBe(201);
    expect(completeSignupResponse.body.user.authProviders).toContain("local");
    expect(completeSignupResponse.body.user.hasPassword).toBe(true);

    const loginResponse = await request(app).post("/api/auth/login").send({
      email,
      password: "Password123!",
    });

    expect(loginResponse.status).toBe(200);
    expect(loginResponse.body.user.email).toBe(email);
    expect(loginResponse.body.user.authProviders).toContain("local");
  });

  it("links Google sign-in to an existing local account with the same email instead of creating a duplicate", async () => {
    const passwordHash = await bcrypt.hash("Password123!", 12);
    const localUser = await User.create({
      email: "same.email@gmail.com",
      fullName: "Same Email",
      username: "same.email",
      password: passwordHash,
      authProviders: ["local"],
      isVerified: true,
    });

    verifyGoogleCredential.mockResolvedValue({
      email: "same.email@gmail.com",
      googleId: "google-user-1",
      fullName: "Same Email",
      avatar: "https://example.com/avatar.png",
      emailVerified: true,
    });

    const response = await request(app).post("/api/auth/google").send({
      credential: "google-token",
    });

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(localUser._id.toString());
    expect(response.body.user.authProviders.sort()).toEqual(["google", "local"]);

    const users = await User.find({ email: "same.email@gmail.com" });
    expect(users).toHaveLength(1);
    expect(users[0].googleId).toBe("google-user-1");
  });

  it("deletes a local account and cascades related jobs, applications, profiles, and saved jobs", async () => {
    const client = await User.create({
      email: "client@example.com",
      fullName: "Client User",
      password: await bcrypt.hash("Password123!", 12),
      role: "client",
      isVerified: true,
      authProviders: ["local"],
    });
    const freelancer = await User.create({
      email: "freelancer@example.com",
      fullName: "Freelancer User",
      password: await bcrypt.hash("Password123!", 12),
      role: "freelancer",
      isVerified: true,
      authProviders: ["local"],
    });

    await ClientProfile.create({
      userId: client._id,
      profileCompleted: true,
      profileData: { basic: { companyName: "Client Co" } },
    });
    await FreelancerProfile.create({
      userId: freelancer._id,
      profileCompleted: true,
      profileData: { professional: { title: "React Developer" } },
      skills: ["React"],
    });

    const job = await Job.create({
      clientId: client._id,
      title: "Need a React dev",
      description: "A longer description for a real job posting.",
      domain: "Frontend",
      subdomain: "React",
      requiredSkills: ["React", "TypeScript"],
      budgetMin: 1000,
      budgetMax: 2000,
      timeline: "2 weeks",
      experienceLevel: "Mid-Level",
      status: "open",
    });

    await Application.create({
      jobId: job._id,
      freelancerId: freelancer._id,
      coverLetter: "I can help with this project and have done similar work before.",
      status: "pending",
    });
    await SavedJob.create({
      jobId: job._id,
      freelancerId: freelancer._id,
    });

    const response = await request(app)
      .delete("/api/users/delete-account")
      .set("Authorization", `Bearer ${signToken(client)}`)
      .send({ password: "Password123!" });

    expect(response.status).toBe(200);
    expect(await User.findById(client._id)).toBeNull();
    expect(await ClientProfile.findOne({ userId: client._id })).toBeNull();
    expect(await Job.findById(job._id)).toBeNull();
    expect(await Application.findOne({ jobId: job._id })).toBeNull();
    expect(await SavedJob.findOne({ jobId: job._id })).toBeNull();
  });

  it("requires fresh Google re-authentication to delete a Google-only account", async () => {
    const user = await User.create({
      email: "google.only@example.com",
      fullName: "Google Only",
      googleId: "google-only-1",
      authProviders: ["google"],
      isVerified: true,
    });

    verifyGoogleCredential.mockResolvedValue({
      email: "google.only@example.com",
      googleId: "google-only-1",
      fullName: "Google Only",
      avatar: "",
      emailVerified: true,
    });

    const response = await request(app)
      .delete("/api/users/delete-account")
      .set("Authorization", `Bearer ${signToken(user)}`)
      .send({ googleCredential: "fresh-google-token" });

    expect(response.status).toBe(200);
    expect(await User.findById(user._id)).toBeNull();
  });
});
