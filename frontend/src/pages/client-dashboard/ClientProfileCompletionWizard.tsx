import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Film, Plus, Trash2, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import OnboardingWorkspace from "@/components/profile-completion/OnboardingWorkspace";
import TypingHeadline from "@/components/profile-completion/TypingHeadline";
import {
  primaryButtonClass,
  secondaryButtonClass,
} from "@/components/profile-completion/MinimalProfilePrimitives";
import { CLIENT_INDUSTRY_OPTIONS, CLIENT_TIMEZONE_OPTIONS } from "@/data/clientProfileOptions";
import { COUNTRY_CITY_OPTIONS, LANGUAGE_OPTIONS, SKILL_SUGGESTIONS } from "@/data/profileOptions";
import { useToast } from "@/hooks/use-toast";
import { deriveClientProfileCompletion, sanitizeClientProfileData } from "@/lib/clientProfileCompletion";
import {
  PROFILE_PHOTO_PREVIEW_OPTIONS,
  PROJECT_IMAGE_PREVIEW_OPTIONS,
  PROJECT_VIDEO_PREVIEW_OPTIONS,
  readImagePreviewDataUrl,
  readMediaPreview,
} from "@/lib/mediaPreviews";
import { cn } from "@/lib/utils";
import ClientSelfProfileView from "@/components/profile/ClientSelfProfileView";
import type {
  ClientFileMeta,
  ClientPastProject,
  ClientProfileData,
  ClientWizardStep,
} from "@/types/clientProfileCompletion";

const steps = [
  { step: 1 as ClientWizardStep, label: "Basic", title: "Basic Profile Setup", subtitle: "Set up the core identity freelancers will see first." },
  { step: 2 as ClientWizardStep, label: "About", title: "About / Company Bio", subtitle: "Describe your business, your working style, and your industry context." },
  { step: 3 as ClientWizardStep, label: "Location", title: "Location & Contact", subtitle: "Add where you work from and how freelancers can verify your presence." },
  { step: 4 as ClientWizardStep, label: "Budget", title: "Budget & Project Preferences", subtitle: "Define the budget, duration, and payment expectations you use most often." },
  { step: 5 as ClientWizardStep, label: "Hiring For", title: "What I Usually Hire For", subtitle: "Tag the roles and capabilities you hire most often." },
  { step: 6 as ClientWizardStep, label: "Projects", title: "Past Projects / Hiring History", subtitle: "Show examples of the work you commission and how those projects turned out." },
  { step: 7 as ClientWizardStep, label: "Reviews", title: "Reviews & Social Proof", subtitle: "Reserve space for reviews and endorsements while this feature is being prepared." },
  { step: 8 as ClientWizardStep, label: "Availability", title: "Availability & Preferences", subtitle: "Share how and when freelancers should expect to work with you." },
  { step: 9 as ClientWizardStep, label: "Verify", title: "Verification", subtitle: "Confirm the contact and trust signals that support your client account." },
  { step: 10 as ClientWizardStep, label: "Finish", title: "Finish & Preview", subtitle: "Review the full client profile and publish when ready." },
] as const;

const introScreens = [
  "Complete your profile so freelancers can trust your vision.",
  "You can edit your profile anytime.",
] as const;

const businessTypeOptions = [
  { value: "individual", label: "Individual" },
  { value: "startup", label: "Startup" },
  { value: "agency", label: "Agency" },
  { value: "company", label: "Company" },
] as const;

const budgetRangeOptions = [
  { value: "under_1k", label: "Under $1k" },
  { value: "1k_5k", label: "$1k - $5k" },
  { value: "5k_10k", label: "$5k - $10k" },
  { value: "10k_25k", label: "$10k - $25k" },
  { value: "25k_plus", label: "$25k+" },
] as const;

const durationOptions = [
  { value: "less_than_week", label: "Less than a week" },
  { value: "1_4_weeks", label: "1 to 4 weeks" },
  { value: "1_3_months", label: "1 to 3 months" },
  { value: "3_plus_months", label: "3+ months" },
  { value: "ongoing", label: "Ongoing" },
] as const;

const availabilityOptions = [
  { value: "actively_hiring", label: "Actively hiring" },
  { value: "reviewing", label: "Reviewing candidates" },
  { value: "planning", label: "Planning upcoming projects" },
  { value: "paused", label: "Hiring paused" },
] as const;

const meetingTimeOptions = ["Early morning", "Morning", "Afternoon", "Evening", "Weekend"];
const notificationOptions = ["Email updates", "SMS alerts", "In-app notifications", "Weekly digest"];
const paymentMethodOptions = ["Bank transfer", "UPI", "PayPal", "Wise", "Stripe", "Milestone escrow"];
const phoneCodes = ["+1", "+44", "+49", "+61", "+65", "+81", "+91", "+971"];
const clientDomainSuggestions = CLIENT_INDUSTRY_OPTIONS;

const inputClass =
  "mt-2.5 h-11 w-full rounded-[16px] border border-border bg-muted/30 px-3.5 text-[15px] text-foreground outline-none transition placeholder:text-muted-foreground/50 hover:border-primary/30 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:opacity-55";
const textareaClass =
  "mt-2.5 min-h-[132px] w-full rounded-[18px] border border-border bg-muted/30 px-3.5 py-3 text-[15px] text-foreground outline-none transition placeholder:text-muted-foreground/50 hover:border-primary/30 focus:border-primary/50 focus:ring-4 focus:ring-primary/10";
const panelClass = "space-y-4";
const mutedLabelClass = "text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-muted-foreground/70";

