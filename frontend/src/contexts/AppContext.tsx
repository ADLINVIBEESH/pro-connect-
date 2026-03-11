import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { jobs as mockJobs, freelancers as mockFreelancers, Job, Freelancer } from "@/data/mockData";

export interface Application {
  id: string;
  jobId: string;
  freelancerId: string;
  freelancerName: string;
  freelancerAvatar: string;
  coverLetter: string;
  status: "pending" | "shortlisted" | "hired" | "rejected";
  appliedAt: string;
}

export interface Invitation {
  id: string;
  jobId: string;
  freelancerId: string;
  hirerId: string;
  hirerName: string;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
}

export interface PostedJob extends Job {
  createdBy: string;
  applicants: Application[];
  status: "open" | "closed";
  experienceLevel: string;
}

interface AppContextType {
  jobs: PostedJob[];
  freelancers: Freelancer[];
  applications: Application[];
  invitations: Invitation[];
  postJob: (job: Omit<PostedJob, "id" | "applicants" | "status">) => void;
  deleteJob: (jobId: string) => void;
  applyToJob: (jobId: string, freelancerId: string, freelancerName: string, freelancerAvatar: string, coverLetter: string) => void;
  updateApplicationStatus: (appId: string, status: Application["status"]) => void;
  getJobApplications: (jobId: string) => Application[];
  getFreelancerApplications: (freelancerId: string) => Application[];
  savedJobs: string[];
  toggleSaveJob: (jobId: string) => void;
  updateFreelancer: (id: string, data: Partial<Freelancer>) => void;
  sendInvitation: (jobId: string, freelancerId: string, hirerId: string, hirerName: string) => void;
  acceptInvitation: (invitationId: string) => void;
  rejectInvitation: (invitationId: string) => void;
  getFreelancerInvitations: (freelancerId: string) => Invitation[];
  getHirerInvitations: (hirerId: string) => Invitation[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [freelancers, setFreelancers] = useState<Freelancer[]>(() => {
    const saved = localStorage.getItem("proconnect_freelancers");
    return saved ? JSON.parse(saved) : mockFreelancers;
  });

  const [jobs, setJobs] = useState<PostedJob[]>(() => {
    const saved = localStorage.getItem("proconnect_jobs");
    if (saved) return JSON.parse(saved);
    return mockJobs.map((j) => ({
      ...j,
      createdBy: "hirer-1",
      applicants: [],
      status: "open" as const,
      experienceLevel: "Mid-Level",
    }));
  });

  const [applications, setApplications] = useState<Application[]>(() => {
    const saved = localStorage.getItem("proconnect_applications");
    return saved ? JSON.parse(saved) : [];
  });

  const [invitations, setInvitations] = useState<Invitation[]>(() => {
    const saved = localStorage.getItem("proconnect_invitations");
    return saved ? JSON.parse(saved) : [];
  });

  const [savedJobs, setSavedJobs] = useState<string[]>(() => {
    const saved = localStorage.getItem("proconnect_saved_jobs");
    return saved ? JSON.parse(saved) : [];
  });

  const persistJobs = (j: PostedJob[]) => {
    setJobs(j);
    localStorage.setItem("proconnect_jobs", JSON.stringify(j));
  };

  const persistApps = (a: Application[]) => {
    setApplications(a);
    localStorage.setItem("proconnect_applications", JSON.stringify(a));
  };

  const persistInvitations = (inv: Invitation[]) => {
    setInvitations(inv);
    localStorage.setItem("proconnect_invitations", JSON.stringify(inv));
  };

  const postJob = (job: Omit<PostedJob, "id" | "applicants" | "status">) => {
    const newJob: PostedJob = {
      ...job,
      id: `job-${Date.now()}`,
      applicants: [],
      status: "open",
    };
    persistJobs([newJob, ...jobs]);
  };

  const deleteJob = (jobId: string) => {
    persistJobs(jobs.filter((j) => j.id !== jobId));
    persistApps(applications.filter((a) => a.jobId !== jobId));
  };

  const applyToJob = (jobId: string, freelancerId: string, freelancerName: string, freelancerAvatar: string, coverLetter: string) => {
    const exists = applications.find((a) => a.jobId === jobId && a.freelancerId === freelancerId);
    if (exists) return;
    const app: Application = {
      id: `app-${Date.now()}`,
      jobId,
      freelancerId,
      freelancerName,
      freelancerAvatar,
      coverLetter,
      status: "pending",
      appliedAt: new Date().toLocaleDateString(),
    };
    persistApps([app, ...applications]);
  };

  const updateApplicationStatus = (appId: string, status: Application["status"]) => {
    persistApps(applications.map((a) => (a.id === appId ? { ...a, status } : a)));
  };

  const getJobApplications = useCallback(
    (jobId: string) => applications.filter((a) => a.jobId === jobId),
    [applications]
  );

  const getFreelancerApplications = useCallback(
    (freelancerId: string) => applications.filter((a) => a.freelancerId === freelancerId),
    [applications]
  );

  const toggleSaveJob = (jobId: string) => {
    const next = savedJobs.includes(jobId)
      ? savedJobs.filter((id) => id !== jobId)
      : [...savedJobs, jobId];
    setSavedJobs(next);
    localStorage.setItem("proconnect_saved_jobs", JSON.stringify(next));
  };

  const updateFreelancer = (id: string, data: Partial<Freelancer>) => {
    const updated = freelancers.map((f) => (f.id === id ? { ...f, ...data } : f));
    setFreelancers(updated);
    localStorage.setItem("proconnect_freelancers", JSON.stringify(updated));
  };

  const sendInvitation = (jobId: string, freelancerId: string, hirerId: string, hirerName: string) => {
    const exists = invitations.find((i) => i.jobId === jobId && i.freelancerId === freelancerId && i.status === "pending");
    if (exists) return;
    const inv: Invitation = {
      id: `inv-${Date.now()}`,
      jobId,
      freelancerId,
      hirerId,
      hirerName,
      status: "pending",
      createdAt: new Date().toLocaleDateString(),
    };
    persistInvitations([inv, ...invitations]);
  };

  const acceptInvitation = (invitationId: string) => {
    persistInvitations(invitations.map((i) => (i.id === invitationId ? { ...i, status: "accepted" } : i)));
  };

  const rejectInvitation = (invitationId: string) => {
    persistInvitations(invitations.map((i) => (i.id === invitationId ? { ...i, status: "rejected" } : i)));
  };

  const getFreelancerInvitations = useCallback(
    (freelancerId: string) => invitations.filter((i) => i.freelancerId === freelancerId),
    [invitations]
  );

  const getHirerInvitations = useCallback(
    (hirerId: string) => invitations.filter((i) => i.hirerId === hirerId),
    [invitations]
  );

  return (
    <AppContext.Provider
      value={{
        jobs,
        freelancers,
        applications,
        invitations,
        postJob,
        deleteJob,
        applyToJob,
        updateApplicationStatus,
        getJobApplications,
        getFreelancerApplications,
        savedJobs,
        toggleSaveJob,
        updateFreelancer,
        sendInvitation,
        acceptInvitation,
        rejectInvitation,
        getFreelancerInvitations,
        getHirerInvitations,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
