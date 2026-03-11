import { PROFESSIONAL_DOMAIN_OPTIONS, SKILL_SUGGESTIONS } from "@/data/profileOptions";
import type {
  CertificationItem,
  CourseItem,
  EducationCertifications,
  FinalReview,
  LegacyProjectItem,
  LegacyRates,
  LegacyProfileData,
  PaymentPreferences,
  PortfolioProjectItem,
  ProfileCompletionState,
  ProfileData,
  ProfileLanguage,
  SocialLinks,
  SkillExperience,
  StepValidationState,
  WizardStep,
} from "@/types/profileCompletion";

const skillCanonicalMap = new Map(SKILL_SUGGESTIONS.map((skill) => [skill.toLowerCase(), skill]));

const VALID_AVAILABILITY = new Set(["available_now", "part_time", "full_time", "unavailable_until"]);
const VALID_SKILL_LEVEL = new Set(["Beginner", "Intermediate", "Advanced", "Expert"]);
const VALID_LANGUAGE_PROFICIENCY = new Set(["Native", "Fluent", "Intermediate", "Basic"]);
const VALID_PROJECT_TYPES = new Set(["hourly", "fixed", "milestone"]);

export const STEP_WEIGHTS: Record<WizardStep, number> = {
  1: 20,
  2: 20,
  3: 20,
  4: 20,
  5: 10,
  6: 10,
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

const toStringArray = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => normalizeText(item)).filter(Boolean);
};

const toUniqueArray = (value: string[]) => Array.from(new Set(value));

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

const normalizePhoneFromLegacy = (rawPhone: unknown) => {
  const value = normalizeText(rawPhone);
  if (!value) {
    return { phoneCountryCode: "+91", phoneNumber: "" };
  }

  const compact = value.replace(/\s+/g, " ");
  const match = compact.match(/^(\+\d{1,4})\s*(.*)$/);
  if (match) {
    return {
      phoneCountryCode: match[1],
      phoneNumber: normalizeText(match[2]).replace(/\s+/g, ""),
    };
  }

  return {
    phoneCountryCode: "+91",
    phoneNumber: compact.replace(/\s+/g, ""),
  };
};

const normalizeMedia = (value: unknown) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const current = (item ?? {}) as Record<string, unknown>;
      const name = normalizeText(current.name);
      if (!name) return null;
      return {
        name,
        type: normalizeText(current.type),
        size: Number(current.size) || 0,
        lastModified: Number(current.lastModified) || 0,
        preview: normalizeAssetPreview(current.preview),
      };
    })
    .filter((item): item is { name: string; type: string; size: number; lastModified: number; preview: string } => Boolean(item));
};

const normalizeSocialLinks = (value: unknown): SocialLinks => {
  const current = (value ?? {}) as Record<string, unknown>;
  return {
    portfolioWebsite: normalizeText(current.portfolioWebsite || current.website),
    linkedIn: normalizeText(current.linkedIn || current.linkedin),
    github: normalizeText(current.github),
    youtube: normalizeText(current.youtube),
    vimeo: normalizeText(current.vimeo),
    instagram: normalizeText(current.instagram),
    behance: normalizeText(current.behance),
  };
};

const normalizeProfileLanguages = (value: unknown, legacyLanguages: string[]): ProfileLanguage[] => {
  if (Array.isArray(value) && value.length > 0) {
    return value
      .map((entry) => {
        const current = (entry ?? {}) as Record<string, unknown>;
        const name = normalizeText(current.name);
        if (!name) return null;
        const proficiency = normalizeText(current.proficiency);
        return {
          name,
          proficiency: VALID_LANGUAGE_PROFICIENCY.has(proficiency)
            ? (proficiency as ProfileLanguage["proficiency"])
            : "Fluent",
        };
      })
      .filter((entry): entry is ProfileLanguage => Boolean(entry))
      .slice(0, 6);
  }

  return toUniqueArray(legacyLanguages)
    .map((language) => ({ name: language, proficiency: "Fluent" as const }))
    .slice(0, 6);
};

