import React, { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { freelancers as mockFreelancers, type Freelancer } from "@/data/mockData";
import {
  clearStoredAuthToken,
  fetchCurrentSession,
  getStoredAuthToken,
  loginRequest,
  saveClientProfileRequest,
  saveFreelancerProfileRequest,
  selectRoleRequest,
  setStoredAuthToken,
  type ServerAuthProvider,
  type ServerSessionPayload,
} from "@/lib/authApi";
import {
  createEmptyClientProfileData,
  deriveClientProfileCompletion,
  findFirstIncompleteClientStep,
  sanitizeClientProfileData,
} from "@/lib/clientProfileCompletion";
import {
  createEmptyProfileData,
  deriveProfileCompletion,
  findFirstIncompleteStep,
  sanitizeProfileData,
} from "@/lib/profileCompletion";
import type {
  ClientProfileData,
  ClientStepPayloadMap,
  ClientWizardStep,
} from "@/types/clientProfileCompletion";
import type { ProfileData, StepPayloadMap, WizardStep } from "@/types/profileCompletion";

type UserRole = "client" | "freelancer" | null;

export interface User {
  id: string;
  name: string;
  email: string;
  username?: string;
  role: UserRole;
  avatar: string;
  authProviders: ServerAuthProvider[];
  hasPassword: boolean;
  profile_completed: boolean;
  profile_completion_percent: number;
  profile: ProfileData;
  profile_last_step: WizardStep;
  client_profile?: ClientProfileData;
  client_profile_completed?: boolean;
  client_profile_completion_percent?: number;
  client_profile_last_step?: ClientWizardStep;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  applyServerSession: (session: ServerSessionPayload) => User;
  syncSession: () => Promise<User | null>;
  logout: () => void;
  setRole: (role: "client" | "freelancer") => Promise<User>;
  saveFreelancerProfileToServer: (profile: ProfileData) => Promise<void>;
  saveClientProfileToServer: (profile: ClientProfileData) => Promise<void>;
  saveProfileStep: <T extends WizardStep>(step: T, payload: StepPayloadMap[T]) => void;
  replaceProfile: (profile: ProfileData, lastStep?: WizardStep) => void;
  setProfileLastStep: (step: WizardStep) => void;
  recomputeProfileCompletion: () => void;
  saveClientProfileStep: <T extends ClientWizardStep>(step: T, payload: ClientStepPayloadMap[T]) => void;
  replaceClientProfile: (profile: ClientProfileData, lastStep?: ClientWizardStep) => void;
  setClientProfileLastStep: (step: ClientWizardStep) => void;
  recomputeClientProfileCompletion: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const LEGACY_HIRER_PROFILE_KEY = "proconnect_hirer_profile";

interface LegacyHirerProfileData {
  companyName: string;
  description: string;
  location: string;
  website: string;
}

const safeParse = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

const normalizeRole = (value: unknown): UserRole => {
  if (value === "hirer") return "client";
  return value === "client" || value === "freelancer" ? value : null;
};

const buildAvatarUrl = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

const splitName = (value: string) => {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
};

const normalizeUsername = (value: unknown, fallback: string) =>
  String(value ?? fallback)
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._-]/g, "")
    .slice(0, 24);

const getLegacyFreelancer = (userLike: Partial<User>): Freelancer | undefined => {
  const saved = safeParse<Freelancer[]>(localStorage.getItem("proconnect_freelancers"));
  const source = Array.isArray(saved) && saved.length > 0 ? saved : mockFreelancers;
  const targetName = String(userLike.name ?? "").trim().toLowerCase();
  const emailPrefix = String(userLike.email ?? "")
    .split("@")[0]
    .trim()
    .toLowerCase();

  return (
    source.find((freelancer) => freelancer.id === userLike.id) ??
    source.find((freelancer) => freelancer.name.trim().toLowerCase() === targetName) ??
    source.find((freelancer) => freelancer.name.trim().toLowerCase() === emailPrefix)
  );
};

