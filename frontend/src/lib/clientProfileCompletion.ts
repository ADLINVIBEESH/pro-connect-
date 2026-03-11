import { normalizeSkillList } from "@/lib/profileCompletion";
import type {
  ClientAboutCompanyBio,
  ClientAvailabilityPreferences,
  ClientBudgetProjectPreferences,
  ClientBusinessType,
  ClientFileMeta,
  ClientFinalReview,
  ClientHiringFocus,
  ClientLocationContact,
  ClientPastProject,
  ClientProfileCompletionState,
  ClientProfileData,
  ClientReviewsSocialProof,
  ClientStepValidationState,
  ClientVerificationStatus,
  ClientWizardStep,
  LegacyClientProfileData,
} from "@/types/clientProfileCompletion";

export const CLIENT_STEP_WEIGHTS: Record<ClientWizardStep, number> = {
  1: 10,
  2: 10,
  3: 10,
  4: 10,
  5: 10,
  6: 10,
  7: 10,
  8: 10,
  9: 10,
  10: 10,
};

const normalizeText = (value: unknown) => String(value ?? "").trim();

const normalizeAssetPreview = (value: unknown) => {
  const preview = normalizeText(value);
  if (!preview || preview.startsWith("blob:")) return "";
  if (
    preview.startsWith("data:") ||
    preview.startsWith("http://") ||
    preview.startsWith("https://") ||
    preview.startsWith("/") ||
    preview.startsWith("./") ||
    preview.startsWith("../")
  ) {
    return preview;
  }
  return "";
};

const toUniqueStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return Array.from(new Set(value.map((item) => normalizeText(item)).filter(Boolean)));
};

const normalizeFileMeta = (value: unknown): ClientFileMeta | null => {
  if (!value || typeof value !== "object") return null;
  const current = value as Partial<ClientFileMeta>;
  const name = normalizeText(current.name);
  if (!name) return null;
  return {
    name,
    type: normalizeText(current.type),
    size: Number(current.size) || 0,
    lastModified: Number(current.lastModified) || 0,
    preview: normalizeAssetPreview(current.preview),
  };
};

const isValidUrl = (value: string) => {
  const trimmed = normalizeText(value);
  if (!trimmed) return true;
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
};

const normalizeBusinessType = (value: unknown): ClientBusinessType => {
  const current = normalizeText(value);
  if (current === "startup" || current === "agency" || current === "company") return current;
  return "individual";
};

const normalizeAvailabilityStatus = (value: unknown): ClientAvailabilityPreferences["availabilityStatus"] => {
  const current = normalizeText(value);
  if (current === "reviewing" || current === "planning" || current === "paused") return current;
  return "actively_hiring";
};

const normalizeBudgetRange = (value: unknown): ClientBudgetProjectPreferences["budgetRange"] => {
  const current = normalizeText(value);
  if (["under_1k", "1k_5k", "5k_10k", "10k_25k", "25k_plus"].includes(current)) {
    return current as ClientBudgetProjectPreferences["budgetRange"];
  }
  return "";
};

const normalizeProjectDurationPreference = (value: unknown): ClientBudgetProjectPreferences["projectDurationPreference"] => {
  const current = normalizeText(value);
  if (["less_than_week", "1_4_weeks", "1_3_months", "3_plus_months", "ongoing"].includes(current)) {
    return current as ClientBudgetProjectPreferences["projectDurationPreference"];
  }
  return "";
};

const normalizePhone = (countryCode: unknown, phoneNumber: unknown) => ({
  phoneCountryCode: normalizeText(countryCode) || "+91",
  phoneNumber: normalizeText(phoneNumber),
});

const splitLegacyLocation = (value: string) => {
  const parts = value
    .split(",")
    .map((part) => normalizeText(part))
    .filter(Boolean);

  if (parts.length >= 2) {
    return {
      city: parts.slice(0, -1).join(", "),
      country: parts[parts.length - 1],
    };
  }

  return {
    city: "",
    country: normalizeText(value),
  };
};

const inferBudgetRangeFromLegacy = (legacy: Partial<LegacyClientProfileData> | undefined) => {
  const rawValue =
    Number(legacy?.payment?.projectBudget?.max || legacy?.payment?.projectBudget?.min || legacy?.payment?.hourlyBudget?.max || "0") || 0;
  if (rawValue <= 0) return "";
  if (rawValue < 1000) return "under_1k";
  if (rawValue <= 5000) return "1k_5k";
  if (rawValue <= 10000) return "5k_10k";
  if (rawValue <= 25000) return "10k_25k";
  return "25k_plus";
};

