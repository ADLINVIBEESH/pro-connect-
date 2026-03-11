export type WizardStep = 1 | 2 | 3 | 4 | 5 | 6;
export type LegacyWizardStep = 1 | 2 | 3 | 4 | 5;

export type LanguageProficiency = "Native" | "Fluent" | "Intermediate" | "Basic";
export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";
export type AvailabilityStatus = "available_now" | "part_time" | "full_time" | "unavailable_until";
export type PreferredProjectType = "hourly" | "fixed" | "milestone";

export interface ProfileMediaMeta {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  preview?: string;
}

export interface ProfileLanguage {
  name: string;
  proficiency: LanguageProficiency;
}

export interface PersonalInformation {
  fullName: string;
  profilePhoto: string;
  phoneCountryCode: string;
  phoneNumber: string;
  phoneVerified: boolean;
  otpTarget: string;
  email: string;
  city: string;
  country: string;
  timezone: string;
  ageRange: string;
  tagline: string;
  languages: string[];
}

export interface ProfessionalOverview {
  title: string;
  overview: string;
  languages: ProfileLanguage[];
  availabilityStatus: AvailabilityStatus;
  availableFrom: string;
}

export interface SkillExperience {
  name: string;
  level: SkillLevel;
  years: string;
}

export interface SkillsExpertise {
  primarySkills: SkillExperience[];
  specializations: string[];
  tools: string[];
}

export interface EducationItem {
  degree: string;
  field: string;
  institution: string;
  year: string;
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  credentialId: string;
  issueDate: string;
  expiryDate: string;
}

export interface CourseItem {
  id: string;
  name: string;
  provider: string;
  url: string;
}

export interface EducationCertifications {
  education: EducationItem;
  certifications: CertificationItem[];
  courses: CourseItem[];
}

export interface PortfolioProjectItem {
  id: string;
  title: string;
  description: string;
  role: string;
  technologies: string[];
  projectUrl: string;
  images: ProfileMediaMeta[];
  startDate: string;
  endDate: string;
  clientName: string;
}

export interface PortfolioWorkSamples {
  projects: PortfolioProjectItem[];
}

export interface SocialLinks {
  portfolioWebsite: string;
  linkedIn: string;
  github: string;
  youtube: string;
  vimeo: string;
  instagram: string;
  behance: string;
}

export interface BillingAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface PaymentPreferences {
  hourlyRateMin: string;
  hourlyRateMax: string;
  currency: string;
  preferredProjectTypes: PreferredProjectType[];
  minimumProjectBudget: string;
  payoutMethods: string[];
  taxId: string;
  billingAddress: BillingAddress;
}

export interface FinalReview {
  profilePreviewViewed: boolean;
  termsAccepted: boolean;
  contractorAcknowledged: boolean;
  publishedAt?: string;
}

export interface ProfileData {
  personal: PersonalInformation & {
    name?: string;
    phone?: string;
  };
  professional: ProfessionalOverview & {
    domains?: string[];
    specializations?: string[];
  };
  expertise: SkillsExpertise;
  education: EducationCertifications;
  portfolio: PortfolioWorkSamples;
  socialLinks: SocialLinks;
  payment: PaymentPreferences;
  finalReview: FinalReview;
  skills?: string[];
  projects?: LegacyProjectItem[];
  rates?: LegacyRates;
}

export interface StepValidationState {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
  step5: boolean;
  step6: boolean;
}

export interface ProfileCompletionState {
  steps: StepValidationState;
  completionPercent: number;
  profileCompleted: boolean;
}

export interface StepPayloadMap {
  1: PersonalInformation;
  2: ProfessionalOverview;
  3: SkillsExpertise;
  4: PortfolioWorkSamples;
  5: SocialLinks;
  6: FinalReview;
}

export interface LegacyRates {
  hourly: string;
  currency: string;
  project_rate: string;
}

export interface LegacyProjectItem {
  id: string;
  title: string;
  description: string;
  repo: string;
  media: ProfileMediaMeta[];
}

export interface LegacyProfileData {
  personal: {
    name: string;
    phone: string;
    country: string;
    city: string;
    languages: string[];
  };
  professional: {
    domains: string[];
    specializations: string[];
  };
  skills: string[];
  projects: LegacyProjectItem[];
  rates: LegacyRates;
}

export type ProjectItem = PortfolioProjectItem;
export type Rates = PaymentPreferences;
