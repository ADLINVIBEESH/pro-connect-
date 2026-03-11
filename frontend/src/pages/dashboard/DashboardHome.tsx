import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Briefcase, CircleCheckBig, Search, Sparkles, Star, UserRoundPen, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { fetchJobsRequest, fetchMyApplicationsRequest, fetchMyJobsRequest } from "@/lib/networkApi";
import DashboardFooter from "@/components/dashboard/DashboardFooter";

const sectionMotion = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
};

const StatCard = ({ label, value, meta }: { label: string; value: string | number; meta: string }) => (
  <motion.article variants={sectionMotion} className="rounded-[12px] border border-border bg-card p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.18)]">
    <p className="font-display text-[0.98rem] text-muted-foreground">{label}</p>
    <p className="mt-2 text-[2rem] font-display font-semibold text-foreground">{value}</p>
    <p className="mt-2 text-[14px] leading-6 text-muted-foreground">{meta}</p>
  </motion.article>
);

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

  if (!isFreelancer) {
    const postedJobs = myJobsQuery.data?.jobs.length ?? 0;
    const totalApplicants = (myJobsQuery.data?.jobs ?? []).reduce((total, job) => total + (job.applications?.length ?? 0), 0);

    return (
      <motion.div initial="hidden" animate="show" variants={sectionMotion} className="space-y-5">
        <div className="rounded-[12px] border border-border bg-card p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.2)]">
          <p className="font-display text-[0.98rem] text-muted-foreground">Client workspace</p>
          <h1 className="mt-3 text-[2.2rem] font-display font-semibold text-foreground">Manage your jobs and hiring flow</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">
            Post jobs, review real applicants, and browse freelancer profiles ranked against your hiring preferences.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link to="/client-dashboard/post-job" className="inline-flex rounded-[8px] bg-accent px-4 py-2.5 text-[14px] font-semibold text-white">
              Post a Job
            </Link>
            <Link to="/client-dashboard/talent" className="inline-flex rounded-[8px] border border-border bg-card px-4 py-2.5 text-[14px] font-semibold text-foreground">
              Find Talent
            </Link>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Posted Jobs" value={postedJobs} meta="Live jobs currently attached to your account" />
          <StatCard label="Applicants" value={totalApplicants} meta="Applications received across all posted jobs" />
          <StatCard label="Hiring Profile" value={user.client_profile_completed ? "Ready" : "Incomplete"} meta="Complete your client profile for stronger talent ranking" />
        </div>
      </motion.div>
    );
  }

  const freelancerApps = myApplicationsQuery.data?.applications ?? [];
  const recommendedJobs = (jobsQuery.data?.jobs ?? [])
    .slice()
    .sort((a, b) => {
      const userSkills = user.profile.expertise.primarySkills.map((skill) => skill.name.toLowerCase());
      const aMatches = a.requiredSkills.filter((skill) => userSkills.includes(skill.toLowerCase())).length;
      const bMatches = b.requiredSkills.filter((skill) => userSkills.includes(skill.toLowerCase())).length;
      return bMatches - aMatches || b.budgetMax - a.budgetMax;
    })
    .slice(0, 3);

  const firstName = user.name.split(" ")[0] || user.name;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const contractsDone = freelancerApps.filter((application) => application.status === "hired").length;

  return (
    <motion.div initial="hidden" animate="show" className="space-y-5 pb-3">
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.95fr)]">
        <motion.section
          variants={sectionMotion}
          className="rounded-[12px] border border-border bg-card p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.18)]"
        >
          <p className="font-display text-[1rem] text-muted-foreground">Freelancer Dashboard</p>
          <h1 className="mt-2.5 font-display text-[2.6rem] leading-[1.02] tracking-[0.02em] text-foreground">
            {greeting}, {firstName}
          </h1>
          <p className="mt-3 max-w-3xl text-[16px] leading-7 text-muted-foreground">
            Track real applications and browse current jobs posted by clients.
          </p>
        </motion.section>

        <motion.section
          variants={sectionMotion}
          className="rounded-[12px] border border-border bg-card p-5 shadow-[0_22px_42px_-34px_rgba(15,23,42,0.16)]"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
              <ArrowRight className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-[1.35rem] font-display font-semibold text-foreground">
                {user.profile_completed ? "Keep your profile sharp" : "Complete your profile"}
              </h2>
              <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                {user.profile_completed
                  ? "Refresh your profile anytime to improve visibility in Find Work and public profile views."
                  : "Finish onboarding to unlock Find Work, Applied Works, and Saved Jobs."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/profile-completion")}
            className="mt-4 inline-flex items-center justify-center rounded-[8px] bg-accent px-4 py-2.5 text-[14px] font-semibold text-white transition hover:bg-accent/90"
          >
            {user.profile_completed ? "Update Profile" : "Complete Profile"}
          </button>
        </motion.section>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Contracts Done" value={contractsDone} meta="Confirmed hires across your submitted applications" />
        <StatCard label="Applications" value={freelancerApps.length} meta="Total jobs you have applied for" />
        <StatCard label="Profile Strength" value={`${user.profile_completion_percent}%`} meta="Progress based on your current onboarding data" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.95fr)]">
        <div className="space-y-4">
          <motion.section variants={sectionMotion} className="space-y-3">
            <div>
              <p className="text-[0.95rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Quick Actions</p>
              <h2 className="mt-1.5 text-[1.6rem] font-display font-semibold text-foreground">Quick Actions</h2>
            </div>
            <div className="grid gap-4">
              <button
                type="button"
                onClick={() => navigate(isIncompleteFreelancer ? "/profile-completion" : "/dashboard/find-work")}
                className="rounded-[12px] border border-border bg-card p-4 text-left shadow-[0_18px_36px_-30px_rgba(15,23,42,0.16)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-muted/55 text-foreground">
                    <Search className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[1.12rem] font-display font-semibold text-foreground">Browse Jobs</h3>
                    <p className="mt-1.5 text-[15px] leading-7 text-muted-foreground">
                      Discover current opportunities based on your skills and saved interests.
                    </p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigate("/profile-completion")}
                className="rounded-[12px] border border-border bg-card p-4 text-left shadow-[0_18px_36px_-30px_rgba(15,23,42,0.16)]"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-muted/55 text-foreground">
                    <UserRoundPen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[1.12rem] font-display font-semibold text-foreground">Update Profile</h3>
                    <p className="mt-1.5 text-[15px] leading-7 text-muted-foreground">
                      Refresh your portfolio, title, skills, and links to stay competitive.
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </motion.section>

          <motion.section variants={sectionMotion} className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[0.95rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Recommendations</p>
                <h2 className="mt-1.5 text-[1.6rem] font-display font-semibold text-foreground">Recommended Jobs</h2>
              </div>
              <Link to="/dashboard/find-work" className="inline-flex items-center gap-2 font-display text-[0.98rem] text-muted-foreground transition hover:text-foreground">
                View more jobs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {recommendedJobs.length === 0 ? (
                <div className="rounded-[12px] border border-border bg-card p-4 text-sm text-muted-foreground">
                  No jobs have been posted yet.
                </div>
              ) : (
                recommendedJobs.map((job) => (
                  <div key={job.id} className="rounded-[12px] border border-border bg-card p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.16)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-[1.08rem] font-display font-semibold text-foreground">{job.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{job.clientName}</p>
                        <p className="mt-2 text-sm text-muted-foreground">{[job.domain, job.subdomain].filter(Boolean).join(" / ")}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(isIncompleteFreelancer ? "/profile-completion" : `/dashboard/job/${job.id}`)}
                        className="rounded-[10px] bg-black px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                      >
                        View Details
                      </button>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {job.requiredSkills.slice(0, 4).map((skill) => (
                        <span key={skill} className="rounded-full bg-muted/55 px-2.5 py-1 text-[14px] text-muted-foreground">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.section>
        </div>

        <motion.aside variants={sectionMotion} className="space-y-4">
          <div className="rounded-[12px] border border-border bg-card p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.16)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-accent/15 text-accent">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[1.08rem] font-display font-semibold text-foreground">Profile strength</p>
                <p className="mt-1 text-[15px] leading-7 text-muted-foreground">
                  {user.profile_completed ? "Your profile is active and client-ready." : "Finish onboarding to unlock full access."}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 rounded-full bg-muted/55">
              <div
                className="h-full rounded-full bg-gradient-to-r from-accent/60 to-accent"
                style={{ width: `${Math.max(user.profile_completion_percent, user.profile_completed ? 100 : 12)}%` }}
              />
            </div>
            <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
              Add your title, skills, portfolio, and links to improve matching and profile visibility.
            </p>
          </div>

          <div className="rounded-[12px] border border-border bg-card p-4 shadow-[0_18px_36px_-30px_rgba(15,23,42,0.14)]">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-muted/55 text-foreground">
                <CircleCheckBig className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[1.08rem] font-display font-semibold text-foreground">Marketplace snapshot</p>
                <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
                  {jobsQuery.isLoading ? "Loading current marketplace activity..." : `${jobsQuery.data?.jobs.length ?? 0} live jobs are currently available.`}
                </p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Briefcase className="h-4 w-4" /> Live jobs</span>
                <span className="font-semibold text-foreground">{jobsQuery.data?.jobs.length ?? 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> Applied jobs</span>
                <span className="font-semibold text-foreground">{freelancerApps.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-2"><Star className="h-4 w-4" /> Hired</span>
                <span className="font-semibold text-foreground">{contractsDone}</span>
              </div>
            </div>
          </div>
        </motion.aside>
      </div>

      <DashboardFooter />
    </motion.div>
  );
};

export default DashboardHome;
