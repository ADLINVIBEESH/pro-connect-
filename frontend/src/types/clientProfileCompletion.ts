export type ClientWizardStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ClientBusinessType = "individual" | "startup" | "agency" | "company";
export type ClientBudgetRangeOption = "under_1k" | "1k_5k" | "5k_10k" | "10k_25k" | "25k_plus";
export type ClientProjectDurationPreference = "less_than_week" | "1_4_weeks" | "1_3_months" | "3_plus_months" | "ongoing";
export type ClientAvailabilityStatus = "actively_hiring" | "reviewing" | "planning" | "paused";

export interface ClientFileMeta {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  preview?: string;
}

export interface ClientBasicProfileSetup {
  profilePhoto: string;
  fullName: string;
  companyName: string;
  professionalTitle: string;
  username: string;
}

export interface ClientAboutCompanyBio {
  bio: string;
  industries: string[];
  businessType: ClientBusinessType;
}

export interface ClientLocationContact {
  country: string;
  city: string;
  timezone: string;
  languages: string[];
  linkedIn: string;
  website: string;
}

export interface ClientBudgetProjectPreferences {
  budgetRange: ClientBudgetRangeOption | "";
  projectDurationPreference: ClientProjectDurationPreference | "";
  paymentMethod: string;
  paymentVerified: boolean;
}

export interface ClientHiringFocus {
  domains: string[];
  subdomains: string[];
  skills: string[];
}

export interface ClientPastProject {
  id: string;
  title: string;
  budget: string;
  duration: string;
  outcome: string;
  media: ClientFileMeta[];
}

export interface ClientPastProjectsHistory {
  projects: ClientPastProject[];
}

export interface ClientReviewsSocialProof {
  placeholderNote: string;
}

export interface ClientAvailabilityPreferences {
  availabilityStatus: ClientAvailabilityStatus;
  preferredMeetingTimes: string[];
  notificationSettings: string[];
}

export interface ClientVerificationStatus {
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  paymentVerified: boolean;
}

export interface ClientFinalReview {
  profilePreviewViewed: boolean;
  termsAccepted: boolean;
  publishedAt?: string;
}

export interface ClientProfileData {
  basic: ClientBasicProfileSetup;
  about: ClientAboutCompanyBio;
  contact: ClientLocationContact;
  budget: ClientBudgetProjectPreferences;
  hiring: ClientHiringFocus;
  projects: ClientPastProjectsHistory;
  reviews: ClientReviewsSocialProof;
  availability: ClientAvailabilityPreferences;
  verification: ClientVerificationStatus;
  finalReview: ClientFinalReview;
}

export interface ClientStepValidationState {
  step1: boolean;
  step2: boolean;
  step3: boolean;
  step4: boolean;
  step5: boolean;
  step6: boolean;
  step7: boolean;
  step8: boolean;
  step9: boolean;
  step10: boolean;
}

export interface ClientProfileCompletionState {
  steps: ClientStepValidationState;
  completionPercent: number;
  profileCompleted: boolean;
}

export interface ClientStepPayloadMap {
  1: ClientBasicProfileSetup;
  2: ClientAboutCompanyBio;
  3: ClientLocationContact;
  4: ClientBudgetProjectPreferences;
  5: ClientHiringFocus;
  6: ClientPastProjectsHistory;
  7: ClientReviewsSocialProof;
  8: ClientAvailabilityPreferences;
  9: ClientVerificationStatus;
  10: ClientFinalReview;
}

export interface LegacyClientPersonalDetails {
  firstName: string;
  lastName: string;
  email: string;
  phoneCountryCode: string;
  phoneNumber: string;
  location: string;
  timezone: string;
  avatar: string;
  tagline: string;
  intro: string;
  linkedinUrl: string;
  websiteUrl: string;
  portfolioUrl: string;
}

export interface LegacyClientBusinessDetails {
  accountType: "individual" | "company";
  companyName: string;
  companyTagline: string;
  industries: string[];
  industryOther: string;
  companySize: string;
  website: string;
  yearFounded: string;
  about: string;
}

export interface LegacyClientHiringDomains {
  categories: string[];
  categorySpecializations: Record<string, string[]>;
  otherCategory: string;
  customTags: string[];
  preferredLevel: ("entry" | "intermediate" | "expert")[];
  preferredLocation: string;
  preferredTimezone: string;
  urgentGig: boolean;
}

export interface LegacyClientPastProject {
  id: string;
  title: string;
  description: string;
  category: string;
  budgetMin: string;
  budgetMax: string;
  currency: string;
  timeline: string;
  skills: string[];
  images: ClientFileMeta[];
  sourceJobId?: string;
}

export interface LegacyClientPaymentPreferences {
  hourlyBudget: { min: string; max: string };
  projectBudget: { min: string; max: string };
  currency: string;
  paymentTypes: ("hourly" | "fixed" | "milestone")[];
  indiaPaymentMethods: string[];
  internationalPaymentMethods: string[];
  billingAddress: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  gstin: string;
  gstCertificate: ClientFileMeta | null;
  otpVerified: boolean;
  otpTarget: string;
}

export interface LegacyClientProfileData {
  personal: LegacyClientPersonalDetails;
  business: LegacyClientBusinessDetails;
  hiring: LegacyClientHiringDomains;
  pastProjects: LegacyClientPastProject[];
  payment: LegacyClientPaymentPreferences;
}
