import { useState } from "react";
import { motion } from "framer-motion";
import { jobs, categories } from "@/data/mockData";
import JobCard from "./JobCard";

const FreelancerView = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? jobs.filter((j) => j.category === activeCategory)
    : jobs;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">Find Work</h2>
        <p className="text-muted-foreground text-sm">Browse available projects matching your skills</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            !activeCategory
              ? "bg-secondary text-secondary-foreground"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="grid md:grid-cols-2 gap-5"
      >
        {filtered.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No jobs found in this category.</p>
      )}
    </div>
  );
};

export default FreelancerView;
