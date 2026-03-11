import { motion } from "framer-motion";
import {
  Bell,
  Briefcase,
  Calendar,
  ExternalLink,
  Film,
  FolderKanban,
  Globe,
  Image as ImageIcon,
  Linkedin,
  Mail,
  MapPin,
  Pencil,
  Phone,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { User } from "@/contexts/AuthContext";
import type { ClientFileMeta, ClientProfileData } from "@/types/clientProfileCompletion";

interface ClientSelfProfileViewProps {
  user: Pick<User, "name" | "email" | "avatar" | "client_profile_completed">;
  profile: ClientProfileData;
  onEditProfile: () => void;
  showEditButton?: boolean;
}

const revealProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.28 },
} as const;

const BUDGET_RANGE_LABELS: Record<ClientProfileData["budget"]["budgetRange"] | "", string> = {
  "": "Not set",
  under_1k: "Under $1k",
  "1k_5k": "$1k - $5k",
  "5k_10k": "$5k - $10k",
  "10k_25k": "$10k - $25k",
  "25k_plus": "$25k+",
};

const DURATION_LABELS: Record<ClientProfileData["budget"]["projectDurationPreference"] | "", string> = {
  "": "Not set",
  less_than_week: "Less than a week",
  "1_4_weeks": "1 to 4 weeks",
  "1_3_months": "1 to 3 months",
  "3_plus_months": "3+ months",
  ongoing: "Ongoing",
};

const AVAILABILITY_LABELS: Record<ClientProfileData["availability"]["availabilityStatus"], string> = {
  actively_hiring: "Actively hiring",
  reviewing: "Reviewing candidates",
  planning: "Planning upcoming projects",
  paused: "Hiring paused",
};

const isPreviewableMedia = (media: ClientFileMeta | undefined) =>
  Boolean(media?.preview) && (media.type.startsWith("image/") || media.type.startsWith("video/"));

const getProjectPreviewMedia = (media: ClientFileMeta[]) => media.find(isPreviewableMedia) ?? media[0];

const usesVideoPosterPreview = (media: ClientFileMeta | undefined) =>
  Boolean(media?.type.startsWith("video/") && media.preview?.startsWith("data:image/"));

