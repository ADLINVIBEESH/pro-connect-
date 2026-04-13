import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight, Briefcase, CircleCheckBig, Search,
  Sparkles, Star, UserRoundPen, Users, Zap,
  Github, Twitter, Linkedin, Globe,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchJobsRequest, fetchMyApplicationsRequest, fetchMyJobsRequest } from "@/lib/networkApi";

/* ── Animation variants (ease as const avoids framer-motion type error) ─ */
const easeOut = [0.0, 0.0, 0.2, 1] as const;

const fadeUp = (i = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.32, ease: easeOut, delay: i * 0.06 } },
});

/* ── Gradient-border card ────────────────────────────────────── */
const GlowCard = ({
  children,
  className = "",
  glowColor = "hsl(250 60% 55% / 0.18)",
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}) => (
  <div
    className={`relative rounded-2xl p-[1px] ${className}`}
    style={{
      background:
        "linear-gradient(135deg, hsl(250 60% 55% / 0.35) 0%, hsl(228 25% 15%) 60%, hsl(170 80% 45% / 0.2) 100%)",
    }}
  >
    {/* Ambient glow */}
    <div
      className="pointer-events-none absolute -inset-4 rounded-3xl blur-3xl"
      style={{ background: glowColor, opacity: 0.5 }}
    />
    <div className="relative rounded-2xl bg-card">{children}</div>
  </div>
);

/* ── Stat card ───────────────────────────────────────────────── */
const StatCard = ({
  label,
  value,
  meta,
  i = 0,
}: {
  label: string;
  value: string | number;
  meta: string;
  i?: number;
}) => (
  <motion.div
    {...fadeUp(i)}
    className="group relative rounded-2xl p-[1px] transition-transform duration-300 hover:scale-[1.03]"
    style={{
      background:
        "linear-gradient(135deg, hsl(250 60% 55% / 0.3) 0%, hsl(228 25% 15%) 55%, hsl(170 80% 45% / 0.15) 100%)",
    }}
  >
    <div
      className="pointer-events-none absolute -inset-3 rounded-3xl blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-60"
      style={{ background: "hsl(250 60% 55% / 0.15)" }}
    />
    <div className="relative rounded-2xl bg-card p-6">
      <p className="section-label">{label}</p>
      <p className="mt-3 font-display text-5xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{meta}</p>
      {/* Subtle bottom gradient line */}
      <div
        className="absolute inset-x-6 bottom-0 h-[1px] rounded-full"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(250 60% 55% / 0.4), transparent)",
        }}
      />
    </div>
  </motion.div>
);

/* ── Quick action card ──────────────────────────────────────── */
const ActionCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  i = 0,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  onClick: () => void;
  i?: number;
}) => (
  <motion.button
    {...fadeUp(i)}
    type="button"
    onClick={onClick}
    className="group relative w-full overflow-hidden rounded-2xl p-[1px] text-left transition-transform duration-300 hover:scale-[1.015]"
    style={{
      background:
        "linear-gradient(135deg, hsl(250 60% 55% / 0.25) 0%, hsl(228 25% 15%) 60%, hsl(170 80% 45% / 0.12) 100%)",
    }}
  >
    {/* Shimmer overlay */}
    <div className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/[0.04] to-transparent transition-transform duration-700 group-hover:translate-x-[100%]" />
    <div className="relative rounded-2xl bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 text-primary ring-1 ring-primary/20">
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[1.05rem] font-semibold text-foreground transition-colors group-hover:text-primary">
            {title}
          </h3>
          <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/40 transition-all duration-300 group-hover:translate-x-1 group-hover:text-primary" />
      </div>
    </div>
  </motion.button>
);