const normalizeSkillExperiences = (value: unknown, legacySkills: string[]): SkillExperience[] => {
  if (Array.isArray(value) && value.length > 0) {
    const seen = new Set<string>();
    const items: SkillExperience[] = [];

    for (const raw of value) {
      const current = (raw ?? {}) as Record<string, unknown>;
      const name = canonicalizeSkillName(normalizeText(current.name));
      if (!name) continue;
      const key = name.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);

      const level = normalizeText(current.level);
      items.push({
        name,
        level: VALID_SKILL_LEVEL.has(level) ? (level as SkillExperience["level"]) : "Intermediate",
        years: normalizeText(current.years),
      });
    }

    return items;
  }

  return normalizeSkillList(legacySkills).map((name) => ({
    name,
    level: "Intermediate",
    years: "",
  }));
};

const normalizeEducation = (value: unknown): EducationCertifications["education"] => {
  const current = (value ?? {}) as Record<string, unknown>;
  return {
    degree: normalizeText(current.degree),
    field: normalizeText(current.field),
    institution: normalizeText(current.institution),
    year: normalizeText(current.year).slice(0, 4),
  };
};

const normalizeCertifications = (value: unknown): CertificationItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => {
      const current = (entry ?? {}) as Record<string, unknown>;
      const name = normalizeText(current.name);
      if (!name) return null;
      return {
        id: normalizeText(current.id) || `cert-${index + 1}`,
        name,
        issuer: normalizeText(current.issuer),
        credentialId: normalizeText(current.credentialId),
        issueDate: normalizeText(current.issueDate),
        expiryDate: normalizeText(current.expiryDate),
      };
    })
    .filter((entry): entry is CertificationItem => Boolean(entry));
};

const normalizeCourses = (value: unknown): CourseItem[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry, index) => {
      const current = (entry ?? {}) as Record<string, unknown>;
      const name = normalizeText(current.name);
      if (!name) return null;
      return {
        id: normalizeText(current.id) || `course-${index + 1}`,
        name,
        provider: normalizeText(current.provider),
        url: normalizeText(current.url),
      };
    })
    .filter((entry): entry is CourseItem => Boolean(entry));
};

const normalizeProjects = (
  value: unknown,
  legacyProjects: LegacyProfileData["projects"] | undefined,
  fallbackTechnologies: string[]
): PortfolioProjectItem[] => {
  const source = Array.isArray(value)
    ? value
    : Array.isArray(legacyProjects)
      ? legacyProjects.map((project) => ({
          id: project.id,
          title: project.title,
          description: project.description,
          role: "",
          technologies: fallbackTechnologies.slice(0, 4),
          projectUrl: project.repo,
          images: project.media,
          startDate: "",
          endDate: "",
          clientName: "",
        }))
      : [];

  return source.map((entry, index) => {
      const current = (entry ?? {}) as Record<string, unknown>;
      const title = normalizeText(current.title);
      const description = normalizeText(current.description);
      return {
        id: normalizeText(current.id) || `project-${index + 1}`,
        title,
        description,
        role: normalizeText(current.role),
        technologies: normalizeSkillList(toStringArray(current.technologies)).slice(0, 12),
        projectUrl: normalizeText(current.projectUrl || current.repo),
        images: normalizeMedia(current.images ?? current.media).slice(0, 8),
        startDate: normalizeText(current.startDate),
        endDate: normalizeText(current.endDate),
        clientName: normalizeText(current.clientName),
      };
    });
};

const normalizeBillingAddress = (value: unknown): PaymentPreferences["billingAddress"] => {
  const current = (value ?? {}) as Record<string, unknown>;
  return {
    line1: normalizeText(current.line1),
    line2: normalizeText(current.line2),
    city: normalizeText(current.city),
    state: normalizeText(current.state),
    postalCode: normalizeText(current.postalCode),
    country: normalizeText(current.country) || "India",
  };
};

const normalizeProjectTypes = (value: unknown): PaymentPreferences["preferredProjectTypes"] => {
  return toUniqueArray(toStringArray(value)).filter((item) => VALID_PROJECT_TYPES.has(item)) as PaymentPreferences["preferredProjectTypes"];
};

const normalizeFinalReview = (value: unknown): FinalReview => {
  const current = (value ?? {}) as Record<string, unknown>;
  return {
    profilePreviewViewed: Boolean(current.profilePreviewViewed),
    termsAccepted: Boolean(current.termsAccepted),
    contractorAcknowledged: Boolean(current.contractorAcknowledged),
    publishedAt: normalizeText(current.publishedAt),
  };
};

