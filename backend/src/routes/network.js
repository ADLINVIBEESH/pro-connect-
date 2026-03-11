const express = require("express");
const mongoose = require("mongoose");
const Application = require("../models/Application");
const ClientProfile = require("../models/ClientProfile");
const Job = require("../models/Job");
const SavedJob = require("../models/SavedJob");
const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");
const { isPlainObject, sanitizeNumber, sanitizeString, sanitizeStringArray } = require("../utils/common");
const { buildAvatarUrl } = require("../utils/session");

const router = express.Router();

const applicationStatusValues = new Set(["pending", "shortlisted", "hired", "rejected"]);

const serializeApplication = ({ application, freelancer }) => ({
  id: application._id.toString(),
  jobId: application.jobId.toString(),
  freelancerId: application.freelancerId.toString(),
  freelancerName:
    sanitizeString(freelancer?.fullName, 120) || sanitizeString(freelancer?.username, 120) || freelancer?.email?.split("@")[0] || "Freelancer",
  freelancerAvatar: sanitizeString(freelancer?.avatar, 2000) || buildAvatarUrl(freelancer?.email || freelancer?._id?.toString()),
  coverLetter: sanitizeString(application.coverLetter, 5000),
  status: application.status,
  createdAt: application.createdAt,
  updatedAt: application.updatedAt,
});

const serializeJob = ({ job, clientUser, clientProfile, applicantCount = 0, application = null, saved = false }) => {
  const profileData = isPlainObject(clientProfile?.profileData) ? clientProfile.profileData : {};
  const companyName =
    sanitizeString(profileData?.basic?.companyName, 160) ||
    sanitizeString(profileData?.basic?.fullName, 160) ||
    sanitizeString(clientUser?.fullName, 160) ||
    clientUser?.email?.split("@")[0] ||
    "Client";

  return {
    id: job._id.toString(),
    clientId: job.clientId.toString(),
    clientName: companyName,
    clientAvatar: sanitizeString(clientUser?.avatar, 2000) || buildAvatarUrl(clientUser?.email || companyName),
    title: sanitizeString(job.title, 200),
    description: sanitizeString(job.description, 5000),
    domain: sanitizeString(job.domain, 120),
    subdomain: sanitizeString(job.subdomain, 120),
    requiredSkills: sanitizeStringArray(job.requiredSkills, 30, 80),
    budgetMin: sanitizeNumber(job.budgetMin, 0),
    budgetMax: sanitizeNumber(job.budgetMax, 0),
    timeline: sanitizeString(job.timeline, 200),
    experienceLevel: sanitizeString(job.experienceLevel, 120),
    status: job.status,
    applicantCount,
    application,
    saved,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
};

const loadJobContext = async (jobDocs, viewerId = null) => {
  const jobs = jobDocs.map((entry) => (entry.toObject ? entry.toObject() : entry));
  if (jobs.length === 0) return [];

  const clientIds = Array.from(new Set(jobs.map((job) => job.clientId.toString())));
  const jobIds = jobs.map((job) => job._id);

  const [clientUsers, clientProfiles, applicationCounts, viewerSavedJobs, viewerApplications, viewer] = await Promise.all([
    User.find({ _id: { $in: clientIds } }).lean(),
    ClientProfile.find({ userId: { $in: clientIds } }).lean(),
    Application.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$jobId", count: { $sum: 1 } } },
    ]),
    viewerId ? SavedJob.find({ freelancerId: viewerId, jobId: { $in: jobIds } }).lean() : [],
    viewerId ? Application.find({ freelancerId: viewerId, jobId: { $in: jobIds } }).lean() : [],
    viewerId ? User.findById(viewerId).lean() : null,
  ]);

  const clientUserMap = new Map(clientUsers.map((user) => [user._id.toString(), user]));
  const clientProfileMap = new Map(clientProfiles.map((profile) => [profile.userId.toString(), profile]));
  const applicationCountMap = new Map(applicationCounts.map((entry) => [entry._id.toString(), entry.count]));
  const savedJobSet = new Set(viewerSavedJobs.map((entry) => entry.jobId.toString()));
  const viewerApplicationMap = new Map(viewerApplications.map((entry) => [entry.jobId.toString(), entry]));

  return jobs.map((job) =>
    serializeJob({
      job,
      clientUser: clientUserMap.get(job.clientId.toString()) ?? null,
      clientProfile: clientProfileMap.get(job.clientId.toString()) ?? null,
      applicantCount: applicationCountMap.get(job._id.toString()) ?? 0,
      application: viewerApplicationMap.has(job._id.toString())
        ? serializeApplication({
            application: viewerApplicationMap.get(job._id.toString()),
            freelancer: viewer,
          })
        : null,
      saved: savedJobSet.has(job._id.toString()),
    }),
  );
};

