import { useState } from "react";
import { motion } from "framer-motion";
import { freelancers, categories } from "@/data/mockData";
import FreelancerCard from "./FreelancerCard";

const HirerView = () => {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = activeCategory
    ? freelancers.filter((f) => f.category === activeCategory)
    : freelancers;

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-display font-bold text-foreground mb-1">Find Talent</h2>
        <p className="text-muted-foreground text-sm">Browse skilled professionals by category</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActiveCategory(null)}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
            !activeCategory
              ? "bg-accent text-accent-foreground"
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
                ? "bg-accent text-accent-foreground"
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
        {filtered.map((f) => (
          <FreelancerCard key={f.id} freelancer={f} />
        ))}
      </motion.div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">No freelancers found in this category.</p>
      )}
    </div>
  );
};

export default HirerView;