export const createEmptyProfileData = (): ProfileData => ({
  personal: {
    fullName: "",
    profilePhoto: "",
    phoneCountryCode: "+91",
    phoneNumber: "",
    phoneVerified: false,
    otpTarget: "",
    email: "",
    city: "",
    country: "",
    timezone: "Asia/Kolkata",
    ageRange: "",
    tagline: "",
    languages: [],
  },
  professional: {
    title: "",
    overview: "",
    languages: [],
    availabilityStatus: "available_now",
    availableFrom: "",
    domains: [],
    specializations: [],
  },
  expertise: {
    primarySkills: [],
    specializations: [],
    tools: [],
  },
  education: {
    education: {
      degree: "",
      field: "",
      institution: "",
      year: "",
    },
    certifications: [],
    courses: [],
  },
  portfolio: {
    projects: [],
  },
  socialLinks: {
    portfolioWebsite: "",
    linkedIn: "",
    github: "",
    youtube: "",
    vimeo: "",
    instagram: "",
    behance: "",
  },
  payment: {
    hourlyRateMin: "",
    hourlyRateMax: "",
    currency: "USD",
    preferredProjectTypes: [],
    minimumProjectBudget: "",
    payoutMethods: [],
    taxId: "",
    billingAddress: {
      line1: "",
      line2: "",
      city: "",
      state: "",
      postalCode: "",
      country: "India",
    },
  },
  finalReview: {
    profilePreviewViewed: false,
    termsAccepted: false,
    contractorAcknowledged: false,
    publishedAt: "",
  },
});

const looksLikeLegacyShape = (profile: Partial<ProfileData | LegacyProfileData>) => {
  const candidate = profile as Record<string, unknown>;
  const personal = (candidate.personal ?? {}) as Record<string, unknown>;
  const professional = (candidate.professional ?? {}) as Record<string, unknown>;
  const rates = (candidate.rates ?? {}) as Record<string, unknown>;

  if (normalizeText(personal.name)) return true;
  if (normalizeText(personal.phone)) return true;
  if (Array.isArray((personal.languages as unknown[] | undefined) ?? [])) return true;
  if (Array.isArray(candidate.skills)) return true;
  if (Array.isArray(candidate.projects)) return true;
  if (normalizeText(rates.hourly) || normalizeText(rates.currency) || normalizeText(rates.project_rate)) return true;
  if (Array.isArray((professional.domains as unknown[] | undefined) ?? [])) return true;
  if (Array.isArray((professional.specializations as unknown[] | undefined) ?? [])) return true;
  return false;
};

const mergeSkillExperiences = (preferred: SkillExperience[], fallback: SkillExperience[]) => {
  const seen = new Set<string>();
  const merged: SkillExperience[] = [];
  for (const item of preferred.concat(fallback)) {
    const key = normalizeText(item.name).toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(item);
  }
  return merged;
};

const inferDomainsFromSpecializations = (specializations: string[]) => {
  const inferred: string[] = [];
  for (const specialization of specializations) {
    const match = Object.entries(PROFESSIONAL_DOMAIN_OPTIONS).find(([, items]) => items.includes(specialization));
    if (match) inferred.push(match[0]);
  }
  return toUniqueArray(inferred);
};

