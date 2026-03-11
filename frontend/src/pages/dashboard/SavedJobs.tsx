import { Link } from "react-router-dom";
import { Bookmark } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import JobCard from "@/components/dashboard/JobCard";
import { fetchSavedJobsRequest, saveJobRequest, unsaveJobRequest } from "@/lib/networkApi";

const SavedJobs = () => {
  const queryClient = useQueryClient();
  const savedJobsQuery = useQuery({
    queryKey: ["saved-jobs"],
    queryFn: fetchSavedJobsRequest,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { jobId: string; nextSaved: boolean }) =>
      payload.nextSaved ? saveJobRequest(payload.jobId) : unsaveJobRequest(payload.jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["job-detail"] });
    },
  });

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-display font-semibold text-foreground">Saved Jobs</h1>
        <p className="text-sm text-muted-foreground">Jobs you bookmarked to review later.</p>
      </div>

      {savedJobsQuery.isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading saved jobs...</p> : null}

      {savedJobsQuery.isError ? (
        <p className="py-10 text-center text-sm text-destructive">
          {savedJobsQuery.error instanceof Error ? savedJobsQuery.error.message : "Unable to load saved jobs right now."}
        </p>
      ) : null}

      {!savedJobsQuery.isLoading && !savedJobsQuery.isError && (savedJobsQuery.data?.jobs.length ?? 0) === 0 ? (
        <div className="dashboard-card py-12 text-center">
          <Bookmark className="mx-auto mb-3 h-10 w-10 text-muted-foreground/35" />
          <p className="mb-3 text-sm text-muted-foreground">No saved jobs yet.</p>
          <Link to="/dashboard/find-work" className="text-sm font-semibold text-secondary hover:underline">
            Browse jobs
          </Link>
        </div>
      ) : null}

      {!savedJobsQuery.isLoading && !savedJobsQuery.isError && (savedJobsQuery.data?.jobs.length ?? 0) > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {savedJobsQuery.data?.jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isSaved={job.saved}
              onSaveToggle={(jobId) => saveMutation.mutate({ jobId, nextSaved: !job.saved })}
              showSaveButton={true}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default SavedJobs;
