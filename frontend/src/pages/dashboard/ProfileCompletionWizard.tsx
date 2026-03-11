import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Plus, Trash2, UploadCloud } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OnboardingWorkspace from "@/components/profile-completion/OnboardingWorkspace";
import TypingHeadline from "@/components/profile-completion/TypingHeadline";
import {
  FieldError,
  TagInput,
  StepTitle,
  primaryButtonClass,
  profileInputClass,
  profileTextareaClass,
  secondaryButtonClass,
} from "@/components/profile-completion/MinimalProfilePrimitives";
import FreelancerSelfProfileView from "@/components/profile/FreelancerSelfProfileView";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  PROFESSIONAL_DOMAIN_OPTIONS,
  SKILL_SUGGESTIONS,
} from "@/data/profileOptions";
import { COUNTRY_LOCATION_DIRECTORY, COUNTRY_OPTIONS } from "@/data/locationDirectory";
import { useToast } from "@/hooks/use-toast";
import {
  PROFILE_PHOTO_PREVIEW_OPTIONS,
  PROJECT_IMAGE_PREVIEW_OPTIONS,
  PROJECT_VIDEO_PREVIEW_OPTIONS,
  readImagePreviewDataUrl,
  readMediaPreview,
} from "@/lib/mediaPreviews";
import { deriveProfileCompletion, sanitizeProfileData } from "@/lib/profileCompletion";
import { cn } from "@/lib/utils";
import type {
  PortfolioProjectItem,
  ProfileData,
  ProfileLanguage,
  ProfileMediaMeta,
  SocialLinks,
  WizardStep,
} from "@/types/profileCompletion";

const steps: Array<{ step: WizardStep; title: string }> = [
  { step: 1, title: "Personal Information" },
  { step: 2, title: "Professional Title" },
  { step: 3, title: "Skills" },
  { step: 4, title: "Projects / Portfolio" },
  { step: 5, title: "Social Links" },
  { step: 6, title: "Review & Publish" },
];

const introScreens = [
  "Complete your profile so clients can discover and trust you.",
  "You can edit your profile anytime.",
] as const;

const socialFields: Array<{ key: keyof SocialLinks; label: string; placeholder: string }> = [
  { key: "portfolioWebsite", label: "Portfolio Website", placeholder: "https://yourportfolio.com" },
  { key: "linkedIn", label: "LinkedIn", placeholder: "https://linkedin.com/in/username" },
  { key: "github", label: "GitHub", placeholder: "https://github.com/username" },
  { key: "instagram", label: "Instagram", placeholder: "https://instagram.com/username" },
];

const fieldLabelClass = "text-[0.82rem] font-semibold uppercase tracking-[0.24em] text-black/48";
const helperTextClass = "text-sm leading-6 text-black/56";
const projectUploadClass =
  "rounded-[1.75rem] border border-dashed border-black/12 bg-white px-5 py-10 text-center transition hover:border-black/22";