export const sanitizeProfileData = (
  profile: Partial<ProfileData | LegacyProfileData> | null | undefined
): ProfileData => {
  const base = createEmptyProfileData();
  const merged = (profile ?? {}) as Record<string, unknown>;
  const modern = (profile ?? {}) as Partial<ProfileData>;
  const legacy = looksLikeLegacyShape(profile ?? {}) ? (profile as Partial<LegacyProfileData>) : undefined;

  const personalBag = (modern.personal ?? {}) as Record<string, unknown>;
  const professionalBag = (modern.professional ?? {}) as Record<string, unknown>;
  const ratesBag = (merged.rates ?? {}) as Record<string, unknown>;
  const modernProjects = Array.isArray(modern.portfolio?.projects) ? modern.portfolio.projects : undefined;
  const hasModernProjects = Array.isArray(modernProjects) && modernProjects.length > 0;
  const explicitProjects =
    !hasModernProjects && Array.isArray(merged.projects)
      ? (merged.projects as LegacyProfileData["projects"])
      : undefined;
  const hasExplicitProjects = Array.isArray(explicitProjects) && explicitProjects.length > 0;

  const explicitLegacyName = normalizeText(personalBag.name);
  const explicitLegacyPhone = normalizeText(personalBag.phone);
  const explicitLegacyLanguages = toStringArray(personalBag.languages);
  const explicitLegacyDomains = toStringArray(professionalBag.domains);
  const explicitLegacySpecializations = toStringArray(professionalBag.specializations);
  const explicitLegacySkills = toStringArray(merged.skills);

  const legacyPhone = normalizePhoneFromLegacy(explicitLegacyPhone || legacy?.personal?.phone);
  const legacySkills = normalizeSkillList(explicitLegacySkills.concat(toStringArray(legacy?.skills)));
  const legacyDomains = toUniqueArray(explicitLegacyDomains.concat(toStringArray(legacy?.professional?.domains)));
  const legacySpecializations = toUniqueArray(
    explicitLegacySpecializations.concat(toStringArray(legacy?.professional?.specializations))
  );

  const professionalLanguages = normalizeProfileLanguages(
    modern.professional?.languages,
    toUniqueArray(explicitLegacyLanguages.concat(toStringArray(legacy?.personal?.languages)))
  );
  const personalLanguages = toUniqueArray(
    toStringArray(modern.personal?.languages)
      .concat(explicitLegacyLanguages)
      .concat(toStringArray(legacy?.personal?.languages))
      .concat(professionalLanguages.map((entry) => entry.name))
  ).slice(0, 6);

  const personal = {
    fullName: normalizeText(explicitLegacyName || legacy?.personal?.name || modern.personal?.fullName),
    profilePhoto: normalizeAssetPreview(modern.personal?.profilePhoto),
    phoneCountryCode: normalizeText(explicitLegacyPhone ? legacyPhone.phoneCountryCode : modern.personal?.phoneCountryCode) ||
      legacyPhone.phoneCountryCode,
    phoneNumber: normalizeText(explicitLegacyPhone ? legacyPhone.phoneNumber : modern.personal?.phoneNumber) || legacyPhone.phoneNumber,
    phoneVerified: Boolean(modern.personal?.phoneVerified),
    otpTarget: normalizeText(modern.personal?.otpTarget),
    email: normalizeText(modern.personal?.email).toLowerCase(),
    city: normalizeText(modern.personal?.city || legacy?.personal?.city || personalBag.city),
    country: normalizeText(modern.personal?.country || legacy?.personal?.country || personalBag.country),
    timezone: normalizeText(modern.personal?.timezone) || base.personal.timezone,
    ageRange: normalizeText(modern.personal?.ageRange),
    tagline: normalizeText(modern.personal?.tagline).slice(0, 160),
    languages: personalLanguages,
  };

  const availabilityStatus = normalizeText(modern.professional?.availabilityStatus);
  const modernSpecializations = toStringArray(modern.expertise?.specializations);
  const inferredDomains = inferDomainsFromSpecializations(legacySpecializations.concat(modernSpecializations));
  const normalizedDomains = legacyDomains.length > 0 ? legacyDomains : toUniqueArray(inferredDomains);
  const normalizedSpecializations =
    explicitLegacySpecializations.length > 0
      ? toUniqueArray(legacySpecializations)
      : toUniqueArray(legacySpecializations.concat(modernSpecializations));
  const professional = {
    title: normalizeText(modern.professional?.title || normalizedSpecializations[0] || normalizedDomains[0]),
    overview: normalizeText(modern.professional?.overview).slice(0, 1600),
    languages: professionalLanguages,
    availabilityStatus: VALID_AVAILABILITY.has(availabilityStatus)
      ? (availabilityStatus as ProfileData["professional"]["availabilityStatus"])
      : base.professional.availabilityStatus,
    availableFrom: normalizeText(modern.professional?.availableFrom),
  };

  const modernPrimarySkills = normalizeSkillExperiences(modern.expertise?.primarySkills, []);
  const legacyPrimarySkills = normalizeSkillExperiences(undefined, legacySkills);
  const expertise = {
    primarySkills:
      (modernPrimarySkills.length > 0
        ? mergeSkillExperiences(modernPrimarySkills, legacyPrimarySkills)
        : mergeSkillExperiences(legacyPrimarySkills, modernPrimarySkills)
      ).slice(0, 15),
    specializations: toUniqueArray(normalizedSpecializations).slice(0, 20),
    tools: normalizeSkillList(toStringArray(modern.expertise?.tools).concat(legacySkills)).slice(0, 20),
  };

  const education = {
    education: normalizeEducation(modern.education?.education),
    certifications: normalizeCertifications(modern.education?.certifications).slice(0, 20),
    courses: normalizeCourses(modern.education?.courses).slice(0, 20),
  };

  const projectSource = hasModernProjects ? modernProjects : hasExplicitProjects ? explicitProjects : modernProjects;
  const portfolio = {
    projects: normalizeProjects(
      projectSource,
      hasExplicitProjects ? undefined : legacy?.projects,
      expertise.primarySkills.map((skill) => skill.name)
    ),
  };

  const legacyRateHourly = normalizeText(ratesBag.hourly || legacy?.rates?.hourly);
  const legacyRateCurrency = normalizeText(ratesBag.currency || legacy?.rates?.currency);
  const legacyProjectRate = normalizeText(ratesBag.project_rate || legacy?.rates?.project_rate);
  const payment = {
    hourlyRateMin: normalizeText(legacyRateHourly || modern.payment?.hourlyRateMin || modern.payment?.hourlyRateMax),
    hourlyRateMax: normalizeText(modern.payment?.hourlyRateMax || modern.payment?.hourlyRateMin || legacyRateHourly),
    currency: normalizeText(legacyRateCurrency || modern.payment?.currency) || base.payment.currency,
    preferredProjectTypes: normalizeProjectTypes(modern.payment?.preferredProjectTypes),
    minimumProjectBudget: normalizeText(legacyProjectRate || modern.payment?.minimumProjectBudget),
    payoutMethods: toUniqueArray(toStringArray(modern.payment?.payoutMethods)).slice(0, 8),
    taxId: normalizeText(modern.payment?.taxId).toUpperCase().slice(0, 24),
    billingAddress: normalizeBillingAddress(modern.payment?.billingAddress),
  };

  const finalReview = normalizeFinalReview(modern.finalReview);
  const socialLinks = normalizeSocialLinks(modern.socialLinks);
  const legacyLanguageNames = toUniqueArray(
    personal.languages.concat(professional.languages.map((item) => normalizeText(item.name)).filter(Boolean))
  ).slice(0, 6);
  const legacySkillNames = normalizeSkillList(expertise.primarySkills.map((skill) => skill.name));
  const legacyProjects: LegacyProjectItem[] = portfolio.projects.map((project, index) => ({
    id: normalizeText(project.id) || `project-${index + 1}`,
    title: normalizeText(project.title),
    description: normalizeText(project.description),
    repo: normalizeText(project.projectUrl),
    media: project.images,
  }));
  const legacyRates: LegacyRates = {
    hourly: normalizeText(payment.hourlyRateMin || payment.hourlyRateMax),
    currency: normalizeText(payment.currency),
    project_rate: normalizeText(payment.minimumProjectBudget),
  };

  return {
    personal: {
      ...personal,
      name: personal.fullName,
      phone: [personal.phoneCountryCode, personal.phoneNumber].filter(Boolean).join(" ").trim(),
      languages: legacyLanguageNames,
    },
    professional: {
      ...professional,
      domains: normalizedDomains,
      specializations: normalizedSpecializations,
    },
    expertise,
    education,
    portfolio,
    socialLinks,
    payment,
    finalReview,
    skills: legacySkillNames,
    projects: legacyProjects,
    rates: legacyRates,
  };
};

