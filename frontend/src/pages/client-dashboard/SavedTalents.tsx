import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Bookmark } from "lucide-react";
import FreelancerCard from "@/components/dashboard/FreelancerCard";
import { fetchSavedFreelancersRequest } from "@/lib/userApi";

const SavedTalents = () => {
  const savedQuery = useQuery({
    queryKey: ["saved-freelancers"],
    queryFn: fetchSavedFreelancersRequest,
  });

  return (
    <div>
      <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-display font-semibold text-foreground">Saved Talents</h1>
          <p className="text-sm text-muted-foreground">Keep track of the freelancers you want to hire later.</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm text-muted-foreground">
          <Bookmark className="h-4 w-4" />
          <span>{savedQuery.data?.freelancers?.length || 0} Saved</span>
        </div>
      </div>

      {savedQuery.isLoading ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Loading saved talents...</p>
      ) : null}

      {savedQuery.isError ? (
        <p className="py-10 text-center text-sm text-destructive">
          {savedQuery.error instanceof Error ? savedQuery.error.message : "Unable to load saved talents right now."}
        </p>
      ) : null}

      {!savedQuery.isLoading && !savedQuery.isError && (savedQuery.data?.freelancers?.length ?? 0) === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-20 text-center">
          <Bookmark className="mb-4 h-8 w-8 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold text-foreground">No saved talents yet</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Browse through "Find Talent" and click the save button on profiles you want to keep track of.
          </p>
        </div>
      ) : null}

      {!savedQuery.isLoading && !savedQuery.isError && (savedQuery.data?.freelancers?.length ?? 0) > 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18 }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {savedQuery.data?.freelancers.map((freelancer) => (
            <div key={freelancer.userId} className="relative group">
              <FreelancerCard freelancer={freelancer} />
            </div>
          ))}
        </motion.div>
      ) : null}
    </div>
  );
};

export default SavedTalents;
