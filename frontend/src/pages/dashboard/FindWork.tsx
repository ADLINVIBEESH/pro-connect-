import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useDashboardFilter } from "@/contexts/DashboardFilterContext";
import JobCard from "@/components/dashboard/JobCard";
import { fetchJobsRequest, saveJobRequest, unsaveJobRequest } from "@/lib/networkApi";

const FindWork = () => {
  const queryClient = useQueryClient();
  const filter = useDashboardFilter();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "budget-high" | "budget-low">("newest");
  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsRequest,
  });

  const saveMutation = useMutation({
    mutationFn: (payload: { jobId: string; nextSaved: boolean }) =>
      payload.nextSaved ? saveJobRequest(payload.jobId) : unsaveJobRequest(payload.jobId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["saved-jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["job-detail"] });
    },
  });

  useEffect(() => {
    setSearch(searchParams.get("search") ?? "");
  }, [searchParams]);

  const category = filter?.category ?? null;
  const filterSkills = filter?.skills ?? [];

  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const jobs = [...(jobsQuery.data?.jobs ?? [])]
      .filter((job) => (category ? job.domain.toLowerCase() === category.toLowerCase() : true))
      .filter((job) =>
        filterSkills.length > 0
          ? filterSkills.some((skill) => job.requiredSkills.some((jobSkill) => jobSkill.toLowerCase().includes(skill.toLowerCase())))
          : true,
      )
      .filter((job) => {
        if (!normalizedSearch) return true;

        return (
          job.title.toLowerCase().includes(normalizedSearch) ||
          job.clientName.toLowerCase().includes(normalizedSearch) ||
          job.domain.toLowerCase().includes(normalizedSearch) ||
          job.subdomain.toLowerCase().includes(normalizedSearch) ||
          job.requiredSkills.some((skill) => skill.toLowerCase().includes(normalizedSearch))
        );
      });

    jobs.sort((a, b) => {
      if (sortBy === "budget-high") return b.budgetMax - a.budgetMax;
      if (sortBy === "budget-low") return a.budgetMin - b.budgetMin;
      return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    });

    return jobs;
  }, [category, filterSkills, jobsQuery.data?.jobs, search, sortBy]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-display font-semibold text-foreground">Find Work</h1>
        <p className="text-sm text-muted-foreground">Browse real jobs posted by clients. Only posted jobs appear here.</p>
      </div>

      <div className="mb-5 flex flex-col gap-2.5 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);

              const nextParams = new URLSearchParams(searchParams);
              if (value.trim()) {
                nextParams.set("search", value);
              } else {
                nextParams.delete("search");
              }
              setSearchParams(nextParams, { replace: true });
            }}
            className="dashboard-input pl-9"
            placeholder="Search by title, client, domain, or skill"
          />
        </div>
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value as "newest" | "budget-high" | "budget-low")}
          className="dashboard-input max-w-[220px]"
        >
          <option value="newest">Newest</option>
          <option value="budget-high">Budget: High to Low</option>
          <option value="budget-low">Budget: Low to High</option>
        </select>
      </div>

      {jobsQuery.isLoading ? <p className="py-10 text-center text-sm text-muted-foreground">Loading jobs...</p> : null}

      {jobsQuery.isError ? (
        <p className="py-10 text-center text-sm text-destructive">
          {jobsQuery.error instanceof Error ? jobsQuery.error.message : "Unable to load jobs right now."}
        </p>
      ) : null}

      {!jobsQuery.isLoading && !jobsQuery.isError && (jobsQuery.data?.jobs.length ?? 0) === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">No jobs have been posted yet.</p>
      ) : null}

      {!jobsQuery.isLoading && !jobsQuery.isError && (jobsQuery.data?.jobs.length ?? 0) > 0 ? (
        filteredJobs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No jobs match your current filters.</p>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSaved={job.saved}
                onSaveToggle={(jobId) => saveMutation.mutate({ jobId, nextSaved: !job.saved })}
                showSaveButton={true}
              />
            ))}
          </motion.div>
        )
      ) : null}
    </div>
  );
};

export default FindWork;
