import { motion } from "framer-motion";
import { Briefcase, DollarSign, ExternalLink, Film, FolderKanban, Github, Image as ImageIcon, Linkedin, MapPin, Pencil, Users } from "lucide-react";
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
    <div className="max-w-4xl space-y-8">
      <motion.section {...revealProps} className="border-b border-border pb-7">
        <div className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Professional profile preview</p>
          <h1 className="mt-2 text-2xl font-display font-semibold text-foreground sm:text-3xl">{headline}</h1>
        </div>

        <div className="space-y-6 pt-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <img
                src={profile.personal.profilePhoto || user.avatar}
                alt={displayName}
                className="h-20 w-20 rounded-full border border-border bg-muted object-cover"
              />
              <div className="space-y-1.5">
                <h2 className="text-2xl font-display font-semibold text-foreground">{displayName}</h2>
                <p className="text-[15px] text-muted-foreground">{username || user.email}</p>
                {subtitle && <p className="text-[15px] font-medium text-foreground">{subtitle}</p>}
                <p className="inline-flex items-center gap-1 text-[15px] text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {location || "Location not set"}
                </p>
              </div>
            </div>

            {showEditButton ? (
              <button onClick={onEditProfile} className="dashboard-btn-primary">
                <Pencil className="h-4 w-4" />
                {profileActionLabel}
              </button>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Hourly Rate</p>
              <p className="mt-1 text-lg font-display font-semibold text-foreground" data-testid="hourly-rate-stat">
                {hourlyRateLabel}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Projects</p>
              <p className="mt-1 text-lg font-display font-semibold text-foreground" data-testid="projects-count-stat">
                {totalProjects}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Clients Served</p>
              <p className="mt-1 text-lg font-display font-semibold text-foreground" data-testid="clients-served-count-stat">
                {clientsServed.length}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Location</p>
              <p className="mt-1 truncate text-lg font-display font-semibold text-foreground">{location || "Not set"}</p>
            </div>
          </div>
        </div>
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">About</h3>
        {about ? (
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">{about}</p>
        ) : (
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            Add a strong professional summary to explain your experience, approach, and outcomes for clients.
          </p>
        )}
        {socialActions.length > 0 && (
          <div className="mt-4 max-w-sm rounded-[8px] border border-border bg-muted/20 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Profiles</p>
            <div className="mt-3 flex flex-col gap-2">
              {socialActions.map(({ key, label, href, Icon }) => (
                <a
                  key={key}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-between gap-3 rounded-[6px] border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition hover:border-secondary/40 hover:text-secondary"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" />
                    {label}
                  </span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
        )}
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">Domains</h3>
        {domains.length > 0 || specializations.length > 0 ? (
          <div className="mt-3 space-y-3">
            {domains.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {domains.map((domain) => (
                  <span key={domain} className="rounded-[4px] border border-border px-2.5 py-1 text-sm font-medium text-foreground">
                    {domain}
                  </span>
                ))}
              </div>
            ) : null}
            {specializations.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {specializations.map((specialization) => (
                  <span key={specialization} className="rounded-[4px] bg-secondary/10 px-2.5 py-1 text-sm font-medium text-secondary">
                    {specialization}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ) : (
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            Add domains and subdomains during onboarding so clients can quickly understand your focus areas.
          </p>
        )}
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">Skills</h3>
        {skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2.5">
            {skills.map((skill) => (
              <span key={skill} className="rounded-[4px] bg-secondary/10 px-2.5 py-1 text-sm font-medium text-secondary">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            Add key skills in onboarding so clients can match you to relevant projects faster.
          </p>
        )}
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">Rate & Availability</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Hourly Rate
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground">{hourlyRateLabel}</p>
          </div>
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" />
              Availability
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground">{availability}</p>
          </div>
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Minimum Budget
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground">
              {minimumProjectBudget != null ? `${currency} ${formatAmount(minimumProjectBudget)}` : "Not set"}
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">Projects Gallery</h3>
        {projects.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project) => {
              const media = getProjectPreviewMedia(project.media);
              const hasPreview = isPreviewableMedia(media);

              return (
                <article key={project.id} className="overflow-hidden rounded-[4px] border border-border bg-background">
                  <div className="aspect-[16/10] border-b border-border bg-muted/35">
                    {hasPreview && media ? (
                      media.type.startsWith("video/") ? (
                        <div className="relative h-full w-full">
                          {usesVideoPosterPreview(media) ? (
                            <img
                              src={media.preview}
                              alt={`Preview for ${project.title || "project"}`}
                              className="h-full w-full object-cover"
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
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
                            <Film className="h-3 w-3" />
                            Video
                          </span>
                        </div>
                      ) : (
                        <img
                          src={media.preview}
                          alt={`Preview for ${project.title || "project"}`}
                          className="h-full w-full object-cover"
                          data-testid={`project-media-preview-${project.id}`}
                        />
                      )
                    ) : (
                      <div
                        className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center"
                        data-testid={`project-media-placeholder-${project.id}`}
                      >
                        <ImageIcon className="h-6 w-6 text-muted-foreground/70" />
                        <p className="line-clamp-2 text-xs font-medium text-muted-foreground">{media?.name || "No media uploaded yet"}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="truncate text-sm font-semibold text-foreground">{project.title || "Untitled project"}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            No projects added yet. Add your best work in onboarding to build trust with clients.
          </p>
        )}
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">Past Projects</h3>
        {projects.length > 0 ? (
          <div className="mt-4 space-y-4">
            {projects.map((project) => {
              const projectWindow = formatProjectWindow(project);
              return (
                <article key={`${project.id}-detail`} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h4 className="text-base font-display font-semibold text-foreground">{project.title || "Untitled project"}</h4>
                      <p className="mt-1 text-[15px] leading-7 text-muted-foreground">{project.description || "Description not added yet."}</p>
                    </div>
                    {project.projectUrl && (
                      <a
                        href={project.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-[4px] border border-border px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/35"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        View Project
                      </a>
                    )}
                  </div>

                  <div className="mt-3 grid gap-2 text-[13px] text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
                    <p>Client: {project.clientName || "Not specified"}</p>
                    <p>Role: {project.role || "Not specified"}</p>
                    <p>{projectWindow || "Timeline not specified"}</p>
                    <p>Media files: {project.media.length}</p>
                  </div>

                  {project.technologies.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {project.technologies.map((technology) => (
                        <span key={`${project.id}-${technology}`} className="rounded-[4px] bg-muted px-2 py-1 text-xs font-medium text-foreground">
                          {technology}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            Add completed projects to present your delivery quality, business context, and impact.
          </p>
        )}
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">Clients Served</h3>
        {clientsServed.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {clientsServed.map((client) => (
              <span key={client} className="inline-flex items-center gap-1 rounded-[4px] bg-primary/10 px-2.5 py-1 text-sm font-medium text-primary">
                <Users className="h-3.5 w-3.5" />
                {client}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            Add client names for your projects to strengthen social proof and credibility.
          </p>
        )}
      </motion.section>

      <motion.section {...revealProps} className="pb-1">
        <p className="inline-flex items-center gap-2 text-[15px] text-muted-foreground">
          <FolderKanban className="h-4 w-4" />
          Keep this page current. Regular updates improve profile visibility and response quality from clients.
        </p>
      </motion.section>
    </div>
  );
};

export default FreelancerSelfProfileView;