router.get("/jobs", requireAuth, async (req, res) => {
  try {
    const jobs = await Job.find({ status: "open" }).sort({ createdAt: -1 });
    const serialized = await loadJobContext(jobs, req.auth.userId);
    return res.status(200).json({ jobs: serialized });
  } catch (error) {
    console.error("jobs list error:", error);
    return res.status(500).json({ message: "Unable to load jobs right now." });
  }
});

router.get("/jobs/mine", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (user.role !== "client") {
      return res.status(403).json({ message: "Only client accounts can view posted jobs." });
    }

    const jobs = await Job.find({ clientId: user._id }).sort({ createdAt: -1 });
    const serialized = await loadJobContext(jobs);

    if (String(req.query?.includeApplications ?? "").trim() !== "true") {
      return res.status(200).json({ jobs: serialized });
    }

    const jobIds = jobs.map((job) => job._id);
    const applications = await Application.find({ jobId: { $in: jobIds } }).sort({ createdAt: -1 }).lean();
    const freelancerIds = Array.from(new Set(applications.map((application) => application.freelancerId.toString())));
    const freelancers = await User.find({ _id: { $in: freelancerIds } }).lean();
    const freelancerMap = new Map(freelancers.map((entry) => [entry._id.toString(), entry]));
    const groupedApplications = new Map();

    for (const application of applications) {
      const jobId = application.jobId.toString();
      const existing = groupedApplications.get(jobId) ?? [];
      existing.push(
        serializeApplication({
          application,
          freelancer: freelancerMap.get(application.freelancerId.toString()) ?? null,
        }),
      );
      groupedApplications.set(jobId, existing);
    }

    return res.status(200).json({
      jobs: serialized.map((job) => ({
        ...job,
        applications: groupedApplications.get(job.id) ?? [],
      })),
    });
  } catch (error) {
    console.error("my jobs error:", error);
    return res.status(500).json({ message: "Unable to load your jobs right now." });
  }
});

router.get("/jobs/:jobId", requireAuth, async (req, res) => {
  try {
    const jobId = String(req.params?.jobId ?? "").trim();

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job id." });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    const [serialized] = await loadJobContext([job], req.auth.userId);
    return res.status(200).json({ job: serialized ?? null });
  } catch (error) {
    console.error("job detail error:", error);
    return res.status(500).json({ message: "Unable to load that job right now." });
  }
});

router.post("/jobs", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (user.role !== "client") {
      return res.status(403).json({ message: "Only client accounts can post jobs." });
    }

    const title = sanitizeString(req.body?.title, 200);
    const description = sanitizeString(req.body?.description, 5000);
    const domain = sanitizeString(req.body?.domain, 120);
    const subdomain = sanitizeString(req.body?.subdomain, 120);
    const requiredSkills = sanitizeStringArray(req.body?.requiredSkills, 30, 80);
    const budgetMin = Math.max(0, sanitizeNumber(req.body?.budgetMin, 0));
    const budgetMax = Math.max(0, sanitizeNumber(req.body?.budgetMax, 0));
    const timeline = sanitizeString(req.body?.timeline, 200);
    const experienceLevel = sanitizeString(req.body?.experienceLevel, 120);

    if (title.length < 3) {
      return res.status(400).json({ message: "Job title must be at least 3 characters." });
    }

    if (description.length < 20) {
      return res.status(400).json({ message: "Job description must be at least 20 characters." });
    }

    if (requiredSkills.length === 0) {
      return res.status(400).json({ message: "Add at least one required skill." });
    }

    const job = await Job.create({
      clientId: user._id,
      title,
      description,
      domain,
      subdomain,
      requiredSkills,
      budgetMin,
      budgetMax: budgetMax >= budgetMin ? budgetMax : budgetMin,
      timeline,
      experienceLevel,
      status: "open",
    });

    const [serialized] = await loadJobContext([job]);
    return res.status(201).json({ job: serialized });
  } catch (error) {
    console.error("create job error:", error);
    return res.status(500).json({ message: "Unable to create the job right now." });
  }
});

