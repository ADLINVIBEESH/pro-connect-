import { apiRequest } from "@/lib/apiClient";

export interface JobRecord {
  id: string;
  clientId: string;
  clientName: string;
  clientAvatar: string;
  title: string;
  description: string;
  domain: string;
  subdomain: string;
  requiredSkills: string[];
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  experienceLevel: string;
  status: "open" | "closed";
  applicantCount: number;
  saved: boolean;
  createdAt?: string;
  updatedAt?: string;
  application?: ApplicationRecord | null;
  applications?: ApplicationRecord[];
}

export interface ApplicationRecord {
  id: string;
  jobId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  coverLetter: string;
  status: "pending" | "shortlisted" | "hired" | "rejected";
  createdAt?: string;
  updatedAt?: string;
  job?: JobRecord | null;
}

export interface CreateJobPayload {
  title: string;
  description: string;
  domain: string;
  subdomain: string;
  requiredSkills: string[];
  budgetMin: number;
  budgetMax: number;
  timeline: string;
  experienceLevel: string;
}

export const fetchJobsRequest = () => apiRequest<{ jobs: JobRecord[] }>("/api/jobs");

export const fetchJobRequest = (jobId: string) => apiRequest<{ job: JobRecord | null }>(`/api/jobs/${jobId}`);

export const fetchMyJobsRequest = (includeApplications = false) =>
  apiRequest<{ jobs: JobRecord[] }>(`/api/jobs/mine${includeApplications ? "?includeApplications=true" : ""}`);

export const createJobRequest = (payload: CreateJobPayload) =>
  apiRequest<{ job: JobRecord }>("/api/jobs", {
    method: "POST",
    body: payload,
  });

export const deleteJobRequest = (jobId: string) =>
  apiRequest<{ message: string }>(`/api/jobs/${jobId}`, {
    method: "DELETE",
  });

export const applyToJobRequest = (jobId: string, coverLetter: string) =>
  apiRequest<{ application: ApplicationRecord }>(`/api/jobs/${jobId}/applications`, {
    method: "POST",
    body: { coverLetter },
  });

export const fetchJobApplicationsRequest = (jobId: string) =>
  apiRequest<{ applications: ApplicationRecord[] }>(`/api/jobs/${jobId}/applications`);

export const fetchMyApplicationsRequest = () => apiRequest<{ applications: ApplicationRecord[] }>("/api/applications/mine");

export const updateApplicationStatusRequest = (
  applicationId: string,
  status: ApplicationRecord["status"],
) =>
  apiRequest<{ application: ApplicationRecord }>(`/api/applications/${applicationId}/status`, {
    method: "PATCH",
    body: { status },
  });

export const fetchSavedJobsRequest = () => apiRequest<{ jobs: JobRecord[] }>("/api/saved-jobs");

export const saveJobRequest = (jobId: string) =>
  apiRequest<{ message: string }>(`/api/saved-jobs/${jobId}`, {
    method: "POST",
  });

export const unsaveJobRequest = (jobId: string) =>
  apiRequest<{ message: string }>(`/api/saved-jobs/${jobId}`, {
    method: "DELETE",
  });