const inferDurationFromLegacy = (legacy: Partial<LegacyClientProfileData> | undefined) => {
  const timeline = normalizeText(legacy?.pastProjects?.[0]?.timeline).toLowerCase();
  if (!timeline) return "";
  if (timeline.includes("week")) return timeline.includes("1") ? "less_than_week" : "1_4_weeks";
  if (timeline.includes("month")) return timeline.includes("3") || timeline.includes("4") ? "3_plus_months" : "1_3_months";
  if (timeline.includes("ongoing")) return "ongoing";
  return "1_4_weeks";
};

const normalizePastProjects = (value: unknown, legacy: Partial<LegacyClientProfileData> | undefined): ClientPastProject[] => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray(legacy?.pastProjects)
      ? legacy.pastProjects.map((project) => ({
          id: project.id,
          title: project.title,
          budget: [project.currency, project.budgetMin, project.budgetMax].filter(Boolean).join(" ").trim(),
          duration: project.timeline,
          outcome: project.description,
          media: project.images,
        }))
      : [];

  return source
    .map((project, index) => {
      const current = (project ?? {}) as Record<string, unknown>;
      return {
        id: normalizeText(current.id) || `client-project-${index + 1}`,
        title: normalizeText(current.title),
        budget: normalizeText(current.budget),
        duration: normalizeText(current.duration),
        outcome: normalizeText(current.outcome).slice(0, 1200),
        media: Array.isArray(current.media)
          ? current.media.map((item) => normalizeFileMeta(item)).filter((item): item is ClientFileMeta => Boolean(item)).slice(0, 8)
          : [],
      };
    })
    .filter((project) => Boolean(project.title || project.outcome || project.budget || project.duration || project.media.length > 0));
};

const normalizeVerification = (value: unknown, legacy: Partial<LegacyClientProfileData> | undefined): ClientVerificationStatus => {
  const current = (value ?? {}) as Record<string, unknown>;
  const phone = normalizePhone(current.phoneCountryCode || legacy?.personal?.phoneCountryCode, current.phoneNumber || legacy?.personal?.phoneNumber);
  return {
    email: normalizeText(current.email || legacy?.personal?.email).toLowerCase(),
    phoneCountryCode: phone.phoneCountryCode,
    phoneNumber: phone.phoneNumber,
    emailVerified: Boolean(current.emailVerified),
    phoneVerified: Boolean(current.phoneVerified || legacy?.payment?.otpVerified),
    paymentVerified: Boolean(current.paymentVerified || legacy?.payment?.otpVerified),
  };
};

const looksLikeLegacyShape = (profile: Partial<ClientProfileData | LegacyClientProfileData>) => {
  const candidate = profile as Record<string, unknown>;
  if (candidate.personal || candidate.business || candidate.pastProjects || candidate.payment) return true;
  return false;
};

export const createEmptyClientProfileData = (): ClientProfileData => ({
  basic: {
    profilePhoto: "",
    fullName: "",
    companyName: "",
    professionalTitle: "",
    username: "",
  },
  about: {
    bio: "",
    industries: [],
    businessType: "individual",
  },
  contact: {
    country: "",
    city: "",
    timezone: "Asia/Kolkata",
    languages: [],
    linkedIn: "",
    website: "",
  },
  budget: {
    budgetRange: "",
    projectDurationPreference: "",
    paymentMethod: "",
    paymentVerified: false,
  },
  hiring: {
    domains: [],
    subdomains: [],
    skills: [],
  },
  projects: {
    projects: [],
  },
  reviews: {
    placeholderNote: "Client reviews and public endorsements will appear here in a future release.",
  },
  availability: {
    availabilityStatus: "actively_hiring",
    preferredMeetingTimes: [],
    notificationSettings: [],
  },
  verification: {
    email: "",
    phoneCountryCode: "+91",
    phoneNumber: "",
    emailVerified: false,
    phoneVerified: false,
    paymentVerified: false,
  },
  finalReview: {
    profilePreviewViewed: false,
    termsAccepted: false,
    publishedAt: "",
  },
});

