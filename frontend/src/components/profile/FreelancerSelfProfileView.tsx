import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Briefcase, DollarSign, ExternalLink, Film, FolderKanban, Github, Image as ImageIcon, Linkedin, MapPin, Pencil, Users, X } from "lucide-react";
import type { Freelancer } from "@/data/mockData";
import type { User } from "@/contexts/AuthContext";
import type { ProfileData, ProfileMediaMeta } from "@/types/profileCompletion";

interface FreelancerSelfProfileViewProps {
  user: Pick<User, "name" | "email" | "avatar" | "profile_completed" | "username">;
  profile: ProfileData;
  legacyFreelancer?: Freelancer;
  onEditProfile: () => void;
  showEditButton?: boolean;
}

interface DisplayProject {
  id: string;
  title: string;
  description: string;
  projectUrl: string;
  media: ProfileMediaMeta[];
  technologies: string[];
  clientName: string;
  role: string;
  startDate: string;
  endDate: string;
}

const dedupeText = (values: string[]) =>
  Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );

const parsePositive = (value: string | undefined) => {
  const parsed = Number(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

const formatAmount = (value: number) => {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/\.00$/, "");
};

const isPreviewableMedia = (media: ProfileMediaMeta | undefined) =>
  Boolean(media?.preview) && (media.type.startsWith("image/") || media.type.startsWith("video/"));

const getProjectPreviewMedia = (media: ProfileMediaMeta[]) => media.find(isPreviewableMedia) ?? media[0];

const usesVideoPosterPreview = (media: ProfileMediaMeta | undefined) =>
  Boolean(media?.type.startsWith("video/") && media.preview?.startsWith("data:image/"));

const AVAILABILITY_LABELS: Record<ProfileData["professional"]["availabilityStatus"], string> = {
  available_now: "Available now",
  part_time: "Part time",
  full_time: "Full time",
  unavailable_until: "Unavailable until set date",
};

const revealProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.28 },
} as const;

