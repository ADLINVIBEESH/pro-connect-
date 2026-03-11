import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createJobRequest } from "@/lib/networkApi";

const PostJob = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const dashboardBasePath = location.pathname.startsWith("/client-dashboard") ? "/client-dashboard" : "/dashboard";

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [subdomain, setSubdomain] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [timeline, setTimeline] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("Mid-Level");
  const [skillInput, setSkillInput] = useState("");
  const [skills, setSkills] = useState<string[]>([]);

  const createMutation = useMutation({
    mutationFn: createJobRequest,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-jobs"] }),
        queryClient.invalidateQueries({ queryKey: ["jobs"] }),
      ]);
      navigate(`${dashboardBasePath}/my-jobs`);
    },
  });

  const addSkill = () => {
    const nextSkill = skillInput.trim();
    if (nextSkill && !skills.some((skill) => skill.toLowerCase() === nextSkill.toLowerCase())) {
      setSkills([...skills, nextSkill]);
      setSkillInput("");
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    createMutation.mutate({
      title,
      description,
      domain,
      subdomain,
      requiredSkills: skills,
      budgetMin: Number(budgetMin),
      budgetMax: Number(budgetMax),
      timeline,
      experienceLevel,
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <button onClick={() => navigate(-1)} className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.18 }}>
        <div className="mb-4">
          <h1 className="text-xl font-display font-semibold text-foreground">Post a New Job</h1>
          <p className="text-sm text-muted-foreground">Provide clear job details so freelancers can assess fit quickly.</p>
        </div>

        <form onSubmit={handleSubmit} className="dashboard-card space-y-4 p-4">
          <div>
            <label className="dashboard-label">Job Title</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              required
              className="dashboard-input"
              placeholder="Senior React Developer"
            />
          </div>

          <div>
            <label className="dashboard-label">Description</label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={4}
              className="dashboard-input resize-none"
              placeholder="Summarize responsibilities, deliverables, and expected outcomes."
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="dashboard-label">Domain</label>
              <input value={domain} onChange={(event) => setDomain(event.target.value)} className="dashboard-input" placeholder="Frontend" />
            </div>
            <div>
              <label className="dashboard-label">Subdomain</label>
              <input
                value={subdomain}
                onChange={(event) => setSubdomain(event.target.value)}
                className="dashboard-input"
                placeholder="React / Next.js"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="dashboard-label">Experience Level</label>
              <select
                value={experienceLevel}
                onChange={(event) => setExperienceLevel(event.target.value)}
                className="dashboard-input"
              >
                <option>Entry-Level</option>
                <option>Mid-Level</option>
                <option>Senior</option>
                <option>Expert</option>
              </select>
            </div>
            <div>
              <label className="dashboard-label">Timeline</label>
              <input
                value={timeline}
                onChange={(event) => setTimeline(event.target.value)}
                required
                className="dashboard-input"
                placeholder="Within 1 month"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div>
              <label className="dashboard-label">Min Budget (INR)</label>
              <input
                type="number"
                value={budgetMin}
                onChange={(event) => setBudgetMin(event.target.value)}
                required
                className="dashboard-input"
                placeholder="1000"
              />
            </div>
            <div>
              <label className="dashboard-label">Max Budget (INR)</label>
              <input
                type="number"
                value={budgetMax}
                onChange={(event) => setBudgetMax(event.target.value)}
                required
                className="dashboard-input"
                placeholder="5000"
              />
            </div>
          </div>

          <div>
            <label className="dashboard-label">Required Skills</label>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={(event) => setSkillInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    addSkill();
                  }
                }}
                className="dashboard-input flex-1"
                placeholder="Type a skill and press Enter"
              />
              <button type="button" onClick={addSkill} className="dashboard-btn-outline px-2.5">
                <Plus className="h-4 w-4" />
              </button>
            </div>
            {skills.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 rounded-[4px] bg-secondary/10 px-2 py-0.5 text-xs font-medium text-secondary">
                    {skill}
                    <button type="button" onClick={() => setSkills(skills.filter((item) => item !== skill))}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {createMutation.isError ? (
            <p className="text-sm text-destructive">
              {createMutation.error instanceof Error ? createMutation.error.message : "Unable to create the job right now."}
            </p>
          ) : null}

          <button type="submit" disabled={createMutation.isPending} className="dashboard-btn-primary w-full disabled:opacity-70">
            {createMutation.isPending ? "Publishing..." : "Publish Job"}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PostJob;