const createProject = (): PortfolioProjectItem => ({
  id: `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: "",
  description: "",
  role: "",
  technologies: [],
  projectUrl: "",
  images: [],
  startDate: "",
  endDate: "",
  clientName: "",
});

const isValidUrl = (value: string) => {
  if (!value.trim()) return true;

  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const buildProfessionalLanguages = (languages: string[]): ProfileLanguage[] =>
  languages.map((name) => ({ name, proficiency: "Fluent" as const }));

const readProjectMediaPreview = async (file: File) => {
  return readMediaPreview(file, {
    image: PROJECT_IMAGE_PREVIEW_OPTIONS,
    video: PROJECT_VIDEO_PREVIEW_OPTIONS,
  });
};

const renderMediaPreview = (media: ProfileMediaMeta, label: string) => {
  if (!media.preview) {
    return <div className="flex h-full items-center justify-center px-4 text-center text-xs text-black/45">{media.name}</div>;
  }

  if (media.type.startsWith("image/")) {
    return <img src={media.preview} alt={label} className="h-full w-full object-cover" />;
  }

  if (media.type.startsWith("video/")) {
    if (media.preview.startsWith("data:image/")) {
      return <img src={media.preview} alt={label} className="h-full w-full object-cover" />;
    }

    return <video src={media.preview} className="h-full w-full object-cover" muted playsInline preload="metadata" />;
  }

  return <div className="flex h-full items-center justify-center px-4 text-center text-xs text-black/45">{media.name}</div>;
};

const getProjectLabel = (project: PortfolioProjectItem, index: number) =>
  project.title.trim() || `Untitled Project ${index + 1}`;

const uniqueTextValues = (values: string[]) => Array.from(new Set(values.filter(Boolean)));

const ProfileCompletionWizard = () => {
  const { user, saveFreelancerProfileToServer, saveProfileStep, replaceProfile, setProfileLastStep } = useAuth();
  const { updateFreelancer } = useApp();
  const { toast } = useToast();
  const navigate = useNavigate();
  const projectFileRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const profilePhotoInputRef = useRef<HTMLInputElement | null>(null);
  const initializedUserIdRef = useRef<string | null>(null);
  const autoSaveReadyRef = useRef(false);

  const [draft, setDraft] = useState<ProfileData>(() => sanitizeProfileData(user?.profile));
  const [currentStep, setCurrentStep] = useState<WizardStep>(Math.min(6, Math.max(1, user?.profile_last_step ?? 1)) as WizardStep);
  const [attemptedSteps, setAttemptedSteps] = useState<Partial<Record<WizardStep, boolean>>>({});
  const [publishing, setPublishing] = useState(false);
  const [draggingProjectId, setDraggingProjectId] = useState<string | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() =>
    sanitizeProfileData(user?.profile).portfolio.projects[0]?.id ?? null
  );
  const [activeDomain, setActiveDomain] = useState<string | null>(() =>
    sanitizeProfileData(user?.profile).professional.domains?.[0] ?? null
  );
  const [introStep, setIntroStep] = useState(0);
  const [headlineFinished, setHeadlineFinished] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "freelancer") return;
    if (initializedUserIdRef.current === user.id) return;

    const sanitizedProfile = sanitizeProfileData(user.profile);

    initializedUserIdRef.current = user.id;
    setDraft(sanitizedProfile);
    setCurrentStep(Math.min(6, Math.max(1, user.profile_last_step ?? 1)) as WizardStep);
    setAttemptedSteps({});
    setPublishing(false);
    setDraggingProjectId(null);
    setActiveProjectId(sanitizedProfile.portfolio.projects[0]?.id ?? null);
    setActiveDomain(sanitizedProfile.professional.domains?.[0] ?? null);
    setIntroStep(0);
    setHeadlineFinished(false);
    autoSaveReadyRef.current = false;
  }, [user]);

  useEffect(() => {
    const projectIds = draft.portfolio.projects.map((project) => project.id);

    if (projectIds.length === 0) {
      if (activeProjectId !== null) setActiveProjectId(null);
      return;
    }

    if (!activeProjectId || !projectIds.includes(activeProjectId)) {
      setActiveProjectId(projectIds[projectIds.length - 1]);
    }
  }, [activeProjectId, draft.portfolio.projects]);

  useEffect(() => {
    const selectedDomains = draft.professional.domains ?? [];

    if (selectedDomains.length === 0) {
      if (activeDomain !== null) setActiveDomain(null);
      return;
    }

    if (!activeDomain || !selectedDomains.includes(activeDomain)) {
      setActiveDomain(selectedDomains[0]);
    }
  }, [activeDomain, draft.professional.domains]);

  useEffect(() => {
    const country = draft.personal.country;
    const expectedPhoneCode = COUNTRY_LOCATION_DIRECTORY[country]?.phoneCode;

    if (!country || !expectedPhoneCode || draft.personal.phoneCountryCode === expectedPhoneCode) return;

    setDraft((previous) => ({
      ...previous,
      personal: {
        ...previous.personal,
        phoneCountryCode: expectedPhoneCode,
        phone: [expectedPhoneCode, previous.personal.phoneNumber].filter(Boolean).join(" ").trim(),
      },
    }));
  }, [draft.personal.country, draft.personal.phoneCountryCode, draft.personal.phoneNumber]);

  useEffect(() => {
    if (!autoSaveReadyRef.current) {
      autoSaveReadyRef.current = true;
      return;
    }

    if (introStep < introScreens.length) return;

    const timeoutId = window.setTimeout(() => {
      persistStep(currentStep, draft);
      void saveFreelancerProfileToServer(draft).catch((error) => {
        console.error("freelancer profile autosave error:", error);
      });
    }, 420);

    return () => window.clearTimeout(timeoutId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, draft, introStep]);

  useEffect(() => {
    if (introStep !== 0) setHeadlineFinished(false);
  }, [introStep]);

  useEffect(() => {
    if (currentStep !== 6 || draft.finalReview.profilePreviewViewed) return;

    setDraft((previous) => ({
      ...previous,
      finalReview: {
        ...previous.finalReview,
        profilePreviewViewed: true,
      },
    }));
  }, [currentStep, draft.finalReview.profilePreviewViewed]);

  if (!user || user.role !== "freelancer") return null;

  const currentMeta = steps.find((item) => item.step === currentStep) ?? steps[0];
  const selectedCountryLocation = COUNTRY_LOCATION_DIRECTORY[draft.personal.country];
  const cityOptions = selectedCountryLocation?.cities ?? [];
  const personalLanguageOptions = selectedCountryLocation?.languages ?? [];
  const displayedPhoneCode = selectedCountryLocation?.phoneCode || draft.personal.phoneCountryCode || "";
  const introActive = introStep < introScreens.length;
  const introAdvanceReady = headlineFinished || import.meta.env.MODE === "test";
  const selectedDomains = draft.professional.domains ?? [];
  const selectedSpecializations = uniqueTextValues(
    (draft.professional.specializations ?? []).concat(draft.expertise.specializations ?? [])
  );
  const activeDomainOptions = activeDomain ? PROFESSIONAL_DOMAIN_OPTIONS[activeDomain] ?? [] : [];

  const updatePersonal = (patch: Partial<ProfileData["personal"]>) => {
    setDraft((previous) => {
      const nextPersonal = {
        ...previous.personal,
        ...patch,
      };

      return {
        ...previous,
        personal: {
          ...nextPersonal,
          name: nextPersonal.fullName,
          phone: [nextPersonal.phoneCountryCode, nextPersonal.phoneNumber].filter(Boolean).join(" ").trim(),
        },
      };
    });
  };

  const handleCountryChange = (country: string) => {
    const nextCountryLocation = COUNTRY_LOCATION_DIRECTORY[country];
    const nextLanguages = nextCountryLocation?.languages ?? [];

    updatePersonal({
      country,
      phoneCountryCode: nextCountryLocation?.phoneCode || "",
      city: nextCountryLocation?.cities.includes(draft.personal.city) ? draft.personal.city : "",
      languages: draft.personal.languages.filter((language) => nextLanguages.includes(language)),
    });
  };

  const addPersonalLanguage = (language: string) => {
    const normalized = language.trim();
    if (!normalized || draft.personal.languages.includes(normalized)) return;
    updatePersonal({
      languages: [...draft.personal.languages, normalized].slice(0, 6),
    });
  };

  const updateProfessional = (patch: Partial<ProfileData["professional"]>) => {
    setDraft((previous) => ({
      ...previous,
      professional: {
        ...previous.professional,
        ...patch,
      },
    }));
  };

  const updateProfessionalFocus = (domains: string[], specializations: string[]) => {
    const nextDomains = uniqueTextValues(domains);
    const nextSpecializations = uniqueTextValues(specializations);

    setDraft((previous) => ({
      ...previous,
      professional: {
        ...previous.professional,
        domains: nextDomains,
        specializations: nextSpecializations,
      },
      expertise: {
        ...previous.expertise,
        specializations: nextSpecializations,
      },
    }));
  };

  const updateSocialLinks = (patch: Partial<SocialLinks>) => {
    setDraft((previous) => ({
      ...previous,
      socialLinks: {
        ...previous.socialLinks,
        ...patch,
      },
    }));
  };

  const updateSkills = (skills: string[]) => {
    setDraft((previous) => {
      const existing = new Map(previous.expertise.primarySkills.map((skill) => [skill.name.toLowerCase(), skill]));

      return {
        ...previous,
        expertise: {
          ...previous.expertise,
          primarySkills: skills.map((skill) => existing.get(skill.toLowerCase()) ?? { name: skill, level: "Advanced", years: "" }),
          tools: skills,
        },
      };
    });
  };

  const handleDomainPress = (domain: string) => {
    const isSelected = selectedDomains.includes(domain);

    if (!isSelected) {
      updateProfessionalFocus([...selectedDomains, domain], selectedSpecializations);
      setActiveDomain(domain);
      return;
    }

    if (activeDomain !== domain) {
      setActiveDomain(domain);
      return;
    }

    const nextDomains = selectedDomains.filter((item) => item !== domain);
    const nextSpecializations = selectedSpecializations.filter(
      (item) => !(PROFESSIONAL_DOMAIN_OPTIONS[domain] ?? []).includes(item)
    );

    updateProfessionalFocus(nextDomains, nextSpecializations);
    setActiveDomain(nextDomains[0] ?? null);
  };

  const toggleSpecialization = (domain: string, specialization: string) => {
    const isSelected = selectedSpecializations.includes(specialization);
    const nextDomains = selectedDomains.includes(domain) ? selectedDomains : [...selectedDomains, domain];
    const nextSpecializations = isSelected
      ? selectedSpecializations.filter((item) => item !== specialization)
      : [...selectedSpecializations, specialization];

    updateProfessionalFocus(nextDomains, nextSpecializations);
    setActiveDomain(domain);
  };

  const addProject = () => {
    const nextProject = createProject();

    setDraft((previous) => ({
      ...previous,
      portfolio: {
        ...previous.portfolio,
        projects: [...previous.portfolio.projects, nextProject],
      },
    }));
    setActiveProjectId(nextProject.id);
  };

  const updateProject = (projectId: string, patch: Partial<PortfolioProjectItem>) => {
    setDraft((previous) => ({
      ...previous,
      portfolio: {
        ...previous.portfolio,
        projects: previous.portfolio.projects.map((project) =>
          project.id === projectId ? { ...project, ...patch } : project
        ),
      },
    }));
  };

  const removeProject = (projectId: string) => {
    const remainingProjects = draft.portfolio.projects.filter((project) => project.id !== projectId);

    setDraft((previous) => ({
      ...previous,
      portfolio: {
        ...previous.portfolio,
        projects: previous.portfolio.projects.filter((project) => project.id !== projectId),
      },
    }));
    setActiveProjectId((current) => (current === projectId ? remainingProjects[remainingProjects.length - 1]?.id ?? null : current));
  };

  const buildMedia = async (file: File): Promise<ProfileMediaMeta> => ({
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
      portfolio: {
        ...previous.portfolio,
        projects: previous.portfolio.projects.map((project) =>
          project.id === projectId ? { ...project, images: [...project.images, ...files].slice(0, 8) } : project
        ),
      },
    }));
  };

  const removeProjectMedia = (projectId: string, media: ProfileMediaMeta) => {
    setDraft((previous) => ({
      ...previous,
      portfolio: {
        ...previous.portfolio,
        projects: previous.portfolio.projects.map((project) =>
          project.id === projectId
            ? {
                ...project,
                images: project.images.filter(
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
      toast({
        title: "Photo not added",
        description: "Use a JPG, PNG, WEBP, or GIF image file.",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Photo not added",
        description: "Use an image that is 2MB or smaller.",
      });
      return;
    }

    try {
      const profilePhoto = await readImagePreviewDataUrl(file, PROFILE_PHOTO_PREVIEW_OPTIONS);
      if (!profilePhoto) throw new Error("Empty profile photo");
      updatePersonal({ profilePhoto });
    } catch {
      toast({
        title: "Photo not added",
        description: "There was a problem reading that image. Try another file.",
      });
    }
  };

  const removeProfilePhoto = () => {
    updatePersonal({ profilePhoto: "" });
  };

  const getErrors = (step: WizardStep, snapshot: ProfileData = draft) => {
    if (step === 1) {
      const age = Number(snapshot.personal.ageRange);
      const phoneDigits = snapshot.personal.phoneNumber.replace(/\D/g, "");

      return {
        fullName: snapshot.personal.fullName.trim() ? "" : "Full name is required.",
        phoneNumber: phoneDigits.length >= 7 ? "" : "Enter a valid phone number.",
        country: snapshot.personal.country.trim() ? "" : "Select your country.",
        city: snapshot.personal.city.trim() ? "" : "Select your city.",
        ageRange:
          Number.isFinite(age) && age >= 13 && age <= 100
            ? ""
            : "Enter a valid age between 13 and 100.",
        languages: snapshot.personal.languages.length > 0 ? "" : "Add at least one language.",
      };
    }

    if (step === 2) {
      return {
        title:
          snapshot.professional.title.trim().length >= 3
            ? ""
            : "Professional title must be at least 3 characters.",
        overview:
          snapshot.professional.overview.trim().length >= 40
            ? ""
            : "Write at least 40 characters about your experience.",
      };
    }

    if (step === 3) {
      return {
        skills: snapshot.expertise.primarySkills.length >= 3 ? "" : "Add at least 3 skills for a strong profile.",
      };
    }

    if (step === 4) {
      const errors: Record<string, string> = {};

      if (snapshot.portfolio.projects.length === 0) {
        errors.projects = "Add at least one project to showcase your work.";
      }

      snapshot.portfolio.projects.forEach((project) => {
        errors[`${project.id}:title`] = project.title.trim() ? "" : "Project title is required.";
        errors[`${project.id}:description`] = project.description.trim() ? "" : "Project description is required.";
        errors[`${project.id}:skills`] =
          project.technologies.length > 0 ? "" : "Add at least one skill used in this project.";
      });

      return errors;
    }

    if (step === 5) {
      const errors: Record<string, string> = {};
      const enteredLinks = socialFields.map((field) => snapshot.socialLinks[field.key].trim()).filter(Boolean);

      if (enteredLinks.length === 0) {
        errors.socialLinks = "Add at least one professional link.";
      }

      socialFields.forEach((field) => {
        errors[field.key] = isValidUrl(snapshot.socialLinks[field.key]) ? "" : "Enter a valid URL.";
      });

      return errors;
    }

    return {
      termsAccepted: snapshot.finalReview.termsAccepted ? "" : "Confirm that this profile is ready to publish.",
    };
  };

  const currentErrors = getErrors(currentStep);
  const completion = deriveProfileCompletion(draft);

  function persistStep(step: WizardStep, snapshot: ProfileData = draft) {
    if (step === 1) {
      saveProfileStep(1, snapshot.personal);
      saveProfileStep(2, {
        ...snapshot.professional,
        languages: buildProfessionalLanguages(snapshot.personal.languages),
      });
      return;
    }

    if (step === 2) {
      saveProfileStep(2, {
        ...snapshot.professional,
        languages: buildProfessionalLanguages(snapshot.personal.languages),
      });
      return;
    }

    if (step === 3) {
      saveProfileStep(2, {
        ...snapshot.professional,
        languages: buildProfessionalLanguages(snapshot.personal.languages),
      });
      saveProfileStep(3, snapshot.expertise);
      return;
    }

    if (step === 4) {
      saveProfileStep(4, snapshot.portfolio);
      return;
    }

    if (step === 5) {
      saveProfileStep(5, snapshot.socialLinks);
      return;
    }

    saveProfileStep(6, snapshot.finalReview);
  }

  const navigateToStep = (target: WizardStep) => {
    persistStep(currentStep, draft);
    void saveFreelancerProfileToServer(draft).catch((error) => {
      console.error("freelancer profile autosave error:", error);
    });

    if (target === 6 && !draft.finalReview.profilePreviewViewed) {
      const nextDraft = {
        ...draft,
        finalReview: {
          ...draft.finalReview,
          profilePreviewViewed: true,
        },
      };
      setDraft(nextDraft);
      saveProfileStep(6, nextDraft.finalReview);
    }

    setCurrentStep(target);
    setProfileLastStep(target);
  };

  const handleBackToDashboard = () => {
    persistStep(currentStep, draft);
    void saveFreelancerProfileToServer(draft).catch((error) => {
      console.error("freelancer profile autosave error:", error);
    });
    navigate("/dashboard");
  };

  const handleBack = () => {
    if (introActive) {
      if (introStep === 0) {
        handleBackToDashboard();
        return;
      }

      setIntroStep((previous) => Math.max(previous - 1, 0));
      return;
    }

    if (currentStep === 1) {
      handleBackToDashboard();
      return;
    }

    navigateToStep((currentStep - 1) as WizardStep);
  };

  const handleNext = () => {
    if (Object.values(currentErrors).some(Boolean)) {
      setAttemptedSteps((previous) => ({ ...previous, [currentStep]: true }));
      return;
    }

    if (currentStep === 6) return;
    navigateToStep((currentStep + 1) as WizardStep);
  };

  const handlePublish = async () => {
    if (publishing) return;

    if (Object.values(currentErrors).some(Boolean)) {
      setAttemptedSteps((previous) => ({ ...previous, [currentStep]: true }));
      return;
    }

    const publishedProfile = sanitizeProfileData({
      ...draft,
      finalReview: {
        ...draft.finalReview,
        profilePreviewViewed: true,
        contractorAcknowledged: true,
        publishedAt: new Date().toISOString(),
      },
    });

    setPublishing(true);
    setDraft(publishedProfile);
    replaceProfile(publishedProfile, 1);

    updateFreelancer(user.id, {
      name: publishedProfile.personal.fullName || user.name,
      title: publishedProfile.professional.title || "Freelancer",
      professionalTitle: publishedProfile.professional.title || "Freelancer",
      avatar: publishedProfile.personal.profilePhoto || user.avatar,
      bio: publishedProfile.professional.overview || publishedProfile.personal.tagline,
      skills: publishedProfile.expertise.primarySkills.map((skill) => skill.name).slice(0, 8),
      country: publishedProfile.personal.country || "India",
      city: publishedProfile.personal.city,
    });

    try {
      await saveFreelancerProfileToServer(publishedProfile);
      setProfileLastStep(1);
      toast({
        title: "Profile published",
        description: "Your freelancer profile is ready for clients.",
      });
      navigate("/profile");
    } catch (error) {
      toast({
        title: "Profile save failed",
        description: error instanceof Error ? error.message : "Unable to save your freelancer profile right now.",
      });
    } finally {
      setPublishing(false);
    }
  };

  const renderIntro = () => {
    if (introStep === 0) {
      return (
        <motion.section
          key="freelancer-intro-1"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -24 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
          className="mx-auto flex min-h-[56dvh] w-full max-w-4xl items-center justify-center px-2 text-center"
        >
          <div className="space-y-10">
            <h1 className="font-display text-[2.65rem] font-black leading-[1.05] tracking-[-0.06em] text-[#111111] sm:text-[4.5rem]">
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
        key="freelancer-intro-2"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -24 }}
        transition={{ duration: 0.28, ease: "easeOut" }}
        className="mx-auto flex min-h-[56dvh] w-full max-w-3xl items-center justify-center px-2 text-center"
      >
        <div className="space-y-6">
          <h1 className="font-display text-[2.4rem] font-black leading-[1.08] tracking-[-0.05em] text-[#111111] sm:text-[4rem]">
            {introScreens[1]}
          </h1>
          <p className="mx-auto max-w-2xl text-[1rem] leading-8 text-black/58 sm:text-[1.1rem]">
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
    const hasProfilePhoto = Boolean(draft.personal.profilePhoto);

    return (
      <div className="space-y-7">
        <StepTitle title={currentMeta.title} />

        <div className="grid gap-8 lg:grid-cols-[152px_minmax(0,1fr)] lg:items-start">
          <div className="flex flex-col items-start gap-4">
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-black/8 bg-[#d8d5d3]">
              {hasProfilePhoto ? (
                <img src={draft.personal.profilePhoto} alt={draft.personal.fullName || user.name} className="h-full w-full object-cover" />
              ) : (
                <UploadCloud className="h-8 w-8 text-black/30" />
              )}
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

          <div className="space-y-7">
            <div className="space-y-3">
              <p className="max-w-2xl text-[1rem] leading-7 text-black/62">
                Add a clear profile photo so clients can recognize and trust you faster.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => profilePhotoInputRef.current?.click()} className={secondaryButtonClass}>
                  <UploadCloud className="h-4 w-4" />
                  {hasProfilePhoto ? "Change Photo" : "Upload Photo"}
                </button>
                {hasProfilePhoto ? (
                  <button type="button" onClick={removeProfilePhoto} className={secondaryButtonClass}>
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
              <div>
                <label htmlFor="full-name" className={fieldLabelClass}>
                  Full Name
                </label>
                <input
                  id="full-name"
                  value={draft.personal.fullName}
                  onChange={(event) => updatePersonal({ fullName: event.target.value })}
                  placeholder="Enter your full name"
                  className={profileInputClass}
                />
                <FieldError message={attemptedSteps[1] ? currentErrors.fullName : ""} />
              </div>

              <div>
                <label htmlFor="age" className={fieldLabelClass}>
                  Age
                </label>
                <input
                  id="age"
                  type="number"
                  min={13}
                  max={100}
                  value={draft.personal.ageRange}
                  onChange={(event) => updatePersonal({ ageRange: event.target.value })}
                  placeholder="Enter your age"
                  className={profileInputClass}
                />
                <FieldError message={attemptedSteps[1] ? currentErrors.ageRange : ""} />
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="country" className={fieldLabelClass}>
                  Country
                </label>
                <select
                  id="country"
                  value={draft.personal.country}
                  onChange={(event) => handleCountryChange(event.target.value)}
                  className={cn(profileInputClass, "appearance-none")}
                >
                  <option value="">Select country</option>
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <FieldError message={attemptedSteps[1] ? currentErrors.country : ""} />
              </div>

              <div className="grid gap-4 sm:grid-cols-[108px_minmax(0,1fr)]">
                <div>
                  <label htmlFor="phone-code" className={fieldLabelClass}>
                    Code
                  </label>
                  <input
                    id="phone-code"
                    aria-label="Phone country code"
                    value={displayedPhoneCode}
                    readOnly
                    placeholder="Code"
                    className={cn(profileInputClass, "bg-white/70 text-black/60")}
                  />
                </div>

                <div>
                  <label htmlFor="phone-number" className={fieldLabelClass}>
                    Phone Number
                  </label>
                  <input
                    id="phone-number"
                    value={draft.personal.phoneNumber}
                    onChange={(event) => updatePersonal({ phoneNumber: event.target.value })}
                    placeholder="Enter your phone number"
                    className={profileInputClass}
                  />
                  <FieldError message={attemptedSteps[1] ? currentErrors.phoneNumber : ""} />
                </div>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="city" className={fieldLabelClass}>
                  City
                </label>
                <select
                  id="city"
                  value={draft.personal.city}
                  onChange={(event) => updatePersonal({ city: event.target.value })}
                  disabled={!draft.personal.country}
                  className={cn(profileInputClass, "appearance-none")}
                >
                  <option value="">{draft.personal.country ? "Select city" : "Select country first"}</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <FieldError message={attemptedSteps[1] ? currentErrors.city : ""} />
              </div>

              <div className="space-y-2.5">
                <div>
                  <label htmlFor="language-select" className={fieldLabelClass}>
                    Language
                  </label>
                  <select
                    id="language-select"
                    aria-label="Languages Spoken"
                    value=""
                    onChange={(event) => addPersonalLanguage(event.target.value)}
                    disabled={!draft.personal.country}
                    className={cn(profileInputClass, "appearance-none")}
                  >
                    <option value="">{draft.personal.country ? "Select language" : "Select country first"}</option>
                    {personalLanguageOptions
                      .filter((language) => !draft.personal.languages.includes(language))
                      .map((language) => (
                        <option key={language} value={language}>
                          {language}
                        </option>
                      ))}
                  </select>
                </div>

                {draft.personal.languages.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {draft.personal.languages.map((language) => (
                      <span
                        key={language}
                        className="inline-flex items-center gap-2 rounded-full border border-[#f28c28]/20 bg-[#f28c28]/10 px-3 py-1.5 text-sm font-medium text-[#b85f09]"
                      >
                        {language}
                        <button
                          type="button"
                          onClick={() => updatePersonal({ languages: draft.personal.languages.filter((item) => item !== language) })}
                          className="rounded-full text-[#b85f09] transition hover:text-[#111111]"
                          aria-label={`Remove ${language}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                  </div>
                ) : null}

                <p className="text-sm leading-6 text-black/52">Select up to 6 languages you can use comfortably with clients.</p>
                <FieldError message={attemptedSteps[1] ? currentErrors.languages : ""} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-7">
      <StepTitle title={currentMeta.title} />

      <div>
        <label htmlFor="professional-title" className={fieldLabelClass}>
          Professional Title
        </label>
        <input
          id="professional-title"
          value={draft.professional.title}
          onChange={(event) => updateProfessional({ title: event.target.value })}
          placeholder="Frontend Developer, Video Editor, Product Designer"
          className={profileInputClass}
        />
        <FieldError message={attemptedSteps[2] ? currentErrors.title : ""} />
      </div>

      <div>
        <label htmlFor="professional-bio" className={fieldLabelClass}>
          Short Bio / Description
        </label>
        <textarea
          id="professional-bio"
          value={draft.professional.overview}
          onChange={(event) => updateProfessional({ overview: event.target.value })}
          placeholder="Describe your experience, strengths, and the kind of outcomes you create for clients."
          className={profileTextareaClass}
        />
        <FieldError message={attemptedSteps[2] ? currentErrors.overview : ""} />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-7">
      <StepTitle title={currentMeta.title} />

      <div className="space-y-2">
        <p className="max-w-3xl text-[15px] leading-7 text-black/62">
          Choose the domains you have mastered. Clicking a domain reveals only that domain&apos;s subdomains so the
          step stays focused and easy to scan.
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className={fieldLabelClass}>Domains Mastered</label>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-black/40">
            {selectedDomains.length} selected
          </p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {Object.entries(PROFESSIONAL_DOMAIN_OPTIONS).map(([domain, options]) => {
            const isSelected = selectedDomains.includes(domain);
            const isActive = activeDomain === domain;
            const selectedCount = options.filter((option) => selectedSpecializations.includes(option)).length;

            return (
              <button
                key={domain}
                type="button"
                onClick={() => handleDomainPress(domain)}
                className={cn(
                  "flex min-h-[56px] items-center gap-3 rounded-[18px] border px-4 py-3 text-left transition",
                  isSelected
                    ? isActive
                      ? "border-[#f28c28]/50 bg-[#fff5ea] text-[#111111]"
                      : "border-black/10 bg-white text-black/84"
                    : "border-black/8 bg-transparent text-black/64 hover:border-black/18 hover:text-[#111111]"
                )}
              >
                <span
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                    isSelected
                      ? "border-[#f28c28]/60 bg-[#f28c28] text-[#180c02]"
                      : "border-black/14 bg-transparent text-transparent"
                  )}
                >
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{domain}</span>
                  <span className="mt-0.5 block text-xs text-black/42">
                    {selectedCount > 0 ? `${selectedCount} subdomains selected` : `${options.length} subdomains`}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className={fieldLabelClass}>Subdomains</label>
          {activeDomain && selectedDomains.includes(activeDomain) ? (
            <p className="text-sm font-medium text-[#ffb15a]">{activeDomain}</p>
          ) : null}
        </div>

        {activeDomain && selectedDomains.includes(activeDomain) ? (
          <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
            {activeDomainOptions.map((specialization) => {
              const isChecked = selectedSpecializations.includes(specialization);

              return (
                <label
                  key={specialization}
                  className={cn(
                    "flex min-h-[50px] cursor-pointer items-center gap-3 rounded-[16px] border px-4 py-3 text-sm transition",
                    isChecked
                      ? "border-[#f28c28]/40 bg-[#fff5ea] text-[#111111]"
                      : "border-black/8 text-black/68 hover:border-black/18 hover:text-[#111111]"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleSpecialization(activeDomain, specialization)}
                    className="h-4 w-4 rounded border-white/18 bg-transparent accent-[#f28c28]"
                  />
                  <span>{specialization}</span>
                </label>
              );
            })}
          </div>
        ) : (
          <p className={helperTextClass}>
            Select a domain above to reveal its subdomains. Click another selected domain any time to switch the list.
          </p>
        )}
      </div>

      <TagInput
        id="skills"
        label="Skills"
        values={draft.expertise.primarySkills.map((skill) => skill.name)}
        onChange={updateSkills}
        suggestions={SKILL_SUGGESTIONS}
        placeholder="React, Motion Design, SEO..."
        helperText="Add at least three core skills so clients can find and shortlist you more easily."
        error={attemptedSteps[3] ? currentErrors.skills : undefined}
      />
    </div>
  );

  const renderStep4 = () => {
    const fallbackProject = draft.portfolio.projects[0] ?? null;
    const activeProject = draft.portfolio.projects.find((project) => project.id === activeProjectId) ?? fallbackProject;
    const activeProjectIndex = activeProject
      ? draft.portfolio.projects.findIndex((project) => project.id === activeProject.id)
      : -1;

    return (
      <div className="space-y-7">
        <StepTitle title={currentMeta.title} />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p className={helperTextClass}>Upload project images or videos and describe the work clearly.</p>
          <button type="button" onClick={addProject} className={primaryButtonClass}>
            <Plus className="h-4 w-4" />
            Add Project
          </button>
        </div>

        {attemptedSteps[4] && currentErrors.projects ? <FieldError message={currentErrors.projects} /> : null}

        {draft.portfolio.projects.length === 0 ? (
          <div className="space-y-3 py-6">
            <p className="text-xl font-semibold text-[#111111]">No projects added yet</p>
            <p className="max-w-xl text-sm leading-7 text-black/50">
              Add portfolio projects with descriptions, skills, and media so clients can quickly understand the quality of your work.
            </p>
          </div>
        ) : (
          <div className="space-y-7">
            <div className="flex flex-wrap gap-2.5">
              {draft.portfolio.projects.map((project, index) => {
                const isActive = project.id === activeProject?.id;

                return (
                  <button
                    key={project.id}
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setActiveProjectId(project.id)}
                    className={cn(
                      "inline-flex h-11 items-center justify-center rounded-full border px-4 text-sm font-semibold transition",
                      isActive
                        ? "border-[#f28c28]/45 bg-[#f28c28]/10 text-[#ffb15a]"
                        : "border-black/10 bg-white text-black/72 hover:border-black/18 hover:text-[#111111]"
                    )}
                  >
                    {getProjectLabel(project, index)}
                  </button>
                );
              })}
            </div>

            {activeProject ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-[#111111]">
                      {getProjectLabel(activeProject, activeProjectIndex >= 0 ? activeProjectIndex : 0)}
                    </h2>
                    <p className={helperTextClass}>Describe the brief, your role, and the outcome.</p>
                  </div>

                  <button type="button" onClick={() => removeProject(activeProject.id)} className={secondaryButtonClass}>
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>

                <div>
                  <label htmlFor={`project-title-${activeProject.id}`} className={fieldLabelClass}>
                    Project Title
                  </label>
                  <input
                    id={`project-title-${activeProject.id}`}
                    value={activeProject.title}
                    onChange={(event) => updateProject(activeProject.id, { title: event.target.value })}
                    placeholder="Name the project clearly"
                    className={profileInputClass}
                  />
                  <FieldError message={attemptedSteps[4] ? currentErrors[`${activeProject.id}:title`] : ""} />
                </div>

                <div>
                  <label htmlFor={`project-description-${activeProject.id}`} className={fieldLabelClass}>
                    Project Description
                  </label>
                  <textarea
                    id={`project-description-${activeProject.id}`}
                    value={activeProject.description}
                    onChange={(event) => updateProject(activeProject.id, { description: event.target.value })}
                    placeholder="Describe the brief, your contribution, and the result."
                    className={profileTextareaClass}
                  />
                  <FieldError message={attemptedSteps[4] ? currentErrors[`${activeProject.id}:description`] : ""} />
                </div>

                <TagInput
                  id={`project-skills-${activeProject.id}`}
                  label="Skills Used"
                  values={activeProject.technologies}
                  onChange={(technologies) => updateProject(activeProject.id, { technologies })}
                  suggestions={SKILL_SUGGESTIONS}
                  placeholder="React, Video Editing, SEO..."
                  error={attemptedSteps[4] ? currentErrors[`${activeProject.id}:skills`] : undefined}
                />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <label className={fieldLabelClass}>Project Media</label>
                    <input
                      ref={(element) => {
                        projectFileRefs.current[activeProject.id] = element;
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
                      onClick={() => projectFileRefs.current[activeProject.id]?.click()}
                      className={secondaryButtonClass}
                    >
                      <UploadCloud className="h-4 w-4" />
                      Add Files
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
                      projectUploadClass,
                      draggingProjectId === activeProject.id && "border-[#f28c28]/45 bg-[#f28c28]/10"
                    )}
                  >
                    <UploadCloud className="mx-auto h-8 w-8 text-black/36" />
                    <p className="mt-4 text-sm font-semibold text-[#111111]">Drag and drop project images or videos here</p>
                    <p className="mt-2 text-sm leading-7 text-black/52">Up to 8 files. Images and videos only.</p>
                  </div>

                  {activeProject.images.length > 0 ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {activeProject.images.map((media) => (
                        <div
                          key={`${media.name}-${media.lastModified}`}
                          className="overflow-hidden rounded-[1.4rem] border border-black/10 bg-white"
                        >
                          <div className="aspect-[16/10] bg-white">{renderMediaPreview(media, media.name)}</div>
                          <div className="flex items-center justify-between gap-3 px-3 py-3">
                            <p className="line-clamp-2 text-xs font-medium text-black/58">{media.name}</p>
                            <button
                              type="button"
                              onClick={() => removeProjectMedia(activeProject.id, media)}
                              className="rounded-full p-1 text-black/54 transition hover:bg-black/5 hover:text-[#111111]"
                              aria-label={`Remove ${media.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  const renderStep5 = () => (
    <div className="space-y-6">
      <StepTitle title={currentMeta.title} />

      {socialFields.map((field) => (
        <div key={field.key}>
          <label htmlFor={field.key} className={fieldLabelClass}>
            {field.label}
          </label>
          <input
            id={field.key}
            value={draft.socialLinks[field.key]}
            onChange={(event) => updateSocialLinks({ [field.key]: event.target.value } as Partial<SocialLinks>)}
            placeholder={field.placeholder}
            className={profileInputClass}
          />
          <FieldError message={attemptedSteps[5] ? currentErrors[field.key] : ""} />
        </div>
      ))}

      <FieldError message={attemptedSteps[5] ? currentErrors.socialLinks : ""} />
    </div>
  );

  const renderStep6 = () => (
    <div className="space-y-6">
      <StepTitle title={currentMeta.title} />

      <div className="space-y-4">
        <div className="flex flex-col gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className={fieldLabelClass}>Publish</p>
            <h3 className="mt-2 text-xl font-semibold text-[#111111]">Your freelancer profile is ready for final review</h3>
            <p className="mt-2 max-w-2xl text-base leading-8 text-black/58">
              The preview below uses the exact freelancer profile component that will render under your dashboard profile page.
            </p>
          </div>
          <div className="rounded-full border border-[#f28c28]/35 bg-[#f28c28]/12 px-4 py-2 text-sm font-semibold text-[#b85f09]">
            {completion.completionPercent}% ready
          </div>
        </div>

        <label className="flex items-start gap-3 rounded-[16px] border border-black/10 bg-white p-4">
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
            className="mt-1 h-4 w-4 rounded border-black/15 bg-transparent accent-[#f28c28]"
          />
          <span className="text-sm leading-7 text-black/62">
            I confirm that this freelancer profile accurately represents my experience, skills, portfolio, and availability.
          </span>
        </label>
        <FieldError message={attemptedSteps[6] ? currentErrors.termsAccepted : ""} />
      </div>

      <div className="space-y-4">
        <FreelancerSelfProfileView user={user} profile={draft} onEditProfile={() => navigateToStep(1)} />
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
      onBack={handleBack}
      footer={
        introActive ? null : (
          <div className="flex w-full max-w-[940px] items-center justify-between gap-4">
            <button type="button" onClick={handleBack} className={secondaryButtonClass}>
              {currentStep === 1 ? "Back to Dashboard" : "Previous"}
            </button>

            {currentStep < 6 ? (
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
            key={`freelancer-step-${currentStep}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mr-auto w-full max-w-[940px] space-y-7 px-0 sm:px-1"
          >
            {currentStep === 1 ? renderStep1() : null}
            {currentStep === 2 ? renderStep2() : null}
            {currentStep === 3 ? renderStep3() : null}
            {currentStep === 4 ? renderStep4() : null}
            {currentStep === 5 ? renderStep5() : null}
            {currentStep === 6 ? renderStep6() : null}
          </motion.section>
        )}
      </AnimatePresence>
    </OnboardingWorkspace>
  );
};

export default ProfileCompletionWizard;