const FreelancerSelfProfileView = ({
  user,
  profile,
  legacyFreelancer,
  onEditProfile,
  showEditButton = true,
}: FreelancerSelfProfileViewProps) => {
  const [selectedProject, setSelectedProject] = useState<DisplayProject | null>(null);
  const [fullscreenMedia, setFullscreenMedia] = useState<ProfileMediaMeta | null>(null);
  const displayName = profile.personal.fullName || profile.personal.name || user.name;
  const usernameSeed = user.username?.trim() || user.email.split("@")[0]?.trim().toLowerCase();
  const username = usernameSeed ? `@${usernameSeed}` : "";

  const headline =
    profile.professional.title ||
    profile.professional.specializations?.[0] ||
    profile.professional.domains?.[0] ||
    legacyFreelancer?.professionalTitle ||
    legacyFreelancer?.title ||
    "Freelancer";

  const subtitle =
    profile.professional.specializations?.[0] ||
    profile.professional.domains?.[0] ||
    legacyFreelancer?.professionalTitle ||
    legacyFreelancer?.title ||
    "";

  const profileActionLabel = user.profile_completed ? "Update Profile" : "Complete Profile";

  const location = [profile.personal.city || legacyFreelancer?.city, profile.personal.country || legacyFreelancer?.country]
    .filter(Boolean)
    .join(", ");

  const skills = dedupeText(
    (profile.skills ?? []).length > 0
      ? profile.skills ?? []
      : profile.expertise.primarySkills.length > 0
        ? profile.expertise.primarySkills.map((entry) => entry.name)
        : legacyFreelancer?.skills ?? []
  );
  const domains = dedupeText(profile.professional.domains ?? []);
  const specializations = dedupeText(
    (profile.professional.specializations ?? []).concat(profile.expertise.specializations ?? [])
  );

  const about =
    profile.professional.overview ||
    profile.personal.tagline ||
    legacyFreelancer?.bio ||
    "";

  const socialActions = [
    {
      key: "linkedin",
      label: "LinkedIn",
      href: profile.socialLinks.linkedIn,
      Icon: Linkedin,
    },
    {
      key: "github",
      label: "GitHub",
      href: profile.socialLinks.github,
      Icon: Github,
    },
  ].filter((entry) => Boolean(entry.href.trim()));

  const modernProjects = profile.portfolio.projects.map<DisplayProject>((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    projectUrl: project.projectUrl,
    media: project.images,
    technologies: project.technologies,
    clientName: project.clientName,
    role: project.role,
    startDate: project.startDate,
    endDate: project.endDate,
  }));

  const legacyProjects = (profile.projects ?? []).map<DisplayProject>((project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    projectUrl: project.repo,
    media: project.media,
    technologies: [],
    clientName: "",
    role: "",
    startDate: "",
    endDate: "",
  }));

  const projects = modernProjects.length > 0 ? modernProjects : legacyProjects;
  const totalProjects = projects.length;
  const clientsServed = dedupeText(projects.map((project) => project.clientName));

  const currency = profile.payment.currency || profile.rates?.currency || "USD";
  const hourlyMin = parsePositive(profile.payment.hourlyRateMin || profile.rates?.hourly);
  const hourlyMax = parsePositive(profile.payment.hourlyRateMax || profile.rates?.hourly);
  const minimumProjectBudget = parsePositive(profile.payment.minimumProjectBudget || profile.rates?.project_rate);
  const availability = AVAILABILITY_LABELS[profile.professional.availabilityStatus] || "Not specified";

  const hourlyRateLabel = (() => {
    if (hourlyMin != null && hourlyMax != null) {
      if (hourlyMin === hourlyMax) return `${currency} ${formatAmount(hourlyMin)} / hr`;
      return `${currency} ${formatAmount(hourlyMin)} - ${formatAmount(hourlyMax)} / hr`;
    }
    if (hourlyMin != null) return `${currency} ${formatAmount(hourlyMin)} / hr`;
    if (hourlyMax != null) return `${currency} ${formatAmount(hourlyMax)} / hr`;
    return "Not set";
  })();

  const formatProjectWindow = (project: DisplayProject) => {
    if (project.startDate && project.endDate) return `${project.startDate} - ${project.endDate}`;
    if (project.startDate) return `Started ${project.startDate}`;
    if (project.endDate) return `Completed ${project.endDate}`;
    return "";
  };

  return (
    <div className="relative mx-auto mt-4 max-w-4xl space-y-8 z-0">
      {/* ── Abstract Atmosphere Glows ──────────────────────────────────────── */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -z-10 h-[500px] w-full max-w-[800px] -translate-x-1/2 opacity-30 mix-blend-screen overflow-hidden">
        <div className="absolute left-1/4 top-1/4 h-[300px] w-[300px] rounded-full bg-primary/40 blur-[100px] filter" />
        <div className="absolute bottom-1/4 right-1/4 h-[250px] w-[250px] rounded-full bg-accent/40 blur-[100px] filter" />
      </div>

      <motion.section
        {...revealProps}
        className="relative overflow-hidden rounded-[28px] border border-white/5 bg-background/40 backdrop-blur-3xl shadow-[0_8px_40px_rgba(0,0,0,0.4)]"
      >
        {/* Subtle inner top glow for the card */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/15 to-transparent" />

        <div className="p-6 sm:p-8">
          <div className="pb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/80">Professional profile preview</p>
            <h1 className="mt-2 text-2xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/60 sm:text-3xl tracking-tight">
              {headline}
            </h1>
          </div>

          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between pt-2">
            <div className="flex items-start gap-4">
              <div className="relative">
                <img
                  src={profile.personal.profilePhoto || user.avatar}
                  alt={displayName}
                  className="h-20 w-20 rounded-[20px] sm:h-24 sm:w-24 border border-white/15 object-cover shadow-2xl transition-transform hover:scale-105"
                />
                <div className="absolute -inset-0.5 -z-10 rounded-[22px] bg-gradient-to-br from-primary/30 to-accent/30 opacity-50 blur-md" />
              </div>

              <div className="space-y-1.5 mt-1 sm:mt-2">
                <h2 className="text-xl sm:text-2xl font-display font-semibold text-white drop-shadow-sm">{displayName}</h2>
                <p className="text-[14px] text-white/50">{username || user.email}</p>
                {subtitle && <p className="text-[14px] font-medium text-white/80">{subtitle}</p>}
                <p className="inline-flex items-center gap-1.5 text-[14px] text-white/50 pt-1">
                  <MapPin className="h-4 w-4" />
                  {location || "Location not set"}
                </p>
              </div>
            </div>

            {showEditButton ? (
              <button
                onClick={onEditProfile}
                className="inline-flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-primary/20 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-primary/5"
              >
                <Pencil className="h-4 w-4" />
                {profileActionLabel}
              </button>
            ) : null}
          </div>

          {/* Stats Bar Container inside the main card */}
          <div className="mt-8 grid gap-4 rounded-2xl border border-white/5 bg-black/20 p-5 sm:grid-cols-2 lg:grid-cols-4 shadow-inner">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Hourly Rate</p>
              <p className="text-[17px] font-display font-semibold text-white/90" data-testid="hourly-rate-stat">
                {hourlyRateLabel}
              </p>
            </div>
            <div className="space-y-1 border-white/5 sm:border-l sm:pl-4 lg:pl-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Projects</p>
              <p className="text-[17px] font-display font-semibold text-white/90" data-testid="projects-count-stat">
                {totalProjects}
              </p>
            </div>
            <div className="space-y-1 border-white/5 sm:border-t-0 sm:border-l lg:pl-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Clients</p>
              <p className="text-[17px] font-display font-semibold text-white/90" data-testid="clients-served-count-stat">
                {clientsServed.length}
              </p>
            </div>
            <div className="space-y-1 border-white/5 sm:border-t-0 sm:border-l lg:pl-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Location</p>
              <p className="truncate text-[17px] font-display font-semibold text-white/90">{location || "Not set"}</p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.section {...revealProps} className="relative overflow-hidden rounded-[24px] border border-white/5 bg-background/30 p-6 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h3 className="text-lg font-display font-bold text-white drop-shadow-md">About</h3>
          {about ? (
            <p className="mt-4 whitespace-pre-wrap break-words text-[14px] leading-relaxed text-white/70">{about}</p>
          ) : (
            <p className="mt-4 text-[14px] leading-relaxed text-white/40">
              Add a strong professional summary to explain your experience, approach, and outcomes for clients.
            </p>
          )}

          {socialActions.length > 0 && (
            <div className="mt-6 border-t border-white/5 pt-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Profiles</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {socialActions.map(({ key, label, href, Icon }) => (
                  <a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3.5 py-2 text-[13px] font-medium text-white/80 transition-all hover:bg-white/5 hover:text-white hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                    <ExternalLink className="h-3 w-3 opacity-50" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </motion.section>

        <motion.section {...revealProps} className="relative overflow-hidden rounded-[24px] border border-white/5 bg-background/30 p-6 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h3 className="text-lg font-display font-bold text-white drop-shadow-md">Rate & Availability</h3>
          <div className="mt-5 space-y-6">
            <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Hourly Rate</p>
                <p className="mt-0.5 text-[15px] font-bold text-white/90">{hourlyRateLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent">
                <Briefcase className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Availability</p>
                <p className="mt-0.5 text-[15px] font-bold text-white/90">{availability}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-white/5 bg-black/20 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/10 text-blue-400">
                <FolderKanban className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Minimum Budget</p>
                <p className="mt-0.5 text-[15px] font-bold text-white/90">
                  {minimumProjectBudget != null ? `${currency} ${formatAmount(minimumProjectBudget)}` : "Not set"}
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.section {...revealProps} className="relative overflow-hidden rounded-[24px] border border-white/5 bg-background/30 p-6 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h3 className="text-lg font-display font-bold text-white drop-shadow-md">Domains & Focus</h3>
          {domains.length > 0 || specializations.length > 0 ? (
            <div className="mt-5 space-y-4">
              {domains.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {domains.map((domain) => (
                    <span key={domain} className="rounded-full border border-primary/20 bg-primary/10 px-3.5 py-1.5 text-[12px] font-semibold text-primary shadow-[0_0_10px_rgba(var(--primary),0.1)]">
                      {domain}
                    </span>
                  ))}
                </div>
              )}
              {specializations.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {specializations.map((specialization) => (
                    <span key={specialization} className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[12px] font-semibold text-white/70">
                      {specialization}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="mt-4 text-[14px] leading-relaxed text-white/40">
              Add domains and subdomains during onboarding so clients can quickly understand your focus areas.
            </p>
          )}
        </motion.section>

        <motion.section {...revealProps} className="relative overflow-hidden rounded-[24px] border border-white/5 bg-background/30 p-6 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <h3 className="text-lg font-display font-bold text-white drop-shadow-md">Key Skills</h3>
          {skills.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {skills.map((skill) => (
                <span key={skill} className="rounded-xl border border-accent/20 bg-accent/10 px-3 py-1.5 text-[12px] font-semibold text-accent shadow-[0_0_10px_rgba(var(--accent),0.1)]">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-[14px] leading-relaxed text-white/40">
              Add key skills in onboarding so clients can match you to relevant projects faster.
            </p>
          )}
        </motion.section>
      </div>

      <motion.section {...revealProps} className="relative overflow-hidden rounded-[24px] border border-white/5 bg-background/30 p-6 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <h3 className="text-lg font-display font-bold text-white drop-shadow-md">My Projects</h3>
        {projects.length > 0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const media = getProjectPreviewMedia(project.media);
              const hasPreview = isPreviewableMedia(media);

              return (
                <article
                  key={project.id}
                  onClick={() => setSelectedProject(project)}
                  className="group cursor-pointer overflow-hidden rounded-[20px] border border-white/10 bg-black/40 transition-all duration-300 hover:border-primary/40 hover:bg-black/60 hover:shadow-[0_8px_30px_rgba(var(--primary),0.15)] hover:-translate-y-1"
                >
                  <div className="aspect-[16/10] border-b border-white/10 bg-muted/20 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    {hasPreview && media ? (
                      media.type.startsWith("video/") ? (
                        <div className="relative h-full w-full">
                          {usesVideoPosterPreview(media) ? (
                            <img
                              src={media.preview}
                              alt={`Preview for ${project.title || "project"}`}
                              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                              data-testid={`project-media-preview-${project.id}`}
                            />
                          ) : (
                            <video
                              src={media.preview}
                              className="h-full w-full object-cover"
                              autoPlay
                              loop
                              muted
                              playsInline
                              preload="metadata"
                              data-testid={`project-media-preview-${project.id}`}
                            />
                          )}
                          <span className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-md px-2 py-1 text-[10px] font-bold tracking-wide text-white border border-white/10">
                            <Film className="h-3 w-3" />
                            Video
                          </span>
                        </div>
                      ) : (
                        <img
                          src={media.preview}
                          alt={`Preview for ${project.title || "project"}`}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          data-testid={`project-media-preview-${project.id}`}
                        />
                      )
                    ) : (
                      <div
                        className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center"
                        data-testid={`project-media-placeholder-${project.id}`}
                      >
                        <ImageIcon className="h-6 w-6 text-white/30" />
                        <p className="line-clamp-2 text-xs font-medium text-white/40">{media?.name || "No media uploaded yet"}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="truncate text-[15px] font-bold text-white/90 group-hover:text-primary transition-colors">{project.title || "Untitled project"}</p>
                    {project.description && (
                      <p className="mt-1.5 text-xs text-white/50 line-clamp-2 leading-relaxed">{project.description}</p>
                    )}
                    {project.technologies.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {project.technologies.slice(0, 3).map((tech) => (
                          <span key={`${project.id}-${tech}`} className="rounded-md border border-white/5 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/70">
                            {tech}
                          </span>
                        ))}
                        {project.technologies.length > 3 && (
                          <span className="rounded-md border border-white/5 bg-white/5 px-2 py-1 text-[10px] font-semibold text-white/50">+{project.technologies.length - 3}</span>
                        )}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-4 text-[14px] leading-relaxed text-white/40">
            No projects added yet. Add your best work in onboarding to build trust with clients.
          </p>
        )}
      </motion.section>

      <motion.section {...revealProps} className="relative overflow-hidden rounded-[24px] border border-white/5 bg-background/30 p-6 backdrop-blur-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <h3 className="text-lg font-display font-bold text-white drop-shadow-md">Clients Served</h3>
        {clientsServed.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2.5">
            {clientsServed.map((client) => (
              <span key={client} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-[13px] font-semibold text-white/80 transition-colors hover:bg-white/10">
                <Users className="h-3.5 w-3.5 opacity-60" />
                {client}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-[14px] leading-relaxed text-white/40">
            Add client names for your projects to strengthen social proof and credibility.
          </p>
        )}
      </motion.section>

      <motion.section {...revealProps} className="pb-4 pt-2">
        <p className="inline-flex items-center gap-2 text-[13px] font-medium text-white/40">
          <FolderKanban className="h-4 w-4" />
          Keep this page current. Regular updates improve profile visibility.
        </p>
      </motion.section>

      {/* ── Liquid Glass Project Detail Modal ──────────────────────────────── */}
      <AnimatePresence>
        {selectedProject && (() => {
          const modalMedia = getProjectPreviewMedia(selectedProject.media);
          const modalHasPreview = isPreviewableMedia(modalMedia);
          const projectWindow = formatProjectWindow(selectedProject);

          return (
            <motion.div
              key="project-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-8"
              onClick={() => setSelectedProject(null)}
            >
              {/* Backdrop */}
              <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" />

              {/* Modal Card — Liquid Glass */}
              <motion.div
                key="project-modal-card"
                initial={{ opacity: 0, scale: 0.92, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 30 }}
                transition={{ type: "spring", bounce: 0.22, duration: 0.5 }}
                onClick={(e) => e.stopPropagation()}
                className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[28px] shadow-[0_32px_80px_-12px_rgba(0,0,0,0.6)]"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 50%, rgba(255,255,255,0.06) 100%)",
                  backdropFilter: "blur(40px) saturate(1.8)",
                  WebkitBackdropFilter: "blur(40px) saturate(1.8)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  boxShadow: "inset 0 1px 0 0 rgba(255,255,255,0.1), inset 0 -1px 0 0 rgba(255,255,255,0.05), 0 32px 80px -12px rgba(0,0,0,0.6)",
                }}
              >
                {/* Gloss highlight */}
                <div
                  className="pointer-events-none absolute inset-x-0 top-0 h-32 rounded-t-[28px]"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)",
                  }}
                />

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="absolute top-4 right-4 z-20 flex h-10 w-10 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.15)",
                  }}
                >
                  <X className="h-5 w-5 text-white/90" />
                </button>

                {/* Project Details */}
                <div className="relative p-6 sm:p-8 space-y-5">
                  <div>
                    <h2 className="text-2xl font-display font-bold text-white tracking-tight">{selectedProject.title || "Untitled project"}</h2>
                    {selectedProject.clientName && (
                      <p className="mt-1 text-sm font-medium text-white/50">Client: {selectedProject.clientName}</p>
                    )}
                  </div>

                  {selectedProject.description && (
                    <p className="text-[15px] leading-relaxed text-white/75 whitespace-pre-wrap break-words">{selectedProject.description}</p>
                  )}

                  {/* ── All Media Grid ──────────────────────────────── */}
                  {(() => {
                    const previewableMedia = selectedProject.media.filter(isPreviewableMedia);
                    const count = previewableMedia.length;

                    if (count === 0) return null;

                    // Dynamic grid class based on media count
                    const gridClass =
                      count === 1 ? "grid-cols-1" :
                      count === 2 ? "grid-cols-2" :
                      count === 3 ? "grid-cols-3" :
                      count === 4 ? "grid-cols-2" :
                      count <= 6 ? "grid-cols-3" :
                      "grid-cols-4";

                    return (
                      <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Project Media</p>
                        <div className={`grid ${gridClass} gap-2`}>
                          {previewableMedia.map((media, idx) => (
                            <button
                              key={`media-${selectedProject.id}-${idx}`}
                              type="button"
                              onClick={() => setFullscreenMedia(media)}
                              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-white/10 transition-all hover:border-white/25 hover:scale-[1.03] active:scale-[0.97] focus:outline-none"
                            >
                              {media.type.startsWith("video/") ? (
                                <>
                                  {usesVideoPosterPreview(media) ? (
                                    <img src={media.preview} alt={media.name || `Media ${idx + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                  ) : (
                                    <video src={media.preview} className="h-full w-full object-cover" muted playsInline preload="metadata" />
                                  )}
                                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
                                    style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                                    <Film className="h-2.5 w-2.5" /> Video
                                  </span>
                                </>
                              ) : (
                                <img src={media.preview} alt={media.name || `Media ${idx + 1}`} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                              )}
                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                <ImageIcon className="h-6 w-6 text-white opacity-0 group-hover:opacity-80 transition-opacity drop-shadow-lg" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Meta row */}
                  <div className="flex flex-wrap gap-3">
                    {selectedProject.role && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/80"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <Briefcase className="h-3 w-3" />
                        {selectedProject.role}
                      </span>
                    )}
                    {projectWindow && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/80"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        {projectWindow}
                      </span>
                    )}
                    {selectedProject.media.length > 0 && (
                      <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-white/80"
                        style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)" }}>
                        <ImageIcon className="h-3 w-3" />
                        {selectedProject.media.length} media file{selectedProject.media.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Technologies */}
                  {selectedProject.technologies.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">Technologies</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedProject.technologies.map((tech) => (
                          <span
                            key={`modal-${selectedProject.id}-${tech}`}
                            className="rounded-full px-3 py-1 text-xs font-semibold"
                            style={{
                              background: "linear-gradient(135deg, rgba(196,113,237,0.15), rgba(18,194,233,0.15))",
                              border: "1px solid rgba(196,113,237,0.2)",
                              color: "rgba(196,113,237,0.9)",
                            }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* View Project Link */}
                  {selectedProject.projectUrl && (
                    <a
                      href={selectedProject.projectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white transition-all hover:scale-[1.03] active:scale-[0.97]"
                      style={{
                        background: "linear-gradient(135deg, rgba(18,194,233,0.3), rgba(196,113,237,0.3), rgba(246,79,89,0.3))",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Project
                    </a>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Fullscreen Image Viewer ───────────────────────────────────────── */}
      <AnimatePresence>
        {fullscreenMedia && (
          <motion.div
            key="fullscreen-media-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-4"
            onClick={() => setFullscreenMedia(null)}
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />

            <button
              type="button"
              onClick={() => setFullscreenMedia(null)}
              className="absolute top-5 right-5 z-10 flex h-11 w-11 items-center justify-center rounded-full transition-all hover:scale-110 active:scale-95"
              style={{
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <X className="h-5 w-5 text-white" />
            </button>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
              className="relative z-10 max-h-[92vh] max-w-[92vw]"
              onClick={(e) => e.stopPropagation()}
            >
              {fullscreenMedia.type.startsWith("video/") ? (
                <video
                  src={fullscreenMedia.preview}
                  className="max-h-[92vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
                  autoPlay
                  loop
                  controls
                  playsInline
                />
              ) : (
                <img
                  src={fullscreenMedia.preview}
                  alt={fullscreenMedia.name || "Fullscreen preview"}
                  className="max-h-[92vh] max-w-[92vw] rounded-2xl object-contain shadow-2xl"
                />
              )}
              {fullscreenMedia.name && (
                <div className="absolute bottom-0 inset-x-0 rounded-b-2xl p-4" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
                  <p className="text-white font-medium text-sm truncate drop-shadow-md">{fullscreenMedia.name}</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FreelancerSelfProfileView;