const createProject = (): ClientPastProject => ({
  id: `client-project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  budget: "",
  duration: "",
  outcome: "",
  media: [],
});

const readProjectMediaPreview = async (file: File) => {
  return readMediaPreview(file, {
    image: PROJECT_IMAGE_PREVIEW_OPTIONS,
    video: PROJECT_VIDEO_PREVIEW_OPTIONS,
  });
};

const StepHeading = ({ title, subtitle: _subtitle }: { title: string; subtitle: string }) => (
  <div className="space-y-1.5 pb-1 text-left">
    <h2 className="font-display text-[2rem] font-black tracking-[-0.05em] text-foreground sm:text-[2.65rem]">{title}</h2>
  </div>
);

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-2 text-[15px] font-medium text-destructive">{message}</p> : null;

const TagInput = ({
  id,
  label,
  values,
  onChange,
  suggestions,
  placeholder,
  error,
  helperText,
}: {
  id: string;
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  suggestions: string[];
  placeholder: string;
  error?: string;
  helperText?: string;
}) => {
  const [input, setInput] = useState("");

  const addTag = (raw: string) => {
    const next = raw.trim();
    if (!next || values.some((value) => value.toLowerCase() === next.toLowerCase())) {
      setInput("");
      return;
    }

    onChange([...values, next]);
    setInput("");
  };

  const filteredSuggestions = suggestions
    .filter((suggestion) => !values.some((value) => value.toLowerCase() === suggestion.toLowerCase()))
    .filter((suggestion) => !input || suggestion.toLowerCase().includes(input.toLowerCase()))
    .slice(0, 8);

  return (
    <div>
      <label htmlFor={id} className="text-[0.82rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
        {label}
      </label>

      <div className="mt-2.5 rounded-[18px] border border-border bg-muted/30 px-3.5 py-3 transition hover:border-primary/30 focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/10">
        <div className="flex flex-wrap gap-2">
          {values.map((value) => (
            <span
              key={value}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
            >
              {value}
              <button
                type="button"
                aria-label={`Remove ${value}`}
                onClick={() => onChange(values.filter((entry) => entry !== value))}
                className="rounded-full text-primary transition hover:text-foreground"
              >
                x
              </button>
            </span>
          ))}

          <input
            id={id}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === ",") {
                event.preventDefault();
                addTag(input);
              }
            }}
            placeholder={values.length === 0 ? placeholder : "Type and press Enter"}
            className="min-w-[180px] flex-1 border-0 bg-transparent px-1 py-1 text-base text-foreground outline-none placeholder:text-muted-foreground/50"
          />
        </div>
      </div>

      {filteredSuggestions.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="rounded-full border border-border bg-muted/30 px-3 py-1.5 text-[15px] font-medium text-muted-foreground transition hover:border-primary/40 hover:text-primary"
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {helperText && <p className="mt-3 text-sm leading-7 text-muted-foreground">{helperText}</p>}
      <FieldError message={error} />
    </div>
  );
};

const ClientProfileCompletionWizard = () => {
  const { user, saveClientProfileStep, replaceClientProfile, saveClientProfileToServer, setClientProfileLastStep } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const initializedUserIdRef = useRef<string | null>(null);
  const autoSaveReadyRef = useRef(false);

  const [draft, setDraft] = useState<ClientProfileData>(() => sanitizeClientProfileData(user?.client_profile));
  const [currentStep, setCurrentStep] = useState<ClientWizardStep>(
    Math.min(10, Math.max(1, user?.client_profile_last_step ?? 1)) as ClientWizardStep
  );
  const [attemptedSteps, setAttemptedSteps] = useState<Partial<Record<ClientWizardStep, boolean>>>({});
  const [publishing, setPublishing] = useState(false);
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() =>
    sanitizeClientProfileData(user?.client_profile).projects.projects[0]?.id ?? null
  );
  const [introStep, setIntroStep] = useState(0);
  const [headlineFinished, setHeadlineFinished] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (initializedUserIdRef.current === user.id) return;

    initializedUserIdRef.current = user.id;
    setDraft(sanitizeClientProfileData(user.client_profile));
    setCurrentStep(Math.min(10, Math.max(1, user.client_profile_last_step ?? 1)) as ClientWizardStep);
    setAttemptedSteps({});
    setActiveProjectId(sanitizeClientProfileData(user.client_profile).projects.projects[0]?.id ?? null);
    setIntroStep(0);
    setHeadlineFinished(false);
    autoSaveReadyRef.current = false;
  }, [user]);

  useEffect(() => {
    const projectIds = draft.projects.projects.map((project) => project.id);
    if (projectIds.length === 0) {
      if (activeProjectId !== null) setActiveProjectId(null);
      return;
    }

    if (!activeProjectId || !projectIds.includes(activeProjectId)) {
      setActiveProjectId(projectIds[projectIds.length - 1]);
    }
  }, [activeProjectId, draft.projects.projects]);

  useEffect(() => {
    if (introStep !== 0) setHeadlineFinished(false);
  }, [introStep]);

  useEffect(() => {
    if (currentStep !== 10 || draft.finalReview.profilePreviewViewed) return;

    setDraft((previous) => ({
      ...previous,
      finalReview: {
        ...previous.finalReview,
        profilePreviewViewed: true,
      },
    }));
  }, [currentStep, draft.finalReview.profilePreviewViewed]);

  const completion = deriveClientProfileCompletion(draft);
  const currentMeta = steps.find((item) => item.step === currentStep) ?? steps[0];
  const cityOptions = COUNTRY_CITY_OPTIONS[draft.contact.country] ?? [];
  const introActive = introStep < introScreens.length;
  const introAdvanceReady = headlineFinished || import.meta.env.MODE === "test";

  const updateBasic = (patch: Partial<ClientProfileData["basic"]>) => {
    setDraft((previous) => ({
      ...previous,
      basic: {
        ...previous.basic,
        ...patch,
      },
    }));
  };

  const updateAbout = (patch: Partial<ClientProfileData["about"]>) => {
    setDraft((previous) => ({
      ...previous,
      about: {
        ...previous.about,
        ...patch,
      },
    }));
  };

  const updateContact = (patch: Partial<ClientProfileData["contact"]>) => {
    setDraft((previous) => ({
      ...previous,
      contact: {
        ...previous.contact,
        ...patch,
      },
    }));
  };

  const updateBudget = (patch: Partial<ClientProfileData["budget"]>) => {
    setDraft((previous) => ({
      ...previous,
      budget: {
        ...previous.budget,
        ...patch,
      },
      verification:
        patch.paymentVerified === undefined
          ? previous.verification
          : {
              ...previous.verification,
              paymentVerified: patch.paymentVerified,
            },
    }));
  };

  const updateHiring = (patch: Partial<ClientProfileData["hiring"]>) => {
    setDraft((previous) => ({
      ...previous,
      hiring: {
        ...previous.hiring,
        ...patch,
      },
    }));
  };

  const updateAvailability = (patch: Partial<ClientProfileData["availability"]>) => {
    setDraft((previous) => ({
      ...previous,
      availability: {
        ...previous.availability,
        ...patch,
      },
    }));
  };

  const updateVerification = (patch: Partial<ClientProfileData["verification"]>) => {
    setDraft((previous) => ({
      ...previous,
      verification: {
        ...previous.verification,
        ...patch,
      },
      budget:
        patch.paymentVerified === undefined
          ? previous.budget
          : {
              ...previous.budget,
              paymentVerified: patch.paymentVerified,
            },
    }));
  };

  const toggleSelection = (values: string[], value: string) =>
    values.includes(value) ? values.filter((entry) => entry !== value) : [...values, value];

  const addProject = () => {
    const nextProject = createProject();
    setDraft((previous) => ({
      ...previous,
      projects: {
        ...previous.projects,
        projects: [...previous.projects.projects, nextProject],
      },
    }));
    setActiveProjectId(nextProject.id);
  };

  const updateProject = (projectId: string, patch: Partial<ClientPastProject>) => {
    setDraft((previous) => ({
      ...previous,
      projects: {
        ...previous.projects,
        projects: previous.projects.projects.map((project) => (project.id === projectId ? { ...project, ...patch } : project)),
      },
    }));
  };

  const removeProject = (projectId: string) => {
    const remainingProjects = draft.projects.projects.filter((project) => project.id !== projectId);
    setDraft((previous) => ({
      ...previous,
      projects: {
        ...previous.projects,
        projects: previous.projects.projects.filter((project) => project.id !== projectId),
      },
    }));
    setActiveProjectId((current) => (current === projectId ? remainingProjects[remainingProjects.length - 1]?.id ?? null : current));
  };

  const buildMedia = async (file: File): Promise<ClientFileMeta> => ({
    name: file.name,
    type: file.type,
    size: file.size,
    lastModified: file.lastModified,
    preview: await readProjectMediaPreview(file),
  });

  const uploadProjectMedia = async (projectId: string, fileList: FileList | null) => {
    if (!fileList) return;
    const acceptedFiles = Array.from(fileList).filter((file) => file.type.startsWith("image/") || file.type.startsWith("video/"));
    const files = await Promise.all(acceptedFiles.map(buildMedia));
    if (files.length === 0) return;

    setDraft((previous) => ({
      ...previous,
      projects: {
        ...previous.projects,
        projects: previous.projects.projects.map((project) =>
          project.id === projectId ? { ...project, media: [...project.media, ...files].slice(0, 8) } : project
        ),
      },
    }));
  };

  const removeProjectMedia = (projectId: string, media: ClientFileMeta) => {
    setDraft((previous) => ({
      ...previous,
      projects: {
        ...previous.projects,
        projects: previous.projects.projects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                media: project.media.filter(
                  (candidate) => candidate.name !== media.name || candidate.lastModified !== media.lastModified
                ),
              }
            : project
        ),
      },
    }));
  };

  const uploadProfilePhoto = async (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Logo not added", description: "Use a JPG, PNG, WEBP, or GIF image file." });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "Logo not added", description: "Use an image that is 2MB or smaller." });
      return;
    }

    try {
      const profilePhoto = await readImagePreviewDataUrl(file, PROFILE_PHOTO_PREVIEW_OPTIONS);
      if (!profilePhoto) throw new Error("Empty profile image");
      updateBasic({ profilePhoto });
    } catch {
      toast({ title: "Logo not added", description: "There was a problem reading that image. Try another file." });
    }
  };

  const removeProfilePhoto = () => updateBasic({ profilePhoto: "" });

  const getErrors = (step: ClientWizardStep, snapshot: ClientProfileData = draft): Record<string, string> => {
    if (step === 1) {
      return {
        displayName:
          snapshot.basic.companyName.trim() || snapshot.basic.fullName.trim() ? "" : "Add your full name or company name.",
        professionalTitle: snapshot.basic.professionalTitle.trim().length >= 3 ? "" : "Add a clear headline.",
        username: snapshot.basic.username.trim().length >= 3 ? "" : "Username should be at least 3 characters.",
      };
    }

    if (step === 2) {
      return {
        bio: snapshot.about.bio.trim().length >= 40 ? "" : "Write at least 40 characters about your company or hiring style.",
        industries: snapshot.about.industries.length > 0 ? "" : "Select at least one industry.",
      };
    }

    if (step === 3) {
      return {
        country: snapshot.contact.country.trim() ? "" : "Select your country.",
        city: snapshot.contact.city.trim() ? "" : "Select your city.",
        timezone: snapshot.contact.timezone.trim() ? "" : "Select a timezone.",
        languages: snapshot.contact.languages.length > 0 ? "" : "Add at least one working language.",
        linkedIn: !snapshot.contact.linkedIn.trim() || /^https?:\/\//.test(snapshot.contact.linkedIn.trim()) ? "" : "Use a valid LinkedIn URL.",
        website: !snapshot.contact.website.trim() || /^https?:\/\//.test(snapshot.contact.website.trim()) ? "" : "Use a valid website URL.",
      };
    }

    if (step === 4) {
      return {
        budgetRange: snapshot.budget.budgetRange ? "" : "Choose the typical budget range.",
        duration: snapshot.budget.projectDurationPreference ? "" : "Choose a duration preference.",
        paymentMethod: snapshot.budget.paymentMethod.trim() ? "" : "Choose or enter a payment method.",
      };
    }

    if (step === 5) {
      return {
        skills: snapshot.hiring.skills.length >= 3 ? "" : "Add at least three skills or tags.",
      };
    }

    if (step === 6) {
      const errors: Record<string, string> = {};
      if (snapshot.projects.projects.length === 0) {
        errors.projects = "Add at least one hiring-history project.";
      }

      snapshot.projects.projects.forEach((project) => {
        errors[`${project.id}:title`] = project.title.trim() ? "" : "Add a project title.";
        errors[`${project.id}:budget`] = project.budget.trim() ? "" : "Add the budget.";
        errors[`${project.id}:duration`] = project.duration.trim() ? "" : "Add the duration.";
        errors[`${project.id}:outcome`] = project.outcome.trim() ? "" : "Describe the outcome.";
      });

      return errors;
    }

    if (step === 7) return {};

    if (step === 8) {
      return {
        availabilityStatus: snapshot.availability.availabilityStatus ? "" : "Choose your hiring availability.",
        preferredMeetingTimes: snapshot.availability.preferredMeetingTimes.length > 0 ? "" : "Select at least one meeting time preference.",
        notificationSettings: snapshot.availability.notificationSettings.length > 0 ? "" : "Select at least one notification preference.",
      };
    }

    if (step === 9) {
      const phoneDigits = snapshot.verification.phoneNumber.replace(/\D/g, "");
      return {
        email: snapshot.verification.email.trim() ? "" : "Add the verification email.",
        phoneNumber: phoneDigits.length >= 7 ? "" : "Enter a valid phone number.",
        emailVerified: snapshot.verification.emailVerified ? "" : "Mark email verification to continue.",
        phoneVerified: snapshot.verification.phoneVerified ? "" : "Mark phone verification to continue.",
        paymentVerified: snapshot.verification.paymentVerified ? "" : "Mark payment verification to continue.",
      };
    }

    return {
      termsAccepted: snapshot.finalReview.termsAccepted ? "" : "Accept the terms to publish the client profile.",
    };
  };

  const currentErrors = getErrors(currentStep);

  const persistStep = (step: ClientWizardStep, snapshot: ClientProfileData = draft) => {
    if (step === 1) return void saveClientProfileStep(1, snapshot.basic);
    if (step === 2) return void saveClientProfileStep(2, snapshot.about);
    if (step === 3) return void saveClientProfileStep(3, snapshot.contact);
    if (step === 4) return void saveClientProfileStep(4, snapshot.budget);
    if (step === 5) return void saveClientProfileStep(5, snapshot.hiring);
    if (step === 6) return void saveClientProfileStep(6, snapshot.projects);
    if (step === 7) return void saveClientProfileStep(7, snapshot.reviews);
    if (step === 8) return void saveClientProfileStep(8, snapshot.availability);
    if (step === 9) return void saveClientProfileStep(9, snapshot.verification);
    return void saveClientProfileStep(10, snapshot.finalReview);
  };

  useEffect(() => {
    if (!autoSaveReadyRef.current) {
      autoSaveReadyRef.current = true;
      return;
    }

    if (introActive) return;

    const timeoutId = window.setTimeout(() => {
      persistStep(currentStep, draft);
      void saveClientProfileToServer(draft).catch((error) => {
        console.error("client profile autosave error:", error);
      });
    }, 420);

    return () => window.clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, draft, introActive]);

  if (!user || user.role !== "client") return null;

  const canOpenStep = (target: ClientWizardStep) => {
    if (target <= currentStep) return true;
    for (let step = 1; step < target; step += 1) {
      if (Object.values(getErrors(step as ClientWizardStep)).some(Boolean)) return false;
    }
    return true;
  };

  const navigateToStep = (target: ClientWizardStep) => {
    if (!canOpenStep(target)) {
      for (let step = 1; step < target; step += 1) {
        if (Object.values(getErrors(step as ClientWizardStep)).some(Boolean)) {
          toast({
            title: "Missing Information",
            description: `Please complete Step ${step} to continue.`,
            variant: "destructive",
          });
          setAttemptedSteps((previous) => ({ ...previous, [step]: true }));
          setCurrentStep(step as ClientWizardStep);
          setClientProfileLastStep(step as ClientWizardStep);
          return;
        }
      }
      return;
    }

    persistStep(currentStep);
    void saveClientProfileToServer(draft).catch((error) => {
      console.error("client profile autosave error:", error);
    });

    if (target === 10) {
      const nextDraft = {
        ...draft,
        finalReview: {
          ...draft.finalReview,
          profilePreviewViewed: true,
        },
      };
      setDraft(nextDraft);
      saveClientProfileStep(10, nextDraft.finalReview);
    }

    setCurrentStep(target);
    setClientProfileLastStep(target);
  };

  const handleBackToDashboard = () => {
    persistStep(currentStep);
    void saveClientProfileToServer(draft).catch((error) => {
      console.error("client profile autosave error:", error);
    });
    navigate("/client-dashboard");
  };

  const handleBack = () => {
    if (currentStep === 1) return void handleBackToDashboard();
    navigateToStep((currentStep - 1) as ClientWizardStep);
  };

  const handleNext = () => {
    if (Object.values(currentErrors).some(Boolean)) {
      setAttemptedSteps((previous) => ({ ...previous, [currentStep]: true }));
      return;
    }

    if (currentStep === 10) return;
    navigateToStep((currentStep + 1) as ClientWizardStep);
  };

  const handlePublish = async () => {
    if (publishing) return;

    if (Object.values(currentErrors).some(Boolean)) {
      setAttemptedSteps((previous) => ({ ...previous, [currentStep]: true }));
      return;
    }

    setPublishing(true);
    const publishedProfile = sanitizeClientProfileData({
      ...draft,
      finalReview: {
        ...draft.finalReview,
        profilePreviewViewed: true,
        termsAccepted: true,
        publishedAt: new Date().toISOString(),
      },
    });

    setDraft(publishedProfile);
    replaceClientProfile(publishedProfile, 1);

    try {
      await saveClientProfileToServer(publishedProfile);
      setClientProfileLastStep(1);
      toast({
        title: "Client profile published",
        description: "Your client profile is ready for freelancers to review.",
      });
      navigate("/client-dashboard/profile");
    } catch (error) {
      toast({
        title: "Profile save failed",
        description: error instanceof Error ? error.message : "Unable to save your client profile right now.",
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleHeaderBack = () => {
    if (introActive) {
      if (introStep === 0) {
        handleBackToDashboard();
        return;
      }

      setIntroStep((previous) => Math.max(previous - 1, 0));
      return;
    }

    handleBack();
  };

  const renderIntro = () => {
    if (introStep === 0) {
      return (
        <motion.section
          key="client-intro-1"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="mx-auto flex min-h-[56dvh] w-full max-w-4xl items-center justify-center px-2 text-center"
        >
          <div className="space-y-10">
            <h1 className="font-display text-[2.65rem] font-black leading-[1.05] tracking-[-0.06em] text-foreground sm:text-[4.5rem]">
              <TypingHeadline text={introScreens[0]} onComplete={() => setHeadlineFinished(true)} />
            </h1>

            {introAdvanceReady ? (
              <motion.button
                type="button"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22 }}
                onClick={() => setIntroStep(1)}
                className={primaryButtonClass}
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            ) : null}
          </div>
        </motion.section>
      );
    }

    return (
      <motion.section
        key="client-intro-2"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="mx-auto flex min-h-[56dvh] w-full max-w-3xl items-center justify-center px-2 text-center"
      >
        <div className="space-y-6">
          <h1 className="font-display text-[2.4rem] font-black leading-[1.08] tracking-[-0.05em] text-foreground sm:text-[4rem]">
            {introScreens[1]}
          </h1>
          <p className="mx-auto max-w-2xl text-[1rem] leading-8 text-muted-foreground sm:text-[1.1rem]">
            Take a few minutes to complete your profile so others can understand who you are and what you offer.
          </p>
          <button type="button" onClick={() => setIntroStep(2)} className={primaryButtonClass}>
            Start Profile Setup
          </button>
        </div>
      </motion.section>
    );
  };

  const renderStep1 = () => {
    const hasProfilePhoto = Boolean(draft.basic.profilePhoto);

    return (
      <div className="space-y-7">
        <StepHeading title={currentMeta.title} subtitle={currentMeta.subtitle} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-border bg-muted/30">
            {hasProfilePhoto ? (
              <img
                src={draft.basic.profilePhoto}
                alt={draft.basic.companyName || draft.basic.fullName || user.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="space-y-2.5">
            <p className="text-sm leading-6 text-muted-foreground">
              Upload a company logo or a profile photo freelancers can recognize instantly.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => profilePhotoInputRef.current?.click()} className={secondaryButtonClass}>
                {hasProfilePhoto ? "Change Image" : "Upload Image"}
              </button>
              {hasProfilePhoto ? (
                <button type="button" onClick={removeProfilePhoto} className={secondaryButtonClass}>
                  Remove
                </button>
              ) : null}
            </div>
          </div>

          <input
            ref={profilePhotoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (event) => {
              await uploadProfilePhoto(event.target.files);
              event.target.value = "";
            }}
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="client-full-name" className={mutedLabelClass}>
              Full Name
            </label>
            <input
              id="client-full-name"
              value={draft.basic.fullName}
              onChange={(event) => updateBasic({ fullName: event.target.value })}
              className={inputClass}
              placeholder="Your full name"
            />
          </div>

          <div>
            <label htmlFor="client-company-name" className={mutedLabelClass}>
              Company Name
            </label>
            <input
              id="client-company-name"
              value={draft.basic.companyName}
              onChange={(event) => updateBasic({ companyName: event.target.value })}
              className={inputClass}
              placeholder="Your company or brand"
            />
          </div>
        </div>
        <FieldError message={attemptedSteps[1] ? currentErrors.displayName : ""} />

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="client-professional-title" className={mutedLabelClass}>
              Professional Title
            </label>
            <input
              id="client-professional-title"
              value={draft.basic.professionalTitle}
              onChange={(event) => updateBasic({ professionalTitle: event.target.value })}
              className={inputClass}
              placeholder="Founder, Hiring Manager, Product Lead..."
            />
            <FieldError message={attemptedSteps[1] ? currentErrors.professionalTitle : ""} />
          </div>

          <div>
            <label htmlFor="client-username" className={mutedLabelClass}>
              Username
            </label>
            <input
              id="client-username"
              value={draft.basic.username}
              onChange={(event) =>
                updateBasic({ username: event.target.value.replace(/^@+/, "").replace(/\s+/g, "") })
              }
              className={inputClass}
              placeholder="yourhandle"
            />
            <FieldError message={attemptedSteps[1] ? currentErrors.username : ""} />
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-6">
      <StepHeading title={currentMeta.title} subtitle={currentMeta.subtitle} />

      <div className={panelClass}>
        <label htmlFor="client-bio" className="text-base font-semibold text-foreground">
          Company bio
        </label>
        <textarea
          id="client-bio"
          value={draft.about.bio}
          onChange={(event) => updateAbout({ bio: event.target.value })}
          className={textareaClass}
          placeholder="Describe your company, the kind of work you commission, and how you like to collaborate."
        />
        <FieldError message={attemptedSteps[2] ? currentErrors.bio : ""} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(260px,0.8fr)]">
        <div className={panelClass}>
          <TagInput
            id="client-industries"
            label="Industry"
            values={draft.about.industries}
            onChange={(industries) => updateAbout({ industries })}
            suggestions={CLIENT_INDUSTRY_OPTIONS}
            placeholder="Add industries you operate in"
            helperText="Select the industries freelancers should associate with your business."
            error={attemptedSteps[2] ? currentErrors.industries : undefined}
          />
        </div>

        <div className={panelClass}>
          <p className="text-base font-semibold text-foreground">Business type</p>
          <div className="mt-4 grid gap-3">
            {businessTypeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => updateAbout({ businessType: option.value })}
                className={cn(
                  "rounded-[14px] border px-4 py-3 text-left text-sm font-semibold transition",
                  draft.about.businessType === option.value
                    ? "border-accent/60 bg-accent/12 text-accent"
                    : "border-border bg-card text-muted-foreground hover:border-accent/45"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <StepHeading title={currentMeta.title} subtitle={currentMeta.subtitle} />

      <div className={panelClass}>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label htmlFor="client-country" className="text-base font-semibold text-foreground">
              Country
            </label>
            <select
              id="client-country"
              value={draft.contact.country}
              onChange={(event) => updateContact({ country: event.target.value, city: "" })}
              className={inputClass}
            >
              <option value="">Select country</option>
              {Object.keys(COUNTRY_CITY_OPTIONS).map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <FieldError message={attemptedSteps[3] ? currentErrors.country : ""} />
          </div>

          <div>
            <label htmlFor="client-city" className="text-base font-semibold text-foreground">
              City
            </label>
            <select
              id="client-city"
              value={draft.contact.city}
              onChange={(event) => updateContact({ city: event.target.value })}
              className={inputClass}
              disabled={cityOptions.length === 0}
            >
              <option value="">{cityOptions.length > 0 ? "Select city" : "Choose country first"}</option>
              {cityOptions.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
            <FieldError message={attemptedSteps[3] ? currentErrors.city : ""} />
          </div>

          <div>
            <label htmlFor="client-timezone" className="text-base font-semibold text-foreground">
              Timezone
            </label>
            <select
              id="client-timezone"
              value={draft.contact.timezone}
              onChange={(event) => updateContact({ timezone: event.target.value })}
              className={inputClass}
            >
              {CLIENT_TIMEZONE_OPTIONS.map((timezone) => (
                <option key={timezone} value={timezone}>
                  {timezone}
                </option>
              ))}
            </select>
            <FieldError message={attemptedSteps[3] ? currentErrors.timezone : ""} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className={panelClass}>
          <TagInput
            id="client-languages"
            label="Languages"
            values={draft.contact.languages}
            onChange={(languages) => updateContact({ languages })}
            suggestions={LANGUAGE_OPTIONS}
            placeholder="Add working languages"
            helperText="Freelancers use these languages for meetings, updates, and documentation."
            error={attemptedSteps[3] ? currentErrors.languages : undefined}
          />
        </div>

        <div className={panelClass}>
          <div>
            <label htmlFor="client-linkedin" className="text-base font-semibold text-foreground">
              LinkedIn
            </label>
            <input
              id="client-linkedin"
              value={draft.contact.linkedIn}
              onChange={(event) => updateContact({ linkedIn: event.target.value })}
              className={inputClass}
              placeholder="https://linkedin.com/company/..."
            />
            <FieldError message={attemptedSteps[3] ? currentErrors.linkedIn : ""} />
          </div>

          <div className="mt-5">
            <label htmlFor="client-website" className="text-base font-semibold text-foreground">
              Website
            </label>
            <input
              id="client-website"
              value={draft.contact.website}
              onChange={(event) => updateContact({ website: event.target.value })}
              className={inputClass}
              placeholder="https://yourcompany.com"
            />
            <FieldError message={attemptedSteps[3] ? currentErrors.website : ""} />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <StepHeading title={currentMeta.title} subtitle={currentMeta.subtitle} />

      <div className={panelClass}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="client-budget-range" className="text-base font-semibold text-foreground">
              Budget range
            </label>
            <select
              id="client-budget-range"
              value={draft.budget.budgetRange}
              onChange={(event) => updateBudget({ budgetRange: event.target.value as ClientProfileData["budget"]["budgetRange"] })}
              className={inputClass}
            >
              <option value="">Select budget range</option>
              {budgetRangeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={attemptedSteps[4] ? currentErrors.budgetRange : ""} />
          </div>

          <div>
            <label htmlFor="client-duration-preference" className="text-base font-semibold text-foreground">
              Project duration preference
            </label>
            <select
              id="client-duration-preference"
              value={draft.budget.projectDurationPreference}
              onChange={(event) =>
                updateBudget({
                  projectDurationPreference: event.target.value as ClientProfileData["budget"]["projectDurationPreference"],
                })
              }
              className={inputClass}
            >
              <option value="">Select duration</option>
              {durationOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <FieldError message={attemptedSteps[4] ? currentErrors.duration : ""} />
          </div>
        </div>

        <div className="mt-5">
          <label htmlFor="client-payment-method" className="text-base font-semibold text-foreground">
            Payment method
          </label>
          <input
            id="client-payment-method"
            list="client-payment-methods"
            value={draft.budget.paymentMethod}
            onChange={(event) => updateBudget({ paymentMethod: event.target.value })}
            className={inputClass}
            placeholder="Choose or type a payment method"
          />
          <datalist id="client-payment-methods">
            {paymentMethodOptions.map((method) => (
              <option key={method} value={method} />
            ))}
          </datalist>
          <FieldError message={attemptedSteps[4] ? currentErrors.paymentMethod : ""} />
        </div>
      </div>

      <div className={panelClass}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-base font-semibold text-foreground">Payment verification</p>
            <p className="mt-2 text-[15px] leading-7 text-muted-foreground">
              Mark whether your preferred payment setup is already verified and ready to use.
            </p>
          </div>

          <button
            type="button"
            onClick={() => updateBudget({ paymentVerified: !draft.budget.paymentVerified })}
            className={cn(
              "inline-flex h-11 items-center justify-center rounded-full px-5 text-sm font-semibold transition",
              draft.budget.paymentVerified
                ? "bg-secondary text-white"
                : "border border-border bg-card text-foreground hover:border-accent/45"
            )}
          >
            {draft.budget.paymentVerified ? "Verified" : "Mark as verified"}
          </button>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <StepHeading title={currentMeta.title} subtitle={currentMeta.subtitle} />

      <div className={panelClass}>
        <TagInput
          id="client-hiring-domains"
          label="Domains"
          values={draft.hiring.domains}
          onChange={(domains) => updateHiring({ domains })}
          suggestions={clientDomainSuggestions}
          placeholder="Add the main domains you hire in"
          helperText="Domains help ProConnect rank freelancer matches higher without hiding the rest of the marketplace."
        />
      </div>

      <div className={panelClass}>
        <TagInput
          id="client-hiring-subdomains"
          label="Subdomains"
          values={draft.hiring.subdomains}
          onChange={(subdomains) => updateHiring({ subdomains })}
          suggestions={SKILL_SUGGESTIONS}
          placeholder="Add your common subdomains or focus areas"
          helperText="Use narrower tags such as React, SaaS Design, or API Integrations."
        />
      </div>

      <div className={panelClass}>
        <TagInput
          id="client-hiring-skills"
          label="Skills / tags"
          values={draft.hiring.skills}
          onChange={(skills) => updateHiring({ skills })}
          suggestions={SKILL_SUGGESTIONS}
          placeholder="Add the skills you usually hire for"
          helperText="Reuse the same skill tagging system as the freelancer onboarding so your hiring intent matches marketplace search."
          error={attemptedSteps[5] ? currentErrors.skills : undefined}
        />
      </div>
    </div>
  );
  const renderMediaPreview = (media: ClientFileMeta, projectTitle: string) => {
    if (media.preview) {
      if (media.type.startsWith("video/") && !media.preview.startsWith("data:image/")) {
        return <video src={media.preview} className="h-full w-full object-cover" autoPlay loop muted playsInline preload="metadata" />;
      }

      return <img src={media.preview} alt={projectTitle || media.name} className="h-full w-full object-cover" />;
    }

    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center">
        {media.type.startsWith("video/") ? <Film className="h-6 w-6 text-muted-foreground" /> : <UploadCloud className="h-6 w-6 text-muted-foreground" />}
        <p className="line-clamp-2 text-xs font-medium text-muted-foreground">{media.name}</p>
      </div>
    );
  };

  const renderStep6 = () => {
    const activeProject = draft.projects.projects.find((project) => project.id === activeProjectId) ?? null;

    return (
      <div className="space-y-6">
        <StepHeading title={currentMeta.title} subtitle={currentMeta.subtitle} />
        {attemptedSteps[6] && currentErrors.projects && <FieldError message={currentErrors.projects} />}

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <div className={panelClass}>
            <div className="flex items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <p className={mutedLabelClass}>Projects</p>
                <p className="mt-2 text-sm text-muted-foreground">{draft.projects.projects.length} added</p>
              </div>
              <button
                type="button"
                onClick={addProject}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent/90"
              >
                <Plus className="h-4 w-4" />
                Add
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {draft.projects.projects.length > 0 ? (
                draft.projects.projects.map((project) => (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => setActiveProjectId(project.id)}
                    className={cn(
                      "w-full rounded-[14px] border px-4 py-3 text-left transition",
                      activeProjectId === project.id
                        ? "border-accent/60 bg-accent/12"
                        : "border-border bg-card hover:border-accent/45"
                    )}
                  >
                    <p className="truncate text-sm font-semibold text-foreground">{project.title || "Untitled project"}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {[project.budget, project.duration].filter(Boolean).join(" • ") || "Add budget and duration"}
                    </p>
                  </button>
                ))
              ) : (
                <div className="rounded-[14px] border border-dashed border-border px-4 py-6 text-center text-sm leading-6 text-muted-foreground">
                  Add a project to capture the kind of work you hire for.
                </div>
              )}
            </div>
          </div>

          <div className={panelClass}>
            {activeProject ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className={mutedLabelClass}>Active Project</p>
                    <p className="mt-2 text-lg font-semibold text-foreground">{activeProject.title || "Untitled project"}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeProject(activeProject.id)}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-accent/35 bg-accent/12 px-4 text-sm font-semibold text-accent transition hover:border-accent/45"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`project-title-${activeProject.id}`} className="text-base font-semibold text-foreground">
                      Title
                    </label>
                    <input
                      id={`project-title-${activeProject.id}`}
                      value={activeProject.title}
                      onChange={(event) => updateProject(activeProject.id, { title: event.target.value })}
                      className={inputClass}
                      placeholder="Marketplace redesign, hiring sprint..."
                    />
                    <FieldError message={attemptedSteps[6] ? currentErrors[`${activeProject.id}:title`] : ""} />
                  </div>

                  <div>
                    <label htmlFor={`project-budget-${activeProject.id}`} className="text-base font-semibold text-foreground">
                      Budget
                    </label>
                    <input
                      id={`project-budget-${activeProject.id}`}
                      value={activeProject.budget}
                      onChange={(event) => updateProject(activeProject.id, { budget: event.target.value })}
                      className={inputClass}
                      placeholder="$3,000 fixed, $40/hr, INR 1.5L..."
                    />
                    <FieldError message={attemptedSteps[6] ? currentErrors[`${activeProject.id}:budget`] : ""} />
                  </div>
                </div>

                <div>
                  <label htmlFor={`project-duration-${activeProject.id}`} className="text-base font-semibold text-foreground">
                    Duration
                  </label>
                  <input
                    id={`project-duration-${activeProject.id}`}
                    value={activeProject.duration}
                    onChange={(event) => updateProject(activeProject.id, { duration: event.target.value })}
                    className={inputClass}
                    placeholder="3 weeks, 2 months, ongoing..."
                  />
                  <FieldError message={attemptedSteps[6] ? currentErrors[`${activeProject.id}:duration`] : ""} />
                </div>

                <div>
                  <label htmlFor={`project-outcome-${activeProject.id}`} className="text-base font-semibold text-foreground">
                    Outcome
                  </label>
                  <textarea
                    id={`project-outcome-${activeProject.id}`}
                    value={activeProject.outcome}
                    onChange={(event) => updateProject(activeProject.id, { outcome: event.target.value })}
                    className={textareaClass}
                    placeholder="Describe the result, launch, metric movement, or business outcome from this engagement."
                  />
                  <FieldError message={attemptedSteps[6] ? currentErrors[`${activeProject.id}:outcome`] : ""} />
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-foreground">Upload media</p>
                    <input
                      ref={(node) => {
                        fileRefs.current[activeProject.id] = node;
                      }}
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      onChange={async (event) => {
                        await uploadProjectMedia(activeProject.id, event.target.files);
                        event.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => fileRefs.current[activeProject.id]?.click()}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-[8px] border border-border bg-card px-4 text-sm font-semibold text-foreground transition hover:border-accent/60 hover:text-accent"
                    >
                      <UploadCloud className="h-4 w-4" />
                      Add files
                    </button>
                  </div>

                  <div
                    onDragOver={(event) => {
                      event.preventDefault();
                      setDraggingProjectId(activeProject.id);
                    }}
                    onDragLeave={() => setDraggingProjectId((current) => (current === activeProject.id ? null : current))}
                    onDrop={async (event) => {
                      event.preventDefault();
                      setDraggingProjectId(null);
                      await uploadProjectMedia(activeProject.id, event.dataTransfer.files);
                    }}
                    className={cn(
                      "mt-3 flex min-h-[148px] items-center justify-center rounded-[18px] border border-dashed px-5 text-center transition",
                      draggingProjectId === activeProject.id
                        ? "border-accent/60 bg-accent/12"
                        : "border-border bg-background/80"
                    )}
                  >
                    <div>
                      <UploadCloud className="mx-auto h-8 w-8 text-muted-foreground" />
                      <p className="mt-3 text-sm font-medium text-muted-foreground">Drop screenshots or video previews here</p>
                      <p className="mt-1 text-xs text-muted-foreground">Up to 8 files. Images and videos only.</p>
                    </div>
                  </div>

                  {activeProject.media.length > 0 && (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {activeProject.media.map((media) => (
                        <div key={`${media.name}-${media.lastModified}`} className="overflow-hidden rounded-[16px] border border-border bg-card">
                          <div className="relative aspect-[16/10] bg-muted/45">
                            {renderMediaPreview(media, activeProject.title)}
                            {media.type.startsWith("video/") && (
                              <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/65 px-2 py-1 text-[11px] font-medium text-white">
                                <Film className="h-3 w-3" />
                                Video
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3 px-3 py-3">
                            <p className="line-clamp-2 text-xs font-medium text-muted-foreground">{media.name}</p>
                            <button
                              type="button"
                              onClick={() => removeProjectMedia(activeProject.id, media)}
                              className="rounded-full p-1 text-accent transition hover:bg-accent/12 hover:text-accent"
                              aria-label={`Remove ${media.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[18px] border border-dashed border-border bg-background/80 px-6 text-center">
                <Plus className="h-8 w-8 text-muted-foreground" />
                <p className="mt-4 text-lg font-semibold text-foreground">No project selected</p>
                <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
                  Add a past project or hiring example to document budget, scope, outcome, and supporting media.
                </p>
                <button
                  type="button"
                  onClick={addProject}
                  className="mt-5 inline-flex h-10 items-center justify-center rounded-[8px] bg-accent px-4 text-sm font-semibold text-white transition hover:bg-accent/90"
                >
                  Add project
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderStep7 = () => (
    <div className="space-y-6">
      <StepHeading title={currentMeta.title} subtitle={currentMeta.subtitle} />

      <div className={panelClass}>
        <p className={mutedLabelClass}>Placeholder</p>
        <h3 className="mt-3 text-xl font-semibold text-foreground">Reviews will appear here</h3>
        <p className="mt-3 text-base leading-8 text-muted-foreground">{draft.reviews.placeholderNote}</p>
        <div className="mt-5 rounded-[16px] border border-border bg-accent/12 p-4 text-sm leading-7 text-muted-foreground">
          This step is display-only for now. Once public client endorsements and freelancer reviews are added, this section will surface them automatically.
        </div>
      </div>
    </div>
  );

  const renderStep8 = () => (
    <div className="space-y-6">
      <StepHeading title={currentMeta.title} subtitle={currentMeta.subtitle} />

      <div className={panelClass}>
        <p className="text-base font-semibold text-foreground">Availability status</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {availabilityOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() =>
                updateAvailability({
                  availabilityStatus: option.value as ClientProfileData["availability"]["availabilityStatus"],
                })
              }
              className={cn(
                "rounded-[14px] border px-4 py-3 text-left text-sm font-semibold transition",
                draft.availability.availabilityStatus === option.value
                  ? "border-accent/60 bg-accent/12 text-accent"
                  : "border-border bg-card text-muted-foreground hover:border-accent/45"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
        <FieldError message={attemptedSteps[8] ? currentErrors.availabilityStatus : ""} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className={panelClass}>
          <p className="text-base font-semibold text-foreground">Preferred meeting times</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {meetingTimeOptions.map((option) => {
              const selected = draft.availability.preferredMeetingTimes.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    updateAvailability({
                      preferredMeetingTimes: toggleSelection(draft.availability.preferredMeetingTimes, option),
                    })
                  }
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    selected
                      ? "border-accent/60 bg-accent/12 text-accent"
                      : "border-border bg-card text-muted-foreground hover:border-accent/45"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <FieldError message={attemptedSteps[8] ? currentErrors.preferredMeetingTimes : ""} />
        </div>

        <div className={panelClass}>
          <p className="text-base font-semibold text-foreground">Notification settings</p>
          <div className="mt-4 flex flex-wrap gap-2.5">
            {notificationOptions.map((option) => {
              const selected = draft.availability.notificationSettings.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() =>
                    updateAvailability({
                      notificationSettings: toggleSelection(draft.availability.notificationSettings, option),
                    })
                  }
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm font-semibold transition",
                    selected
                      ? "border-accent/60 bg-accent/12 text-accent"
                      : "border-border bg-card text-muted-foreground hover:border-accent/45"
                  )}
                >
                  {option}
                </button>
              );
            })}
          </div>
          <FieldError message={attemptedSteps[8] ? currentErrors.notificationSettings : ""} />
        </div>
      </div>
    </div>
  );

  const renderStep9 = () => (
    <div className="space-y-6">
      <StepHeading title={currentMeta.title} subtitle={currentMeta.subtitle} />

      <div className={panelClass}>
        <div className="grid gap-5 sm:grid-cols-[130px_minmax(0,1fr)]">
          <div className="sm:col-span-2">
            <label htmlFor="client-verification-email" className="text-base font-semibold text-foreground">
              Verification email
            </label>
            <input
              id="client-verification-email"
              type="email"
              value={draft.verification.email}
              onChange={(event) => updateVerification({ email: event.target.value })}
              className={inputClass}
              placeholder="team@yourcompany.com"
            />
            <FieldError message={attemptedSteps[9] ? currentErrors.email : ""} />
          </div>

          <div>
            <label htmlFor="client-phone-code" className="text-base font-semibold text-foreground">
              Code
            </label>
            <select
              id="client-phone-code"
              value={draft.verification.phoneCountryCode}
              onChange={(event) => updateVerification({ phoneCountryCode: event.target.value })}
              className={inputClass}
            >
              {phoneCodes.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="client-phone-number" className="text-base font-semibold text-foreground">
              Phone number
            </label>
            <input
              id="client-phone-number"
              value={draft.verification.phoneNumber}
              onChange={(event) => updateVerification({ phoneNumber: event.target.value })}
              className={inputClass}
              placeholder="9876543210"
            />
            <FieldError message={attemptedSteps[9] ? currentErrors.phoneNumber : ""} />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <button
          type="button"
          onClick={() => updateVerification({ emailVerified: !draft.verification.emailVerified })}
          className={cn(
            panelClass,
            "text-left transition",
            draft.verification.emailVerified ? "border-secondary/35 bg-secondary/10" : ""
          )}
        >
          <p className={mutedLabelClass}>Email Status</p>
          <p className="mt-3 text-lg font-semibold text-foreground">
            {draft.verification.emailVerified ? "Verified" : "Pending"}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">Confirm that the primary contact email has been verified.</p>
          <FieldError message={attemptedSteps[9] ? currentErrors.emailVerified : ""} />
        </button>

        <button
          type="button"
          onClick={() => updateVerification({ phoneVerified: !draft.verification.phoneVerified })}
          className={cn(
            panelClass,
            "text-left transition",
            draft.verification.phoneVerified ? "border-secondary/35 bg-secondary/10" : ""
          )}
        >
          <p className={mutedLabelClass}>Phone Status</p>
          <p className="mt-3 text-lg font-semibold text-foreground">
            {draft.verification.phoneVerified ? "Verified" : "Pending"}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">Confirm that the support or hiring phone line is verified.</p>
          <FieldError message={attemptedSteps[9] ? currentErrors.phoneVerified : ""} />
        </button>

        <button
          type="button"
          onClick={() => updateVerification({ paymentVerified: !draft.verification.paymentVerified })}
          className={cn(
            panelClass,
            "text-left transition",
            draft.verification.paymentVerified ? "border-secondary/35 bg-secondary/10" : ""
          )}
        >
          <p className={mutedLabelClass}>Payment Status</p>
          <p className="mt-3 text-lg font-semibold text-foreground">
            {draft.verification.paymentVerified ? "Verified" : "Pending"}
          </p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">Confirm that your payment method is approved and ready for use.</p>
          <FieldError message={attemptedSteps[9] ? currentErrors.paymentVerified : ""} />
        </button>
      </div>
    </div>
  );

  const renderStep10 = () => (
    <div className="space-y-6">
      <StepHeading title={currentMeta.title} subtitle={currentMeta.subtitle} />

      <div className={panelClass}>
        <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={mutedLabelClass}>Publish</p>
            <h3 className="mt-2 text-xl font-semibold text-foreground">Your client profile is ready for final review</h3>
            <p className="mt-2 text-base leading-8 text-muted-foreground">
              The preview below uses the exact client profile component that will render under your dashboard profile page.
            </p>
          </div>
          <div className="rounded-full border border-accent/35 bg-accent/12 px-4 py-2 text-sm font-semibold text-accent">
            {completion.completionPercent}% ready
          </div>
        </div>

        <label className="mt-5 flex items-start gap-3 rounded-[16px] border border-border bg-card p-4">
          <input
            type="checkbox"
            checked={draft.finalReview.termsAccepted}
            onChange={(event) =>
              setDraft((previous) => ({
                ...previous,
                finalReview: {
                  ...previous.finalReview,
                  termsAccepted: event.target.checked,
                },
              }))
            }
            className="mt-1 h-4 w-4 rounded border-border text-accent focus:ring-accent/25"
          />
          <span className="text-sm leading-7 text-muted-foreground">
            I confirm that this client profile accurately represents my company, preferred hiring process, and verification status.
          </span>
        </label>
        <FieldError message={attemptedSteps[10] ? currentErrors.termsAccepted : ""} />
      </div>

      <div className={panelClass}>
        <ClientSelfProfileView user={user} profile={draft} onEditProfile={() => navigateToStep(1)} />
      </div>
    </div>
  );

  const backButtonLabel = introActive
    ? introStep === 0
      ? "Back to Dashboard"
      : "Back"
    : currentStep === 1
      ? "Back to Dashboard"
      : "Previous";

  return (
    <OnboardingWorkspace
      backLabel={backButtonLabel}
      onBack={handleHeaderBack}
      footer={
        introActive ? null : (
          <div className="flex w-full max-w-[940px] items-center justify-between gap-4">
            <button type="button" onClick={handleHeaderBack} className={secondaryButtonClass}>
              {currentStep === 1 ? "Back to Dashboard" : "Previous"}
            </button>

            {currentStep < 10 ? (
              <button type="button" onClick={handleNext} className={primaryButtonClass}>
                Next
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <button type="button" onClick={handlePublish} disabled={publishing} className={primaryButtonClass}>
                {publishing ? "Publishing..." : "Publish Profile"}
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        {introActive ? (
          renderIntro()
        ) : (
          <motion.section
            key={`client-step-${currentStep}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mr-auto w-full max-w-[940px] space-y-7 px-0 sm:px-1"
          >
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}
            {currentStep === 5 && renderStep5()}
            {currentStep === 6 && renderStep6()}
            {currentStep === 7 && renderStep7()}
            {currentStep === 8 && renderStep8()}
            {currentStep === 9 && renderStep9()}
            {currentStep === 10 && renderStep10()}
          </motion.section>
        )}
      </AnimatePresence>
    </OnboardingWorkspace>
  );
};

export default ClientProfileCompletionWizard;


