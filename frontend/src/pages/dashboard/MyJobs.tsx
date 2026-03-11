import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Trash2, Users, Clock, DollarSign, PlusCircle } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteJobRequest, fetchMyJobsRequest } from "@/lib/networkApi";

const MyJobs = () => {
  const location = useLocation();
  const queryClient = useQueryClient();
  const dashboardBasePath = location.pathname.startsWith("/client-dashboard") ? "/client-dashboard" : "/dashboard";
  const jobsQuery = useQuery({
    queryKey: ["my-jobs"],
    queryFn: () => fetchMyJobsRequest(true),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteJobRequest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-display font-semibold text-foreground">My Jobs</h1>
          <p className="text-sm text-muted-foreground">Manage your published jobs and incoming applicants.</p>
        </div>
        <Link to={`${dashboardBasePath}/post-job`} className="dashboard-btn-primary">
          <PlusCircle className="h-4 w-4" />
          Post Job
        </Link>
      </div>

      {jobsQuery.isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading your jobs...</p> : null}

      {jobsQuery.isError ? (
        <p className="py-10 text-center text-sm text-destructive">
          {jobsQuery.error instanceof Error ? jobsQuery.error.message : "Unable to load your jobs right now."}
        </p>
      ) : null}

      {!jobsQuery.isLoading && !jobsQuery.isError && (jobsQuery.data?.jobs.length ?? 0) === 0 ? (
        <div className="dashboard-card py-12 text-center">
          <p className="mb-3 text-sm text-muted-foreground">You have not posted any jobs yet.</p>
          <Link to={`${dashboardBasePath}/post-job`} className="text-sm font-semibold text-secondary hover:underline">
            Post your first job
          </Link>
        </div>
      ) : null}

      {!jobsQuery.isLoading && !jobsQuery.isError && (jobsQuery.data?.jobs.length ?? 0) > 0 ? (
        <div className="space-y-3.5">
          {jobsQuery.data?.jobs.map((job) => (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="dashboard-card p-4"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <Link to={`${dashboardBasePath}/job/${job.id}`} className="text-base font-display font-semibold text-foreground">
                    {job.title}
                  </Link>
                  <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{job.description}</p>
                </div>
                <button
                  onClick={() => deleteMutation.mutate(job.id)}
                  disabled={deleteMutation.isPending}
                  className="rounded-[4px] border border-border p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <DollarSign className="h-3.5 w-3.5 text-secondary" />
                  INR {job.budgetMin.toLocaleString()} - INR {job.budgetMax.toLocaleString()}
                </span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {job.timeline}
                </span>
                <Link to={`${dashboardBasePath}/job/${job.id}`} className="inline-flex items-center gap-1 font-medium text-secondary">
                  <Users className="h-3.5 w-3.5" />
                  {job.applicantCount} Applicant{job.applicantCount !== 1 ? "s" : ""}
                </Link>
              </div>
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{[job.domain, job.subdomain].filter(Boolean).join(" / ") || "General"}</span>
                <span>{job.experienceLevel || "Not specified"}</span>
              </div>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {job.requiredSkills.map((skill) => (
                  <span key={skill} className="rounded-[4px] bg-secondary/10 px-2 py-0.5 text-[11px] font-medium text-secondary">
                    {skill}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default MyJobs;
