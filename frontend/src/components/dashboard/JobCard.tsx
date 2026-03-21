import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Clock, DollarSign, Bookmark, BookmarkCheck } from "lucide-react";
import type { JobRecord } from "@/lib/networkApi";

interface JobCardProps {
  job: JobRecord;
  isSaved?: boolean;
  onSaveToggle?: (jobId: string) => void;
  showSaveButton?: boolean;
}

const JobCard = ({ job, isSaved = false, onSaveToggle, showSaveButton = true }: JobCardProps) => {
  const location = useLocation();
  const dashboardBasePath = location.pathname.startsWith("/client-dashboard") ? "/client-dashboard" : "/dashboard";

  const handleSaveClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onSaveToggle?.(job.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="dashboard-card group p-4"
    >
      <Link to={`${dashboardBasePath}/job/${job.id}`} className="block">
        <div className="flex items-start gap-3">
          <img src={job.clientAvatar} alt={job.clientName} className="h-10 w-10 rounded-[8px] bg-muted shrink-0 object-cover" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-display font-semibold text-foreground">{job.title}</h3>
            <p className="text-xs text-muted-foreground">{job.clientName}</p>
          </div>
          {showSaveButton && onSaveToggle && (
            <button
              onClick={handleSaveClick}
              className="rounded-[4px] p-1.5 text-muted-foreground transition-colors hover:bg-muted/35 hover:text-foreground"
              aria-label={isSaved ? "Unsave job" : "Save job"}
            >
              {isSaved ? (
                <BookmarkCheck className="h-[18px] w-[18px] text-secondary" />
              ) : (
                <Bookmark className="h-[18px] w-[18px]" />
              )}
            </button>
          )}
        </div>
        <p className="mt-2.5 line-clamp-2 text-sm text-muted-foreground">{job.description}</p>
        <div className="mt-2.5 flex items-center gap-3 text-xs">
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
        </div>
        {(job.domain || job.subdomain) && (
          <p className="mt-2 text-xs text-muted-foreground">
            {[job.domain, job.subdomain].filter(Boolean).join(" / ")}
          </p>
        )}
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {job.requiredSkills.map((skill) => (
            <span key={skill} className="rounded-[4px] bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
              {skill}
            </span>
          ))}
        </div>
        <div className="mt-3 rounded-[10px] bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-center text-xs font-semibold text-white transition-opacity group-hover:opacity-85">
          View Details
        </div>
      </Link>
    </motion.div>
  );
};

export default JobCard;