export const canonicalizeSkillName = (skill: string) => {
  const cleaned = normalizeText(skill).replace(/\s+/g, " ");
  if (!cleaned) return "";

  const canonical = skillCanonicalMap.get(cleaned.toLowerCase());
  if (canonical) return canonical;

  return cleaned
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

export const normalizeSkillList = (skills: string[]) => {
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const skill of skills) {
    const canonical = canonicalizeSkillName(skill);
    const key = canonical.toLowerCase();
    if (!canonical || seen.has(key)) continue;
    seen.add(key);
    normalized.push(canonical);
  }

  return normalized;
};

export const validateStep1 = (profile: Partial<ProfileData | LegacyProfileData>) => {
  const normalized = sanitizeProfileData(profile);
  const p = normalized.personal;
  const name = normalizeText(p.name || p.fullName);
  const phone = normalizeText(p.phone || [p.phoneCountryCode, p.phoneNumber].filter(Boolean).join(" "));
  const languages = Array.isArray(p.languages) ? p.languages.map((item) => normalizeText(item)).filter(Boolean) : [];
  if (!name || !phone) return false;
  if (!normalizeText(p.country) || !normalizeText(p.city)) return false;
  const age = Number(normalizeText(p.ageRange));
  if (!Number.isFinite(age) || age < 13 || age > 100) return false;
  if (languages.length < 1 || languages.length > 6) return false;
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 7;
};

