import { describe, expect, it } from "vitest";
import {
  computeCompletionPercent,
  createEmptyProfileData,
  deriveProfileCompletion,
  sanitizeProfileData,
  validateStep1,
  validateStep2,
  validateStep3,
  validateStep4,
  validateStep5,
} from "@/lib/profileCompletion";

describe("profile completion validators", () => {
  it("validates step 1 fields and language count", () => {
    const profile = sanitizeProfileData({
      ...createEmptyProfileData(),
      personal: {
        name: "Alex",
        phone: "+1 999 222 1111",
        country: "United States",
        city: "Seattle",
        languages: ["English", "Spanish"],
      },
    });

    expect(validateStep1(profile)).toBe(true);

    const tooManyLanguages = {
      ...profile,
      personal: { ...profile.personal, languages: ["English", "Hindi", "Spanish", "French"] },
    };
    expect(validateStep1(tooManyLanguages)).toBe(false);
  });

  it("validates domain-specialization hierarchy", () => {
    const validProfile = sanitizeProfileData({
      ...createEmptyProfileData(),
      professional: {
        domains: ["Web Development"],
        specializations: ["Frontend Development"],
      },
    });
    expect(validateStep2(validProfile)).toBe(true);

    const invalidSpecialization = sanitizeProfileData({
      ...validProfile,
      professional: {
        domains: ["Web Development"],
        specializations: ["Logo Design"],
      },
    });
    expect(validateStep2(invalidSpecialization)).toBe(false);
  });

  it("requires at least 3 skills for step 3", () => {
    const validProfile = sanitizeProfileData({
      ...createEmptyProfileData(),
      skills: ["react", "typescript", "Node.js"],
    });
    expect(validateStep3(validProfile)).toBe(true);

    const invalidProfile = sanitizeProfileData({
      ...createEmptyProfileData(),
      skills: ["React", "TypeScript"],
    });
    expect(validateStep3(invalidProfile)).toBe(false);
  });

  it("validates step 4 projects and optional repo URL", () => {
    const validProfile = sanitizeProfileData({
      ...createEmptyProfileData(),
      projects: [
        {
          id: "project-1",
          title: "CRM Dashboard",
          description: "Built an analytics dashboard",
          repo: "https://github.com/example/repo",
          media: [],
        },
      ],
    });
    expect(validateStep4(validProfile)).toBe(true);

    const invalidRepo = sanitizeProfileData({
      ...validProfile,
      projects: [{ ...validProfile.projects[0], repo: "not-a-url" }],
    });
    expect(validateStep4(invalidRepo)).toBe(false);
  });

  it("validates step 5 rates", () => {
    const validProfile = sanitizeProfileData({
      ...createEmptyProfileData(),
      rates: {
        hourly: "40",
        currency: "USD",
        project_rate: "",
      },
    });
    expect(validateStep5(validProfile)).toBe(true);

    const invalidProfile = sanitizeProfileData({
      ...validProfile,
      rates: { ...validProfile.rates, hourly: "0" },
    });
    expect(validateStep5(invalidProfile)).toBe(false);
  });

  it("computes weighted progress and completion at 100 only", () => {
    const steps = {
      step1: true,
      step2: true,
      step3: true,
      step4: false,
      step5: false,
    };
    expect(computeCompletionPercent(steps)).toBe(75);

    const completeProfile = sanitizeProfileData({
      personal: {
        name: "Alex",
        phone: "+1 999 222 1111",
        country: "United States",
        city: "Seattle",
        languages: ["English"],
      },
      professional: {
        domains: ["Web Development"],
        specializations: ["Frontend Development"],
      },
      skills: ["React", "TypeScript", "Node.js"],
      projects: [
        {
          id: "project-1",
          title: "CRM Dashboard",
          description: "Built an analytics dashboard",
          repo: "",
          media: [],
        },
      ],
      rates: {
        hourly: "50",
        currency: "USD",
        project_rate: "",
      },
    });

    const completion = deriveProfileCompletion(completeProfile);
    expect(completion.completionPercent).toBe(100);
    expect(completion.profileCompleted).toBe(true);
  });
});