const ClientSelfProfileView = ({ user, profile, onEditProfile, showEditButton = true }: ClientSelfProfileViewProps) => {
  const displayName = profile.basic.companyName || profile.basic.fullName || user.name;
  const username = profile.basic.username ? `@${profile.basic.username}` : `@${user.email.split("@")[0] ?? "client"}`;
  const headline = profile.basic.professionalTitle || "Client profile";
  const location = [profile.contact.city, profile.contact.country].filter(Boolean).join(", ");
  const budgetRangeLabel = BUDGET_RANGE_LABELS[profile.budget.budgetRange];
  const projectDurationLabel = DURATION_LABELS[profile.budget.projectDurationPreference];
  const socialActions = [
    { key: "linkedin", label: "LinkedIn", href: profile.contact.linkedIn, Icon: Linkedin },
    { key: "website", label: "Website", href: profile.contact.website, Icon: Globe },
  ].filter((entry) => Boolean(entry.href.trim()));

  return (
    <div className="max-w-4xl space-y-8">
      <motion.section {...revealProps} className="border-b border-border pb-7">
        <div className="pb-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Client profile preview</p>
          <h1 className="mt-2 text-2xl font-display font-semibold text-foreground sm:text-3xl">{headline}</h1>
        </div>

        <div className="space-y-6 pt-1">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <img
                src={profile.basic.profilePhoto || user.avatar}
                alt={displayName}
                className="h-20 w-20 rounded-full border border-border bg-muted object-cover"
              />
              <div className="space-y-1.5">
                <h2 className="text-2xl font-display font-semibold text-foreground">{displayName}</h2>
                <p className="text-[15px] text-muted-foreground">{username}</p>
                <p className="text-[15px] font-medium text-foreground">{profile.about.businessType}</p>
                <p className="inline-flex items-center gap-1 text-[15px] text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {location || "Location not set"}
                </p>
              </div>
            </div>

            {showEditButton ? (
              <button onClick={onEditProfile} className="dashboard-btn-primary">
                <Pencil className="h-4 w-4" />
                {user.client_profile_completed ? "Update Profile" : "Complete Profile"}
              </button>
            ) : null}
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Budget Range</p>
              <p className="mt-1 text-lg font-display font-semibold text-foreground">{budgetRangeLabel}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Past Projects</p>
              <p className="mt-1 text-lg font-display font-semibold text-foreground">{profile.projects.projects.length}</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Hiring Status</p>
              <p className="mt-1 text-lg font-display font-semibold text-foreground">
                {AVAILABILITY_LABELS[profile.availability.availabilityStatus]}
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
        {profile.about.bio ? (
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-muted-foreground">{profile.about.bio}</p>
        ) : (
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            Add a company or hiring bio so freelancers understand how you work and what outcomes you care about.
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
        <h3 className="text-xl font-display font-semibold text-foreground">What I Usually Hire For</h3>
        {profile.hiring.skills.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2.5">
            {profile.hiring.skills.map((skill) => (
              <span key={skill} className="rounded-[4px] bg-secondary/10 px-2.5 py-1 text-sm font-medium text-secondary">
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            Add the roles and skill tags you hire for most often so freelancers can self-qualify faster.
          </p>
        )}
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">Budget & Project Preferences</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" />
              Budget Range
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground">{budgetRangeLabel}</p>
          </div>
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Project Duration
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground">{projectDurationLabel}</p>
          </div>
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              Payment Method
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground">{profile.budget.paymentMethod || "Not set"}</p>
          </div>
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Payment Verification
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground">{profile.budget.paymentVerified ? "Verified" : "Pending"}</p>
          </div>
        </div>
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">Past Projects / Hiring History</h3>
        {profile.projects.projects.length > 0 ? (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {profile.projects.projects.map((project) => {
              const media = getProjectPreviewMedia(project.media);
              const hasPreview = isPreviewableMedia(media);

              return (
                <article key={project.id} className="overflow-hidden rounded-[4px] border border-border bg-background">
                  <div className="aspect-[16/10] border-b border-border bg-muted/35">
                    {hasPreview && media ? (
                      media.type.startsWith("video/") ? (
                        <div className="relative h-full w-full">
                          {usesVideoPosterPreview(media) ? (
                            <img src={media.preview} alt={project.title} className="h-full w-full object-cover" />
                          ) : (
                            <video src={media.preview} className="h-full w-full object-cover" autoPlay loop muted playsInline preload="metadata" />
                          )}
                          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
                            <Film className="h-3 w-3" />
                            Video
                          </span>
                        </div>
                      ) : (
                        <img src={media.preview} alt={project.title} className="h-full w-full object-cover" />
                      )
                    ) : (
                      <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground/70" />
                        <p className="line-clamp-2 text-xs font-medium text-muted-foreground">{media?.name || "No media uploaded yet"}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 p-3">
                    <p className="truncate text-sm font-semibold text-foreground">{project.title || "Untitled project"}</p>
                    <div className="grid gap-1 text-[12px] text-muted-foreground">
                      <p>Budget: {project.budget || "Not set"}</p>
                      <p>Duration: {project.duration || "Not set"}</p>
                    </div>
                    <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{project.outcome || "Outcome details not added yet."}</p>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-[15px] leading-7 text-muted-foreground">
            Add recent hiring examples to show project scale, budgets, and the outcomes you expect.
          </p>
        )}
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">Reviews & Social Proof</h3>
        <div className="mt-4 rounded-[8px] border border-border bg-muted/20 p-4">
          <p className="text-[15px] leading-7 text-muted-foreground">{profile.reviews.placeholderNote}</p>
        </div>
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">Availability & Preferences</h3>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5" />
              Availability
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground">
              {AVAILABILITY_LABELS[profile.availability.availabilityStatus]}
            </p>
          </div>
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              Meeting Times
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground">
              {profile.availability.preferredMeetingTimes.join(", ") || "Not set"}
            </p>
          </div>
          <div>
            <p className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <Bell className="h-3.5 w-3.5" />
              Notifications
            </p>
            <p className="mt-1 text-[15px] font-semibold text-foreground">
              {profile.availability.notificationSettings.join(", ") || "Not set"}
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section {...revealProps} className="border-b border-border pb-7">
        <h3 className="text-xl font-display font-semibold text-foreground">Verification</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-[8px] border border-border bg-muted/20 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Mail className="h-4 w-4" />
              {profile.verification.email || "Email not set"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{profile.verification.emailVerified ? "Email verified" : "Email pending verification"}</p>
          </div>
          <div className="rounded-[8px] border border-border bg-muted/20 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <Phone className="h-4 w-4" />
              {[profile.verification.phoneCountryCode, profile.verification.phoneNumber].filter(Boolean).join(" ") || "Phone not set"}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">{profile.verification.phoneVerified ? "Phone verified" : "Phone pending verification"}</p>
          </div>
          <div className="rounded-[8px] border border-border bg-muted/20 p-4">
            <p className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4" />
              Payment setup
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {profile.verification.paymentVerified ? "Payment verified" : "Payment pending verification"}
            </p>
          </div>
        </div>
      </motion.section>

      <motion.section {...revealProps} className="pb-1">
        <p className="inline-flex items-center gap-2 text-[15px] text-muted-foreground">
          <FolderKanban className="h-4 w-4" />
          Keep this page current. Clear hiring details help the right freelancers respond faster and with better-fit proposals.
        </p>
      </motion.section>
    </div>
  );
};

export default ClientSelfProfileView;