router.delete("/jobs/:jobId", requireAuth, async (req, res) => {
  try {
    const jobId = String(req.params?.jobId ?? "").trim();

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job id." });
    }

    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (user.role !== "client") {
      return res.status(403).json({ message: "Only client accounts can delete jobs." });
    }

    const job = await Job.findOne({ _id: jobId, clientId: user._id });

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    await Promise.all([
      Application.deleteMany({ jobId: job._id }),
      SavedJob.deleteMany({ jobId: job._id }),
      Job.deleteOne({ _id: job._id }),
    ]);

    return res.status(200).json({ message: "Job deleted successfully." });
  } catch (error) {
    console.error("delete job error:", error);
    return res.status(500).json({ message: "Unable to delete the job right now." });
  }
});

router.post("/jobs/:jobId/applications", requireAuth, async (req, res) => {
  try {
    const jobId = String(req.params?.jobId ?? "").trim();

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job id." });
    }

    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancer accounts can apply to jobs." });
    }

    const job = await Job.findOne({ _id: jobId, status: "open" });

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    if (job.clientId.toString() === user._id.toString()) {
      return res.status(400).json({ message: "You cannot apply to your own job." });
    }

    const coverLetter = sanitizeString(req.body?.coverLetter, 5000);

    if (coverLetter.length < 10) {
      return res.status(400).json({ message: "Cover letter must be at least 10 characters." });
    }

    const application = await Application.create({
      jobId: job._id,
      freelancerId: user._id,
      coverLetter,
      status: "pending",
    }).catch((error) => {
      if (error?.code === 11000) {
        return null;
      }

      throw error;
    });

    if (!application) {
      return res.status(409).json({ message: "You have already applied to this job." });
    }

    return res.status(201).json({
      application: serializeApplication({
        application,
        freelancer: user,
      }),
    });
  } catch (error) {
    console.error("create application error:", error);
    return res.status(500).json({ message: "Unable to submit the application right now." });
  }
});

router.get("/jobs/:jobId/applications", requireAuth, async (req, res) => {
  try {
    const jobId = String(req.params?.jobId ?? "").trim();

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job id." });
    }

    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (user.role !== "client") {
      return res.status(403).json({ message: "Only client accounts can view applicants." });
    }

    const job = await Job.findOne({ _id: jobId, clientId: user._id });

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    const applications = await Application.find({ jobId: job._id }).sort({ createdAt: -1 }).lean();
    const freelancerIds = Array.from(new Set(applications.map((application) => application.freelancerId.toString())));
    const freelancers = await User.find({ _id: { $in: freelancerIds } }).lean();
    const freelancerMap = new Map(freelancers.map((entry) => [entry._id.toString(), entry]));

    return res.status(200).json({
      applications: applications.map((application) =>
        serializeApplication({
          application,
          freelancer: freelancerMap.get(application.freelancerId.toString()) ?? null,
        }),
      ),
    });
  } catch (error) {
    console.error("applications list error:", error);
    return res.status(500).json({ message: "Unable to load applicants right now." });
  }
});