/* ── Footer link column ─────────────────────────────────────── */
const FooterCol = ({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) => (
  <div>
    <p className="section-label mb-4">{title}</p>
    <ul className="space-y-2.5">
      {links.map((link) => (
        <li key={link.label}>
          <a
            href={link.href}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            {link.label}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

/* ══════════════════════════════════════════════════════════════
   Main component
═══════════════════════════════════════════════════════════════ */
const DashboardHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: fetchJobsRequest,
    enabled: user?.role === "freelancer",
  });
  const myApplicationsQuery = useQuery({
    queryKey: ["my-applications"],
    queryFn: fetchMyApplicationsRequest,
    enabled: user?.role === "freelancer",
  });
  const myJobsQuery = useQuery({
    queryKey: ["my-jobs"],
    queryFn: () => fetchMyJobsRequest(true),
    enabled: user?.role === "client",
  });

  if (!user) return null;

  const isFreelancer = user.role === "freelancer";
  const isIncompleteFreelancer = isFreelancer && !user.profile_completed;

  /* ── Client view ───────────────────────────────────────────── */
  if (!isFreelancer) {
    const postedJobs = myJobsQuery.data?.jobs.length ?? 0;
    const totalApplicants = (myJobsQuery.data?.jobs ?? []).reduce(
      (t, j) => t + (j.applications?.length ?? 0),
      0
    );

    return (
      <div className="mx-auto max-w-6xl space-y-6 px-2 pb-6 sm:px-4">
        <div className="grid gap-4 lg:grid-cols-5">
          <GlowCard className="lg:col-span-3">
            <div className="p-7">
              <p className="section-label">Client Workspace</p>
              <h1 className="mt-3 font-display text-[2.2rem] font-bold leading-tight tracking-tight text-foreground">
                Manage your jobs &amp; hiring flow
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted-foreground">
                Post jobs, review applicants, and browse freelancers ranked to your preferences.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/client-dashboard/post-job"
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_hsl(250_60%_55%/0.35)] transition hover:opacity-90"
                >
                  Post a Job <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/client-dashboard/talent"
                  className="inline-flex rounded-xl border border-border bg-muted/30 px-5 py-2.5 text-sm font-semibold text-foreground transition hover:border-primary/30"
                >
                  Find Talent
                </Link>
              </div>
            </div>
          </GlowCard>
          <GlowCard className="lg:col-span-2" glowColor="hsl(170 80% 45% / 0.12)">
            <div className="p-7">
              <p className="section-label">Client Profile</p>
              <h2 className="mt-2 font-display text-xl font-semibold text-foreground">
                {user.client_profile_completed ? "Profile ready" : "Complete your profile"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {user.client_profile_completed
                  ? "Your client profile is visible to top freelancers."
                  : "Finish your client profile to improve talent matching."}
              </p>
              <button
                type="button"
                onClick={() => navigate("/client-profile-completion")}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {user.client_profile_completed ? "Update Profile" : "Complete Profile"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </GlowCard>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard i={0} label="Posted Jobs" value={postedJobs} meta="Live jobs attached to your account" />
          <StatCard i={1} label="Applicants" value={totalApplicants} meta="Applications across all posted jobs" />
          <StatCard
            i={2}
            label="Hiring Profile"
            value={user.client_profile_completed ? "Ready" : "Incomplete"}
            meta="Complete your client profile for better talent ranking"
          />
        </div>
      </div>
    );
  }

  /* ── Freelancer data ────────────────────────────────────────── */
  const freelancerApps = myApplicationsQuery.data?.applications ?? [];
  const recommendedJobs = (jobsQuery.data?.jobs ?? [])
    .slice()
    .sort((a, b) => {
      const userSkills = user.profile.expertise.primarySkills.map((s) => s.name.toLowerCase());
      const aM = a.requiredSkills.filter((s) => userSkills.includes(s.toLowerCase())).length;
      const bM = b.requiredSkills.filter((s) => userSkills.includes(s.toLowerCase())).length;
      return bM - aM || b.budgetMax - a.budgetMax;
    })
    .slice(0, 3);

  const firstName = user.name.split(" ")[0] || user.name;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const contractsDone = freelancerApps.filter((a) => a.status === "hired").length;
  const profilePct = Math.max(user.profile_completion_percent, user.profile_completed ? 100 : 8);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-2 pb-8 sm:px-4">

      {/* ── Header: 5-col grid ──────────────────────────────────── */}
      <div className="grid gap-4 lg:grid-cols-5">
        {/* Welcome card — 3 cols */}
        <motion.div {...fadeUp(0)} className="lg:col-span-3">
          <GlowCard className="h-full">
            <div className="p-7">
              <p className="section-label">Freelancer Dashboard</p>
              <h1 className="mt-3 font-display text-[2.3rem] font-bold leading-[1.12] tracking-tight text-foreground">
                {greeting},<br />{firstName} 👋
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-7 text-muted-foreground">
                Track real applications, discover new opportunities, and build a profile that wins clients.
              </p>
            </div>
          </GlowCard>
        </motion.div>

        {/* CTA card — 2 cols */}
        <motion.div {...fadeUp(1)} className="lg:col-span-2">
          <GlowCard className="h-full" glowColor="hsl(280 80% 60% / 0.12)">
            <div className="flex h-full flex-col p-7">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-accent/25 text-accent">
                  <Zap className="h-5 w-5" />
                </div>
                <p className="section-label">Profile</p>
              </div>
              <h2 className="mt-3 font-display text-xl font-semibold text-foreground">
                {user.profile_completed ? "Keep your profile sharp" : "Complete your profile"}
              </h2>
              <p
                className={`mt-2 text-sm leading-6 text-muted-foreground ${user.profile_completed ? "" : "flex-1"}`}
              >
                {user.profile_completed
                  ? "Refresh skills and portfolio to improve visibility."
                  : "Finish onboarding to unlock Find Work, Applied Works, and Saved Jobs."}
              </p>
              {!user.profile_completed ? (
                <button
                  type="button"
                  onClick={() => navigate("/profile-completion")}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_hsl(250_60%_55%/0.3)] transition hover:opacity-90"
                >
                  Complete Profile
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <Link
                  to="/profile"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-secondary transition hover:underline"
                >
                  View Profile
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          </GlowCard>
        </motion.div>
      </div>

      {/* ── Stats row ───────────────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard i={0} label="Contracts Done" value={contractsDone} meta="Confirmed hires across your applications" />
        <StatCard i={1} label="Applications" value={freelancerApps.length} meta="Total jobs you have applied for" />
      </div>

      {/* ── Quick actions + sidebar ──────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">

        {/* Left — 3 cols */}
        <div className="space-y-6 lg:col-span-3">

          {/* Quick Actions */}
          <motion.div {...fadeUp(2)}>
            <p className="section-label mb-1">Quick Actions</p>
            <h2 className="font-display text-xl font-semibold text-foreground">Jump back in</h2>
            <div className="mt-4 space-y-3">
              <ActionCard
                i={0}
                icon={Search}
                title="Browse Jobs"
                description="Discover opportunities matched to your skills and saved interests."
                onClick={() =>
                  navigate(isIncompleteFreelancer ? "/profile-completion" : "/dashboard/find-work")
                }
              />
              <ActionCard
                i={1}
                icon={UserRoundPen}
                title="Update Profile"
                description="Refresh your portfolio, title, skills, and social links."
                onClick={() => navigate("/profile-completion")}
              />
            </div>
          </motion.div>

          {/* Recommended Jobs */}
          <motion.div {...fadeUp(3)}>
            <div className="flex items-end justify-between">
              <div>
                <p className="section-label mb-1">Recommendations</p>
                <h2 className="font-display text-xl font-semibold text-foreground">Recommended Jobs</h2>
              </div>
              <Link
                to="/dashboard/find-work"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="mt-4 space-y-3">
              {recommendedJobs.length === 0 ? (
                <GlowCard>
                  <div className="flex flex-col items-center gap-3 p-8 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted/40 text-muted-foreground">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <p className="font-display font-semibold text-foreground">No jobs yet</p>
                    <p className="text-sm text-muted-foreground">
                      Jobs posted by clients will appear here, matched to your skills.
                    </p>
                    <Link
                      to="/dashboard/find-work"
                      className="mt-1 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-accent px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                    >
                      Explore all jobs <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </GlowCard>
              ) : (
                recommendedJobs.map((job, idx) => (
                  <GlowCard
                    key={job.id}
                    glowColor={idx === 0 ? "hsl(250 60% 55% / 0.1)" : "transparent"}
                  >
                    <div className="p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-display font-semibold text-foreground">{job.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{job.clientName}</p>
                          <p className="mt-1 text-xs text-muted-foreground/70">
                            {[job.domain, job.subdomain].filter(Boolean).join(" / ")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              isIncompleteFreelancer
                                ? "/profile-completion"
                                : `/dashboard/job/${job.id}`
                            )
                          }
                          className="shrink-0 rounded-xl bg-gradient-to-r from-primary to-accent px-3.5 py-2 text-xs font-semibold text-white transition hover:opacity-90"
                        >
                          View Details
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {job.requiredSkills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-muted/50 px-2.5 py-1 text-xs text-muted-foreground ring-1 ring-border"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </GlowCard>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Right sidebar — 2 cols */}
        <motion.aside {...fadeUp(4)} className="space-y-4 lg:col-span-2">

          {/* Profile Strength */}
          <GlowCard glowColor="hsl(280 80% 60% / 0.1)">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary/25 to-accent/25 text-accent">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground">Profile Strength</p>
                  <p className="text-xs text-muted-foreground">{profilePct}% complete</p>
                </div>
              </div>

              {/* Glowing progress bar */}
              <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted/50">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-700"
                  style={{
                    width: `${profilePct}%`,
                    boxShadow: "0 0 12px hsl(250 60% 55% / 0.6)",
                  }}
                />
              </div>

              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                {user.profile_completed
                  ? "Your profile is active and discoverable by clients."
                  : "Add your title, skills, portfolio, and links to boost visibility."}
              </p>

              <p className="mt-4 text-xs leading-6 text-muted-foreground">
                If you want to update the profile further, you can update in the profile tab.
              </p>
            </div>
          </GlowCard>

          {/* Marketplace Snapshot */}
          <GlowCard glowColor="hsl(170 80% 45% / 0.08)">
            <div className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                  <CircleCheckBig className="h-5 w-5" />
                </div>
                <p className="font-display font-semibold text-foreground">Marketplace Snapshot</p>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {jobsQuery.isLoading
                  ? "Loading marketplace data..."
                  : `${jobsQuery.data?.jobs.length ?? 0} live jobs available right now.`}
              </p>

              <div className="mt-4 divide-y divide-border/50">
                {[
                  { icon: Briefcase, label: "Live jobs", value: jobsQuery.data?.jobs.length ?? 0 },
                  { icon: Users, label: "Applied jobs", value: freelancerApps.length },
                  { icon: Star, label: "Hired", value: contractsDone },
                ].map(({ icon: Icon, label, value }) => (
                  <div key={label} className="flex items-center justify-between py-3">
                    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4" />
                      {label}
                    </span>
                    <span className="font-display text-sm font-semibold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlowCard>
        </motion.aside>
      </div>


    </div>
  );
};

export default DashboardHome;