const mergeLegacyProfile = (
  profile: ProfileData,
  legacy: Freelancer | undefined,
  fallbackName: string,
  fallbackEmail: string
): ProfileData => {
  const merged = sanitizeProfileData(profile);

  if (!legacy) {
    return sanitizeProfileData({
      ...merged,
      personal: {
        ...merged.personal,
        fullName: merged.personal.fullName || fallbackName,
        email: merged.personal.email || fallbackEmail,
      },
    });
  }

  return sanitizeProfileData({
    ...merged,
    personal: {
      ...merged.personal,
      fullName: merged.personal.fullName || fallbackName || legacy.name,
      email: merged.personal.email || fallbackEmail,
      country: merged.personal.country || legacy.country || "",
      city: merged.personal.city || legacy.city || "",
      tagline:
        merged.personal.tagline ||
        `${legacy.title || "Freelancer"} focused on reliable delivery and clear communication.`,
    },
    professional: {
      ...merged.professional,
      title: merged.professional.title || legacy.professionalTitle || legacy.title || "Freelancer",
      overview: merged.professional.overview || legacy.bio || "",
    },
    expertise: {
      ...merged.expertise,
      primarySkills:
        merged.expertise.primarySkills.length > 0
          ? merged.expertise.primarySkills
          : (legacy.skills ?? []).map((skill) => ({
              name: skill,
              level: "Intermediate" as const,
              years: "",
            })),
      tools:
        merged.expertise.tools.length > 0
          ? merged.expertise.tools
          : (legacy.skills ?? []).slice(0, 8),
      specializations:
        merged.expertise.specializations.length > 0
          ? merged.expertise.specializations
          : [legacy.professionalTitle || legacy.title].filter(Boolean),
    },
    payment: {
      ...merged.payment,
      hourlyRateMin: merged.payment.hourlyRateMin || (legacy.hourlyRate ? String(legacy.hourlyRate) : ""),
      hourlyRateMax: merged.payment.hourlyRateMax || (legacy.hourlyRate ? String(legacy.hourlyRate) : ""),
      currency: merged.payment.currency || "USD",
    },
  });
};

const getLegacyHirerProfile = (userId: string): LegacyHirerProfileData | null => {
  const parsed = safeParse<Partial<LegacyHirerProfileData>>(localStorage.getItem(`${LEGACY_HIRER_PROFILE_KEY}_${userId}`));
  if (!parsed) return null;
  return {
    companyName: String(parsed.companyName ?? "").trim(),
    description: String(parsed.description ?? "").trim(),
    location: String(parsed.location ?? "").trim(),
    website: String(parsed.website ?? "").trim(),
  };
};

const mergeLegacyClientProfile = (
  profile: ClientProfileData,
  legacy: LegacyHirerProfileData | null,
  fallbackName: string,
  fallbackEmail: string
) => {
  return sanitizeClientProfileData({
    ...profile,
    basic: {
      ...profile.basic,
      fullName: profile.basic.fullName || fallbackName,
      companyName: profile.basic.companyName || legacy?.companyName || "",
      professionalTitle: profile.basic.professionalTitle || "Hiring Manager",
      username: profile.basic.username || fallbackEmail.split("@")[0] || "",
    },
    about: {
      ...profile.about,
      bio: profile.about.bio || legacy?.description || "",
    },
    contact: {
      ...profile.contact,
      country: profile.contact.country || legacy?.location || "",
      website: profile.contact.website || legacy?.website || "",
    },
    verification: {
      ...profile.verification,
      email: profile.verification.email || fallbackEmail,
    },
  });
};

const buildFreelancerPortfolioSummary = (projects: ProfileData["portfolio"]["projects"]) =>
  projects.map(({ images, ...project }) => ({
    ...project,
    images: images.map(({ preview: _preview, ...media }) => media),
  }));

const buildFreelancerServerProfileData = (profile: ProfileData) => {
  const {
    skills: _legacySkills,
    projects: _legacyProjects,
    rates: _legacyRates,
    personal,
    portfolio,
    ...modernProfile
  } = profile;
  const { name: _legacyName, phone: _legacyPhone, ...modernPersonal } = personal;

  return {
    ...modernProfile,
    personal: modernPersonal,
    portfolio: {
      ...portfolio,
      projects: portfolio.projects.map((project) => ({
        ...project,
        images: project.images.map((media) => ({ ...media })),
      })),
    },
  };
};