router.get("/applications/mine", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancer accounts can view applications." });
    }

    const applications = await Application.find({ freelancerId: user._id }).sort({ createdAt: -1 }).lean();
    const jobIds = Array.from(new Set(applications.map((application) => application.jobId.toString())));
    const jobs = await Job.find({ _id: { $in: jobIds } }).lean();
    const serializedJobs = await loadJobContext(jobs, user._id.toString());
    const jobMap = new Map(serializedJobs.map((job) => [job.id, job]));

    return res.status(200).json({
      applications: applications.map((application) => ({
        ...serializeApplication({ application, freelancer: user }),
        job: jobMap.get(application.jobId.toString()) ?? null,
      })),
    });
  } catch (error) {
    console.error("my applications error:", error);
    return res.status(500).json({ message: "Unable to load your applications right now." });
  }
});

router.patch("/applications/:applicationId/status", requireAuth, async (req, res) => {
  try {
    const applicationId = String(req.params?.applicationId ?? "").trim();

    if (!mongoose.isValidObjectId(applicationId)) {
      return res.status(400).json({ message: "Invalid application id." });
    }

    const nextStatus = sanitizeString(req.body?.status, 32);

    if (!applicationStatusValues.has(nextStatus)) {
      return res.status(400).json({ message: "Choose a valid application status." });
    }

    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (user.role !== "client") {
      return res.status(403).json({ message: "Only client accounts can update application status." });
    }

    const application = await Application.findById(applicationId);

    if (!application) {
      return res.status(404).json({ message: "Application not found." });
    }

    const job = await Job.findOne({ _id: application.jobId, clientId: user._id });

    if (!job) {
      return res.status(404).json({ message: "Application not found." });
    }

    application.status = nextStatus;
    await application.save();

    const freelancer = await User.findById(application.freelancerId);

    return res.status(200).json({
      application: serializeApplication({
        application,
        freelancer,
      }),
    });
  } catch (error) {
    console.error("update application status error:", error);
    return res.status(500).json({ message: "Unable to update the application right now." });
  }
});

router.get("/saved-jobs", requireAuth, async (req, res) => {
  try {
    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancer accounts can view saved jobs." });
    }

    const savedJobs = await SavedJob.find({ freelancerId: user._id }).sort({ createdAt: -1 }).lean();
    const jobIds = Array.from(new Set(savedJobs.map((entry) => entry.jobId.toString())));
    const jobs = await Job.find({ _id: { $in: jobIds } }).lean();
    const serializedJobs = await loadJobContext(jobs, user._id.toString());

    return res.status(200).json({ jobs: serializedJobs });
  } catch (error) {
    console.error("saved jobs error:", error);
    return res.status(500).json({ message: "Unable to load saved jobs right now." });
  }
});

router.post("/saved-jobs/:jobId", requireAuth, async (req, res) => {
  try {
    const jobId = String(req.params?.jobId ?? "").trim();

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job id." });
    }

    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancer accounts can save jobs." });
    }

    const job = await Job.findById(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found." });
    }

    await SavedJob.updateOne(
      { freelancerId: user._id, jobId: job._id },
      { $setOnInsert: { freelancerId: user._id, jobId: job._id } },
      { upsert: true },
    );

    return res.status(200).json({ message: "Job saved." });
  } catch (error) {
    console.error("save job error:", error);
    return res.status(500).json({ message: "Unable to save the job right now." });
  }
});

router.delete("/saved-jobs/:jobId", requireAuth, async (req, res) => {
  try {
    const jobId = String(req.params?.jobId ?? "").trim();

    if (!mongoose.isValidObjectId(jobId)) {
      return res.status(400).json({ message: "Invalid job id." });
    }

    const user = await User.findById(req.auth.userId);

    if (!user) {
      return res.status(401).json({ message: "Invalid or expired session. Please log in again." });
    }

    if (user.role !== "freelancer") {
      return res.status(403).json({ message: "Only freelancer accounts can remove saved jobs." });
    }

    await SavedJob.deleteOne({ freelancerId: user._id, jobId });
    return res.status(200).json({ message: "Saved job removed." });
  } catch (error) {
    console.error("remove saved job error:", error);
    return res.status(500).json({ message: "Unable to remove the saved job right now." });
  }
});

module.exports = router;
