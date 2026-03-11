import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Clock,
  DollarSign,
  Briefcase,
  Bookmark,
  BookmarkCheck,
  CheckCircle,
  XCircle,
  UserCheck,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  applyToJobRequest,
  fetchJobApplicationsRequest,
  fetchJobRequest,
  saveJobRequest,
  unsaveJobRequest,
  updateApplicationStatusRequest,
} from "@/lib/networkApi";

const statusColors: Record<string, string> = {
  pending: "bg-primary/10 text-primary",
  shortlisted: "bg-secondary/10 text-secondary",
  hired: "bg-secondary text-secondary-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

const JobDetail = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState("");
  const [showApplyForm, setShowApplyForm] = useState(false);

  const jobQuery = useQuery({
    queryKey: ["job-detail", id],
    queryFn: () => fetchJobRequest(id),
    enabled: Boolean(id),
  });

  const applicationsQuery = useQuery({
    queryKey: ["job-applications", id],
    queryFn: () => fetchJobApplicationsRequest(id),
    enabled: Boolean(id) && user?.role === "client",
  });

  const applyMutation = useMutation({
    mutationFn: (payload: { jobId: string; coverLetter: string }) => applyToJobRequest(payload.jobId, payload.coverLetter),
    onSuccess: async () => {
      setCoverLetter("");
      setShowApplyForm(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["job-detail", id] }),
        queryClient.invalidateQueries({ queryKey: ["my-applications"] }),
        queryClient.invalidateQueries({ queryKey: ["jobs"] }),
      ]);
    },
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { jobId: string; nextSaved: boolean }) =>
      payload.nextSaved ? saveJobRequest(payload.jobId) : unsaveJobRequest(payload.jobId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["job-detail", id] }),
        queryClient.invalidateQueries({ queryKey: ["saved-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["jobs"] }),
      ]);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: (payload: { applicationId: string; status: "pending" | "shortlisted" | "hired" | "rejected" }) =>
      updateApplicationStatusRequest(payload.applicationId, payload.status),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["job-applications", id] }),
        queryClient.invalidateQueries({ queryKey: ["job-detail", id] }),
        queryClient.invalidateQueries({ queryKey: ["my-applications"] }),
      ]);
    },
  });

  const job = jobQuery.data?.job;
  const isClient = user?.role === "client";
  const alreadyApplied = Boolean(job?.application);

  const handleApply = (event: React.FormEvent) => {
    event.preventDefault();
    if (!job) return;
    applyMutation.mutate({ jobId: job.id, coverLetter });
  };

  if (jobQuery.isLoading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading job...</p>;
  }

  if (jobQuery.isError) {
    return (
      <p className="py-12 text-center text-sm text-destructive">
        {jobQuery.error instanceof Error ? jobQuery.error.message : "Unable to load that job right now."}
      </p>
    );
  }

  if (!job) return <div className="py-12 text-center text-sm text-muted-foreground">Job not found.</div>;

  return (
    <div className="mx-auto max-w-3xl">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        <div className="dashboard-card mb-4 p-4">
          <div className="mb-3 flex items-start gap-3">
            <img src={job.clientAvatar} alt={job.clientName} className="h-11 w-11 rounded-[8px] bg-muted object-cover" />
            <div>
              <h1 className="text-lg font-display font-semibold text-foreground">{job.title}</h1>
              <p className="text-sm text-muted-foreground">{job.clientName}</p>
            </div>
          </div>

          <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-secondary" />
              <span className="font-medium text-foreground">
                INR {job.budgetMin.toLocaleString()} - INR {job.budgetMax.toLocaleString()}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {job.timeline}
            </span>
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" />
              {job.experienceLevel || "Not specified"}
            </span>
          </div>

          {(job.domain || job.subdomain) ? (
            <p className="mb-3 text-xs text-muted-foreground">{[job.domain, job.subdomain].filter(Boolean).join(" / ")}</p>
          ) : null}

          <p className="mb-3 text-sm text-foreground">{job.description}</p>

          <div className="flex flex-wrap gap-1.5">
            {job.requiredSkills.map((skill) => (
              <span key={skill} className="rounded-[4px] bg-secondary/10 px-2 py-0.5 text-[11px] font-medium text-secondary">
                {skill}
              </span>
            ))}
          </div>

          {!isClient && (
            <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
              {!alreadyApplied && !showApplyForm ? (
                <button onClick={() => setShowApplyForm(true)} className="dashboard-btn-primary flex-1">
                  Bid / Apply
                </button>
              ) : alreadyApplied ? (
                <span className="flex flex-1 items-center justify-center rounded-[4px] border border-secondary/25 bg-secondary/10 px-3 py-2 text-xs font-medium text-secondary">
                  You have already applied to this job.
                </span>
              ) : null}
              <button
                onClick={() => saveMutation.mutate({ jobId: job.id, nextSaved: !job.saved })}
                className={`inline-flex items-center justify-center gap-1.5 rounded-[4px] border px-4 py-2 text-xs font-semibold transition-colors ${
                  job.saved
                    ? "border-secondary/30 bg-secondary/10 text-secondary"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/35 hover:text-foreground"
                }`}
              >
                {job.saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
                Interested
              </button>
            </div>
          )}
        </div>

        {showApplyForm && (
          <motion.form
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleApply}
            className="dashboard-card mb-4 p-4"
          >
            <h3 className="mb-2 text-sm font-display font-semibold text-foreground">Submit Application</h3>
            <textarea
              value={coverLetter}
              onChange={(event) => setCoverLetter(event.target.value)}
              rows={4}
              required
              className="dashboard-input mb-3 resize-none"
              placeholder="Write a concise cover letter"
            />
            {applyMutation.isError ? (
              <p className="mb-3 text-sm text-destructive">
                {applyMutation.error instanceof Error ? applyMutation.error.message : "Unable to submit the application right now."}
              </p>
            ) : null}
            <div className="flex gap-2">
              <button type="submit" disabled={applyMutation.isPending} className="dashboard-btn-primary flex-1 disabled:opacity-70">
                {applyMutation.isPending ? "Submitting..." : "Submit Application"}
              </button>
              <button type="button" onClick={() => setShowApplyForm(false)} className="dashboard-btn-outline">
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {isClient && applicationsQuery.isLoading ? <p className="py-6 text-center text-sm text-muted-foreground">Loading applicants...</p> : null}

        {isClient && applicationsQuery.isError ? (
          <p className="py-6 text-center text-sm text-destructive">
            {applicationsQuery.error instanceof Error ? applicationsQuery.error.message : "Unable to load applicants right now."}
          </p>
        ) : null}

        {isClient && !applicationsQuery.isLoading && !applicationsQuery.isError && (applicationsQuery.data?.applications.length ?? 0) > 0 ? (
          <div className="dashboard-card p-4">
            <h3 className="mb-3 text-sm font-display font-semibold text-foreground">
              Applicants ({applicationsQuery.data?.applications.length ?? 0})
            </h3>
            <div className="space-y-2.5">
              {applicationsQuery.data?.applications.map((application) => (
                <div key={application.id} className="rounded-[4px] border border-border bg-muted/20 p-3">
                  <div className="flex items-start gap-3">
                    <img src={application.freelancerAvatar} alt="" className="h-9 w-9 rounded-[4px] bg-muted object-cover" />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-medium text-foreground">{application.freelancerName}</p>
                        <span className={`rounded-[4px] px-2 py-0.5 text-[11px] font-medium capitalize ${statusColors[application.status]}`}>
                          {application.status}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{application.coverLetter}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {application.status === "pending" && (
                          <>
                            <button
                              onClick={() => updateStatusMutation.mutate({ applicationId: application.id, status: "shortlisted" })}
                              className="inline-flex items-center gap-1 rounded-[4px] bg-secondary/10 px-2 py-1 text-[11px] font-medium text-secondary hover:bg-secondary/15"
                            >
                              <UserCheck className="h-3 w-3" />
                              Shortlist
                            </button>
                            <button
                              onClick={() => updateStatusMutation.mutate({ applicationId: application.id, status: "rejected" })}
                              className="inline-flex items-center gap-1 rounded-[4px] bg-destructive/10 px-2 py-1 text-[11px] font-medium text-destructive hover:bg-destructive/15"
                            >
                              <XCircle className="h-3 w-3" />
                              Reject
                            </button>
                          </>
                        )}
                        {application.status === "shortlisted" && (
                          <button
                            onClick={() => updateStatusMutation.mutate({ applicationId: application.id, status: "hired" })}
                            className="inline-flex items-center gap-1 rounded-[4px] bg-secondary px-2 py-1 text-[11px] font-medium text-secondary-foreground hover:bg-secondary/90"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Hire
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {isClient && !applicationsQuery.isLoading && !applicationsQuery.isError && (applicationsQuery.data?.applications.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No applicants yet.</p>
        ) : null}
      </motion.div>
    </div>
  );
};

export default JobDetail;