export const sanitizeClientProfileData = (
  profile: Partial<ClientProfileData | LegacyClientProfileData> | null | undefined
): ClientProfileData => {
  const base = createEmptyClientProfileData();
  const modern = (profile ?? {}) as Partial<ClientProfileData>;
  const legacy = looksLikeLegacyShape(profile ?? {}) ? ((profile ?? {}) as Partial<LegacyClientProfileData>) : undefined;
  const legacyLocation = splitLegacyLocation(normalizeText(legacy?.personal?.location));
  const legacyName = [normalizeText(legacy?.personal?.firstName), normalizeText(legacy?.personal?.lastName)].filter(Boolean).join(" ").trim();
  const rawUsername = normalizeText(modern.basic?.username || legacy?.personal?.email).split("@")[0] ?? "";
  const skillsFromLegacy = normalizeSkillList(
    toUniqueStringArray([
      ...(legacy?.hiring?.customTags ?? []),
      ...(legacy?.pastProjects ?? []).flatMap((project) => project.skills ?? []),
      ...(legacy?.hiring?.categories ?? []),
    ])
  );
  const domainsFromLegacy = toUniqueStringArray([
    ...(legacy?.hiring?.categories ?? []),
    ...(legacy?.business?.industries ?? []),
  ]);
  const subdomainsFromLegacy = toUniqueStringArray(
    Object.values(legacy?.hiring?.categorySpecializations ?? {}).flatMap((items) => items ?? [])
  );

  return {
    basic: {
      profilePhoto: normalizeAssetPreview(modern.basic?.profilePhoto || legacy?.personal?.avatar),
      fullName: normalizeText(modern.basic?.fullName || legacyName),
      companyName: normalizeText(modern.basic?.companyName || legacy?.business?.companyName),
      professionalTitle: normalizeText(modern.basic?.professionalTitle || legacy?.business?.companyTagline || legacy?.personal?.tagline).slice(0, 120),
      username: normalizeText(rawUsername).replace(/^@+/, "").replace(/\s+/g, "").slice(0, 40),
    },
    about: {
      bio: normalizeText(modern.about?.bio || legacy?.business?.about || legacy?.personal?.intro).slice(0, 1600),
      industries: toUniqueStringArray(modern.about?.industries ?? legacy?.business?.industries).slice(0, 12),
      businessType: normalizeBusinessType(modern.about?.businessType || legacy?.business?.accountType),
    },
    contact: {
      country: normalizeText(modern.contact?.country || legacyLocation.country),
      city: normalizeText(modern.contact?.city || legacyLocation.city),
      timezone: normalizeText(modern.contact?.timezone || legacy?.personal?.timezone) || base.contact.timezone,
      languages: toUniqueStringArray(modern.contact?.languages).slice(0, 6),
      linkedIn: normalizeText(modern.contact?.linkedIn || legacy?.personal?.linkedinUrl),
      website: normalizeText(modern.contact?.website || legacy?.personal?.websiteUrl || legacy?.business?.website || legacy?.personal?.portfolioUrl),
    },
    budget: {
      budgetRange: normalizeBudgetRange(modern.budget?.budgetRange || inferBudgetRangeFromLegacy(legacy)),
      projectDurationPreference: normalizeProjectDurationPreference(
        modern.budget?.projectDurationPreference || inferDurationFromLegacy(legacy)
      ),
      paymentMethod: normalizeText(
        modern.budget?.paymentMethod ||
          legacy?.payment?.indiaPaymentMethods?.[0] ||
          legacy?.payment?.internationalPaymentMethods?.[0] ||
          legacy?.payment?.paymentTypes?.[0]
      ),
      paymentVerified: Boolean(modern.budget?.paymentVerified || legacy?.payment?.otpVerified),
    },
    hiring: {
      domains: toUniqueStringArray(modern.hiring?.domains ?? domainsFromLegacy).slice(0, 12),
      subdomains: toUniqueStringArray(modern.hiring?.subdomains ?? subdomainsFromLegacy).slice(0, 20),
      skills: normalizeSkillList(modern.hiring?.skills ?? skillsFromLegacy).slice(0, 20),
    },
    projects: {
      projects: normalizePastProjects(modern.projects?.projects, legacy),
    },
    reviews: {
      placeholderNote: normalizeText(modern.reviews?.placeholderNote || base.reviews.placeholderNote).slice(0, 240),
    },
    availability: {
      availabilityStatus: normalizeAvailabilityStatus(modern.availability?.availabilityStatus),
      preferredMeetingTimes: toUniqueStringArray(modern.availability?.preferredMeetingTimes).slice(0, 8),
      notificationSettings: toUniqueStringArray(modern.availability?.notificationSettings).slice(0, 8),
    },
    verification: normalizeVerification(modern.verification, legacy),
    finalReview: {
      profilePreviewViewed: Boolean(modern.finalReview?.profilePreviewViewed),
      termsAccepted: Boolean(modern.finalReview?.termsAccepted),
      publishedAt: normalizeText(modern.finalReview?.publishedAt),
    },
  };
};