const withComputedProfile = (candidate: Partial<User>): User => {
  const role = normalizeRole(candidate.role);
  const email = String(candidate.email ?? "").trim();
  const name = String(candidate.name ?? "").trim() || email.split("@")[0] || "User";
  const id = String(candidate.id ?? "1");
  const username = normalizeUsername(candidate.username, email.split("@")[0] || name);
  const authProviders =
    Array.isArray(candidate.authProviders) && candidate.authProviders.length > 0
      ? candidate.authProviders
      : candidate.hasPassword === false
        ? (["google"] as ServerAuthProvider[])
        : (["local"] as ServerAuthProvider[]);
  const hasPassword = candidate.hasPassword ?? authProviders.includes("local");

  const sanitizedFreelancerProfile = sanitizeProfileData(candidate.profile);
  const avatarFromProfile = String(sanitizedFreelancerProfile.personal.profilePhoto ?? "").trim();
  const avatar = avatarFromProfile || String(candidate.avatar ?? "").trim() || buildAvatarUrl(email || name || id);
  const legacyFreelancer = role === "freelancer" ? getLegacyFreelancer({ ...candidate, id, email, name, role }) : undefined;
  const profile =
    role === "freelancer"
      ? mergeLegacyProfile(sanitizedFreelancerProfile, legacyFreelancer, name, email)
      : sanitizeProfileData({
          ...sanitizedFreelancerProfile,
          personal: {
            ...sanitizedFreelancerProfile.personal,
            fullName: sanitizedFreelancerProfile.personal.fullName || name,
            email: sanitizedFreelancerProfile.personal.email || email,
          },
        });

  const freelancerCompletion = deriveProfileCompletion(profile);
  const parsedFreelancerStep = Number(candidate.profile_last_step);
  const validFreelancerStep =
    parsedFreelancerStep >= 1 && parsedFreelancerStep <= 6
      ? (parsedFreelancerStep as WizardStep)
      : findFirstIncompleteStep(freelancerCompletion.steps);

  const rawClientProfile = sanitizeClientProfileData(candidate.client_profile);
  const legacyClient = role === "client" ? getLegacyHirerProfile(id) : null;
  const clientProfile = mergeLegacyClientProfile(rawClientProfile, legacyClient, name, email);
  const clientCompletion = deriveClientProfileCompletion(clientProfile);
  const parsedClientStep = Number(candidate.client_profile_last_step);
  const validClientStep =
    parsedClientStep >= 1 && parsedClientStep <= 10
      ? (parsedClientStep as ClientWizardStep)
      : findFirstIncompleteClientStep(clientCompletion.steps);
  const resolvedClientName = clientProfile.basic.companyName || clientProfile.basic.fullName || name;
  const resolvedClientAvatar = clientProfile.basic.profilePhoto || avatar;

  const roleAwareCompleted =
    role === "freelancer"
      ? freelancerCompletion.profileCompleted
      : role === "client"
        ? clientCompletion.profileCompleted
        : false;
  const roleAwarePercent =
    role === "freelancer"
      ? freelancerCompletion.completionPercent
      : role === "client"
        ? clientCompletion.completionPercent
        : 0;

  return {
    id,
    name: role === "client" ? resolvedClientName : name,
    email,
    username,
    role,
    avatar: role === "freelancer" ? profile.personal.profilePhoto || avatar : resolvedClientAvatar,
    authProviders,
    hasPassword,
    profile,
    profile_completed: roleAwareCompleted,
    profile_completion_percent: roleAwarePercent,
    profile_last_step: validFreelancerStep,
    client_profile: clientProfile,
    client_profile_completed: clientCompletion.profileCompleted,
    client_profile_completion_percent: clientCompletion.completionPercent,
    client_profile_last_step: validClientStep,
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = safeParse<Partial<User>>(localStorage.getItem("proconnect_user"));
    if (!saved) return null;
    return withComputedProfile(saved);
  });

  const persist = (nextUser: User | null) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("proconnect_user", JSON.stringify(nextUser));
    } else {
      localStorage.removeItem("proconnect_user");
    }
  };

  // Bridge the backend auth response into the richer frontend user shape used across onboarding and dashboards.
  const applyServerSession = ({ token, user: serverUser }: ServerSessionPayload) => {
    const role = normalizeRole(serverUser.role);
    const saved = safeParse<Partial<User>>(localStorage.getItem("proconnect_user"));
    const previousForSameUser =
      (user && user.id === serverUser.id ? user : null) ??
      (saved && String(saved.id ?? "") === serverUser.id ? saved : null);
    const base: Partial<User> = {
      id: serverUser.id,
      name: serverUser.fullName,
      email: serverUser.email,
      username: serverUser.username,
      role,
      avatar: serverUser.avatar || buildAvatarUrl(serverUser.email),
      authProviders: serverUser.authProviders ?? (serverUser.hasPassword ? ["local"] : []),
      hasPassword: Boolean(serverUser.hasPassword),
      profile: (serverUser.freelancerProfile?.profileData as unknown as ProfileData | undefined) ?? createEmptyProfileData(),
      profile_last_step: previousForSameUser?.profile_last_step ?? 1,
      client_profile: (serverUser.clientProfile?.profileData as unknown as ClientProfileData | undefined) ?? createEmptyClientProfileData(),
      client_profile_last_step: previousForSameUser?.client_profile_last_step ?? 1,
    };

    if (token) {
      setStoredAuthToken(token);
    }

    if (role) {
      localStorage.setItem("proconnect_role", role);
    } else {
      localStorage.removeItem("proconnect_role");
    }

    const nextUser = withComputedProfile(base);
    persist(nextUser);
    return nextUser;
  };

  const syncSession = async () => {
    if (!getStoredAuthToken()) {
      return null;
    }

    try {
      // const response = await fetchCurrentSession();
      // return applyServerSession({ user: response.user });
      
      const role = localStorage.getItem("proconnect_role") as UserRole || null;
      return applyServerSession({
        token: getStoredAuthToken(),
        user: {
          id: "mock_user",
          email: "mock@example.com",
          fullName: "Mock User",
          role,
          hasPassword: true,
        }
      });
    } catch {
      persist(null);
      localStorage.removeItem("proconnect_role");
      clearStoredAuthToken();
      return null;
    }
  };

  useEffect(() => {
    if (!getStoredAuthToken()) return;
    void syncSession();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    // const session = await loginRequest({
    //   email: email.trim().toLowerCase(),
    //   password,
    // });
    
    // Mock login session
    const session: ServerSessionPayload = {
      message: "Mock login successful",
      token: "mock-token",
      user: {
        id: "mock_user",
        email: email.trim().toLowerCase(),
        fullName: email.split("@")[0] || "User",
        role: localStorage.getItem("proconnect_role") as UserRole || null,
        hasPassword: true,
      }
    };

    return applyServerSession(session);
  };

  const logout = () => {
    persist(null);
    localStorage.removeItem("proconnect_role");
    clearStoredAuthToken();
  };

  const setRole = async (role: "client" | "freelancer") => {
    // const session = await selectRoleRequest(role);
    // return applyServerSession(session);

    // Mock set role
    localStorage.setItem("proconnect_role", role);
    const session: ServerSessionPayload = {
      message: "Mock role set",
      token: getStoredAuthToken() || "mock-token",
      user: {
        id: "mock_user",
        email: "mock@example.com",
        fullName: "Mock User",
        role: role,
        hasPassword: true,
      }
    };
    return applyServerSession(session);
  };

  const saveFreelancerProfileToServer = async (profile: ProfileData) => {
    if (!getStoredAuthToken()) return;

    // Mock server save
    return Promise.resolve();

    /*
    const sanitized = sanitizeProfileData(profile);
    const completion = deriveProfileCompletion(sanitized);
    const serverProfileData = buildFreelancerServerProfileData(sanitized);

    await saveFreelancerProfileRequest({
      fullName: sanitized.personal.fullName,
      profileData: serverProfileData as Record<string, unknown>,
      profileCompleted: completion.profileCompleted,
      skills: sanitized.expertise.primarySkills.map((skill) => skill.name).filter(Boolean),
      portfolio: buildFreelancerPortfolioSummary(sanitized.portfolio.projects),
      bio: sanitized.professional.overview || sanitized.personal.tagline,
      location: [sanitized.personal.city, sanitized.personal.country].filter(Boolean).join(", "),
    });
    */
  };

  const saveClientProfileToServer = async (profile: ClientProfileData) => {
    if (!getStoredAuthToken()) return;

    // Mock server save
    return Promise.resolve();

    /*
    const sanitized = sanitizeClientProfileData(profile);
    const completion = deriveClientProfileCompletion(sanitized);

    await saveClientProfileRequest({
      fullName: sanitized.basic.fullName,
      profileData: sanitized as unknown as Record<string, unknown>,
      profileCompleted: completion.profileCompleted,
    });
    */
  };

  const saveProfileStep = <T extends WizardStep,>(step: T, payload: StepPayloadMap[T]) => {
    setUser((previousUser) => {
      if (!previousUser || previousUser.role !== "freelancer") return previousUser;

      const nextProfile = sanitizeProfileData(previousUser.profile);

      if (step === 1) {
        nextProfile.personal = {
          ...nextProfile.personal,
          ...(payload as StepPayloadMap[1]),
        };
      } else if (step === 2) {
        nextProfile.professional = {
          ...nextProfile.professional,
          ...(payload as StepPayloadMap[2]),
        };
      } else if (step === 3) {
        nextProfile.expertise = {
          ...nextProfile.expertise,
          ...(payload as StepPayloadMap[3]),
        };
      } else if (step === 4) {
        nextProfile.portfolio = {
          ...nextProfile.portfolio,
          ...(payload as StepPayloadMap[4]),
        };
      } else if (step === 5) {
        nextProfile.socialLinks = {
          ...nextProfile.socialLinks,
          ...(payload as StepPayloadMap[5]),
        };
      } else if (step === 6) {
        nextProfile.finalReview = {
          ...nextProfile.finalReview,
          ...(payload as StepPayloadMap[6]),
        };
      }

      const sanitized = sanitizeProfileData(nextProfile);
      const completion = deriveProfileCompletion(sanitized);
      const fallbackAvatar = buildAvatarUrl(previousUser.email || previousUser.name || previousUser.id);
      const updated: User = {
        ...previousUser,
        name: step === 1 ? sanitized.personal.fullName || previousUser.name : previousUser.name,
        avatar: step === 1 ? sanitized.personal.profilePhoto || fallbackAvatar : previousUser.avatar,
        profile: sanitized,
        profile_completion_percent: completion.completionPercent,
        profile_completed: completion.profileCompleted,
        profile_last_step: previousUser.profile_last_step,
      };

      localStorage.setItem("proconnect_user", JSON.stringify(updated));
      return updated;
    });
  };

  const replaceProfile = (profile: ProfileData, lastStep?: WizardStep) => {
    setUser((previousUser) => {
      if (!previousUser || previousUser.role !== "freelancer") return previousUser;

      const sanitized = sanitizeProfileData(profile);
      const completion = deriveProfileCompletion(sanitized);
      const nextUser = withComputedProfile({
        ...previousUser,
        name: sanitized.personal.fullName || previousUser.name,
        profile: sanitized,
        profile_completed: completion.profileCompleted,
        profile_completion_percent: completion.completionPercent,
        profile_last_step: lastStep ?? previousUser.profile_last_step,
      });

      localStorage.setItem("proconnect_user", JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const setProfileLastStep = (step: WizardStep) => {
    setUser((previousUser) => {
      if (!previousUser || previousUser.role !== "freelancer") return previousUser;
      const nextUser = withComputedProfile({ ...previousUser, profile_last_step: step });
      localStorage.setItem("proconnect_user", JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const recomputeProfileCompletion = () => {
    if (!user || user.role !== "freelancer") return;
    const profile = sanitizeProfileData(user.profile);
    const completion = deriveProfileCompletion(profile);
    persist(
      withComputedProfile({
        ...user,
        profile,
        profile_completion_percent: completion.completionPercent,
        profile_completed: completion.profileCompleted,
        profile_last_step: completion.profileCompleted ? 1 : findFirstIncompleteStep(completion.steps),
      })
    );
  };

  const saveClientProfileStep = <T extends ClientWizardStep,>(step: T, payload: ClientStepPayloadMap[T]) => {
    setUser((previousUser) => {
      if (!previousUser || previousUser.role !== "client") return previousUser;

      const nextProfile = sanitizeClientProfileData(previousUser.client_profile);

      if (step === 1) {
        nextProfile.basic = {
          ...nextProfile.basic,
          ...(payload as ClientStepPayloadMap[1]),
        };
      } else if (step === 2) {
        nextProfile.about = {
          ...nextProfile.about,
          ...(payload as ClientStepPayloadMap[2]),
        };
      } else if (step === 3) {
        nextProfile.contact = {
          ...nextProfile.contact,
          ...(payload as ClientStepPayloadMap[3]),
        };
      } else if (step === 4) {
        nextProfile.budget = {
          ...nextProfile.budget,
          ...(payload as ClientStepPayloadMap[4]),
        };
      } else if (step === 5) {
        nextProfile.hiring = {
          ...nextProfile.hiring,
          ...(payload as ClientStepPayloadMap[5]),
        };
      } else if (step === 6) {
        nextProfile.projects = {
          ...nextProfile.projects,
          ...(payload as ClientStepPayloadMap[6]),
        };
      } else if (step === 7) {
        nextProfile.reviews = {
          ...nextProfile.reviews,
          ...(payload as ClientStepPayloadMap[7]),
        };
      } else if (step === 8) {
        nextProfile.availability = {
          ...nextProfile.availability,
          ...(payload as ClientStepPayloadMap[8]),
        };
      } else if (step === 9) {
        nextProfile.verification = {
          ...nextProfile.verification,
          ...(payload as ClientStepPayloadMap[9]),
        };
      } else if (step === 10) {
        nextProfile.finalReview = {
          ...nextProfile.finalReview,
          ...(payload as ClientStepPayloadMap[10]),
        };
      }

      const completion = deriveClientProfileCompletion(nextProfile);
      const nextName = nextProfile.basic.companyName || nextProfile.basic.fullName || previousUser.name;
      const nextUser = withComputedProfile({
        ...previousUser,
        name: step === 1 && nextName ? nextName : previousUser.name,
        client_profile: nextProfile,
        client_profile_completion_percent: completion.completionPercent,
        client_profile_completed: completion.profileCompleted,
        client_profile_last_step: previousUser.client_profile_last_step ?? 1,
      });

      localStorage.setItem("proconnect_user", JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const replaceClientProfile = (profile: ClientProfileData, lastStep?: ClientWizardStep) => {
    setUser((previousUser) => {
      if (!previousUser || previousUser.role !== "client") return previousUser;

      const sanitized = sanitizeClientProfileData(profile);
      const completion = deriveClientProfileCompletion(sanitized);
      const nextUser = withComputedProfile({
        ...previousUser,
        client_profile: sanitized,
        client_profile_completed: completion.profileCompleted,
        client_profile_completion_percent: completion.completionPercent,
        client_profile_last_step: lastStep ?? previousUser.client_profile_last_step,
      });

      localStorage.setItem("proconnect_user", JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const setClientProfileLastStep = (step: ClientWizardStep) => {
    setUser((previousUser) => {
      if (!previousUser || previousUser.role !== "client") return previousUser;
      const nextUser = withComputedProfile({ ...previousUser, client_profile_last_step: step });
      localStorage.setItem("proconnect_user", JSON.stringify(nextUser));
      return nextUser;
    });
  };

  const recomputeClientProfileCompletion = () => {
    if (!user || user.role !== "client") return;
    const clientProfile = sanitizeClientProfileData(user.client_profile);
    const completion = deriveClientProfileCompletion(clientProfile);
    persist(
      withComputedProfile({
        ...user,
        client_profile: clientProfile,
        client_profile_completion_percent: completion.completionPercent,
        client_profile_completed: completion.profileCompleted,
        client_profile_last_step: completion.profileCompleted ? 1 : findFirstIncompleteClientStep(completion.steps),
      })
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        applyServerSession,
        syncSession,
        logout,
        setRole,
        saveFreelancerProfileToServer,
        saveClientProfileToServer,
        saveProfileStep,
        replaceProfile,
        setProfileLastStep,
        recomputeProfileCompletion,
        saveClientProfileStep,
        replaceClientProfile,
        setClientProfileLastStep,
        recomputeClientProfileCompletion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
