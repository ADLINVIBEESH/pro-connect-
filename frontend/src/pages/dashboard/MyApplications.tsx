import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { fetchMyApplicationsRequest } from "@/lib/networkApi";

const statusColors: Record<string, string> = {
  pending: "bg-primary/10 text-primary",
  shortlisted: "bg-secondary/10 text-secondary",
  hired: "bg-secondary text-secondary-foreground",
  rejected: "bg-destructive/10 text-destructive",
};

const getStatusLabel = (status: string) => {
  if (status === "pending") return "Pending";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const MyApplications = () => {
  const applicationsQuery = useQuery({
    queryKey: ["my-applications"],
    queryFn: fetchMyApplicationsRequest,
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-display font-semibold text-foreground">Applied Works</h1>
        <p className="text-sm text-muted-foreground">Track statuses for jobs you applied to.</p>
      </div>

      {applicationsQuery.isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading applications...</p> : null}

      {applicationsQuery.isError ? (
        <p className="py-10 text-center text-sm text-destructive">
          {applicationsQuery.error instanceof Error ? applicationsQuery.error.message : "Unable to load your applications right now."}
        </p>
      ) : null}

      {!applicationsQuery.isLoading && !applicationsQuery.isError && (applicationsQuery.data?.applications.length ?? 0) === 0 ? (
        <div className="dashboard-card py-12 text-center">
          <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground/35" />
          <p className="mb-3 text-sm text-muted-foreground">You have not applied to any jobs yet.</p>
          <Link to="/dashboard/find-work" className="text-sm font-semibold text-secondary hover:underline">
            Browse jobs
          </Link>
        </div>
      ) : null}

      {!applicationsQuery.isLoading && !applicationsQuery.isError && (applicationsQuery.data?.applications.length ?? 0) > 0 ? (
        <div className="space-y-3.5">
          {applicationsQuery.data?.applications.map((application) => (
            <motion.div
              key={application.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
              className="dashboard-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/dashboard/job/${application.jobId}`} className="text-sm font-display font-semibold text-foreground">
                    {application.job?.title || "Unknown Job"}
                  </Link>
                  <p className="text-xs text-muted-foreground">{application.job?.clientName}</p>
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{application.coverLetter}</p>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Applied: {application.createdAt ? new Date(application.createdAt).toLocaleDateString() : "Recently"}
                  </p>
                </div>
                <span className={`shrink-0 rounded-[4px] px-2 py-0.5 text-xs font-medium ${statusColors[application.status]}`}>
                  {getStatusLabel(application.status)}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default MyApplications;