export const validateClientStep1 = (profile: ClientProfileData) => {
  const basic = profile.basic;
  if (!normalizeText(basic.fullName) && !normalizeText(basic.companyName)) return false;
  if (normalizeText(basic.professionalTitle).length < 3) return false;
  if (normalizeText(basic.username).length < 3) return false;
  return true;
};

export const validateClientStep2 = (profile: ClientProfileData) => {
  const about = profile.about;
  if (normalizeText(about.bio).length < 40) return false;
  if (about.industries.length < 1) return false;
  return Boolean(about.businessType);
};

export const validateClientStep3 = (profile: ClientProfileData) => {
  const contact = profile.contact;
  if (!normalizeText(contact.country) || !normalizeText(contact.city) || !normalizeText(contact.timezone)) return false;
  if (contact.languages.length < 1) return false;
  return [contact.linkedIn, contact.website].every((url) => isValidUrl(url));
};

export const validateClientStep4 = (profile: ClientProfileData) => {
  const budget = profile.budget;
  return Boolean(
    normalizeText(budget.budgetRange) &&
      normalizeText(budget.projectDurationPreference) &&
      normalizeText(budget.paymentMethod)
  );
};

export const validateClientStep5 = (profile: ClientProfileData) => profile.hiring.skills.length >= 3;

export const validateClientStep6 = (profile: ClientProfileData) => {
  const projects = profile.projects.projects;
  if (projects.length < 1) return false;
  return projects.every((project) => {
    return Boolean(
      normalizeText(project.title) &&
        normalizeText(project.budget) &&
        normalizeText(project.duration) &&
        normalizeText(project.outcome)
    );
  });
};

export const validateClientStep7 = (_profile: ClientProfileData) => true;

export const validateClientStep8 = (profile: ClientProfileData) => {
  const availability = profile.availability;
  return Boolean(availability.availabilityStatus && availability.preferredMeetingTimes.length > 0 && availability.notificationSettings.length > 0);
};

export const validateClientStep9 = (profile: ClientProfileData) => {
  const verification = profile.verification;
  const digits = verification.phoneNumber.replace(/\D/g, "");
  return Boolean(
    normalizeText(verification.email) &&
      digits.length >= 7 &&
      verification.emailVerified &&
      verification.phoneVerified &&
      verification.paymentVerified
  );
};

export const validateClientStep10 = (profile: ClientProfileData) =>
  profile.finalReview.profilePreviewViewed && profile.finalReview.termsAccepted;

export const getClientStepValidationState = (profile: ClientProfileData): ClientStepValidationState => ({
  step1: validateClientStep1(profile),
  step2: validateClientStep2(profile),
  step3: validateClientStep3(profile),
  step4: validateClientStep4(profile),
  step5: validateClientStep5(profile),
  step6: validateClientStep6(profile),
  step7: validateClientStep7(profile),
  step8: validateClientStep8(profile),
  step9: validateClientStep9(profile),
  step10: validateClientStep10(profile),
});

export const deriveClientProfileCompletion = (profile: ClientProfileData): ClientProfileCompletionState => {
  const steps = getClientStepValidationState(profile);
  let completionPercent = 0;
  if (steps.step1) completionPercent += CLIENT_STEP_WEIGHTS[1];
  if (steps.step2) completionPercent += CLIENT_STEP_WEIGHTS[2];
  if (steps.step3) completionPercent += CLIENT_STEP_WEIGHTS[3];
  if (steps.step4) completionPercent += CLIENT_STEP_WEIGHTS[4];
  if (steps.step5) completionPercent += CLIENT_STEP_WEIGHTS[5];
  if (steps.step6) completionPercent += CLIENT_STEP_WEIGHTS[6];
  if (steps.step7) completionPercent += CLIENT_STEP_WEIGHTS[7];
  if (steps.step8) completionPercent += CLIENT_STEP_WEIGHTS[8];
  if (steps.step9) completionPercent += CLIENT_STEP_WEIGHTS[9];
  if (steps.step10) completionPercent += CLIENT_STEP_WEIGHTS[10];

  return {
    steps,
    completionPercent,
    profileCompleted: completionPercent === 100,
  };
};

export const findFirstIncompleteClientStep = (steps: ClientStepValidationState): ClientWizardStep => {
  if (!steps.step1) return 1;
  if (!steps.step2) return 2;
  if (!steps.step3) return 3;
  if (!steps.step4) return 4;
  if (!steps.step5) return 5;
  if (!steps.step6) return 6;
  if (!steps.step7) return 7;
  if (!steps.step8) return 8;
  if (!steps.step9) return 9;
  if (!steps.step10) return 10;
  return 1;
};