export const validateStep2 = (profile: Partial<ProfileData | LegacyProfileData>) => {
  const normalized = sanitizeProfileData(profile);
  const title = normalizeText(normalized.professional.title);
  const overview = normalizeText(normalized.professional.overview);
  return title.length >= 3 && overview.length >= 40;
};

export const validateStep3 = (profile: Partial<ProfileData | LegacyProfileData>) => {
  const normalized = sanitizeProfileData(profile);
  const skills = normalizeSkillList(normalized.skills ?? normalized.expertise.primarySkills.map((skill) => skill.name));
  return skills.length >= 3;
};

export const validateStep4 = (profile: Partial<ProfileData | LegacyProfileData>) => {
  const normalized = sanitizeProfileData(profile);
  const projects = normalized.projects ?? [];
  if (!Array.isArray(projects) || projects.length < 1) return false;

  return projects.every((project) => {
    if (!normalizeText(project.title) || !normalizeText(project.description)) return false;
    const matchingProject = normalized.portfolio.projects.find((entry) => entry.id === project.id);
    if (!matchingProject || matchingProject.technologies.length < 1) return false;
    const repo = normalizeText(project.repo);
    if (repo && !isValidUrl(repo)) return false;
    return true;
  });
};

export const validateStep5 = (profile: Partial<ProfileData | LegacyProfileData>) => {
  const normalized = sanitizeProfileData(profile);
  const links = Object.values(normalized.socialLinks).map((value) => normalizeText(value)).filter(Boolean);
  if (links.length < 1) return false;
  return links.every((value) => isValidUrl(value));
};

export const validateStep6 = (profile: Partial<ProfileData | LegacyProfileData>) => {
  const normalized = sanitizeProfileData(profile);
  return normalized.finalReview.profilePreviewViewed && normalized.finalReview.termsAccepted;
};

export const getStepValidationState = (profile: Partial<ProfileData | LegacyProfileData>): StepValidationState => ({
  step1: validateStep1(profile),
  step2: validateStep2(profile),
  step3: validateStep3(profile),
  step4: validateStep4(profile),
  step5: validateStep5(profile),
  step6: validateStep6(profile),
});

export const computeCompletionPercent = (steps: Partial<StepValidationState>) => {
  let total = 0;
  if (steps.step1) total += STEP_WEIGHTS[1];
  if (steps.step2) total += STEP_WEIGHTS[2];
  if (steps.step3) total += STEP_WEIGHTS[3];
  if (steps.step4) total += STEP_WEIGHTS[4];
  if (steps.step5) total += STEP_WEIGHTS[5];
  if (steps.step6) total += STEP_WEIGHTS[6];
  return total;
};

export const deriveProfileCompletion = (profile: Partial<ProfileData | LegacyProfileData>): ProfileCompletionState => {
  const steps = getStepValidationState(profile);
  const completionPercent = computeCompletionPercent(steps);
  return {
    steps,
    completionPercent,
    profileCompleted: completionPercent === 100,
  };
};

export const findFirstIncompleteStep = (steps: StepValidationState): WizardStep => {
  if (!steps.step1) return 1;
  if (!steps.step2) return 2;
  if (!steps.step3) return 3;
  if (!steps.step4) return 4;
  if (!steps.step5) return 5;
  if (!steps.step6) return 6;
  return 1;
};
