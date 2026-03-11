import { describe, expect, it } from "vitest";
import { createEmptyProfileData, deriveProfileCompletion, sanitizeProfileData } from "@/lib/profileCompletion";

describe("profile sanitization", () => {
  it("preserves modern portfolio technologies across repeated sanitization", () => {
    const profile = sanitizeProfileData({
      ...createEmptyProfileData(),
      personal: {
        ...createEmptyProfileData().personal,
        fullName: "Freelancer Done",
        phoneCountryCode: "+1",
        phoneNumber: "5551112222",
        country: "United States",
        city: "Seattle",
        ageRange: "29",
        languages: ["English"],
      },
      professional: {
        ...createEmptyProfileData().professional,
        title: "Frontend Developer",
        overview:
          "I build production dashboards and client portals for startup teams with a strong focus on usability.",
      },
      expertise: {
        ...createEmptyProfileData().expertise,
        primarySkills: [
          { name: "React", level: "Advanced", years: "4" },
          { name: "TypeScript", level: "Advanced", years: "4" },
          { name: "Node.js", level: "Intermediate", years: "3" },
        ],
        tools: ["React", "TypeScript", "Node.js"],
        specializations: ["Frontend Development"],
      },
      portfolio: {
        projects: [
          {
            id: "project-1",
            title: "Web App",
            description: "Production dashboard implementation",
            role: "Frontend Developer",
            technologies: ["React"],
            projectUrl: "https://github.com/example/web-app",
            images: [],
            startDate: "",
            endDate: "",
            clientName: "Acme",
          },
        ],
      },
      socialLinks: {
        ...createEmptyProfileData().socialLinks,
        portfolioWebsite: "https://freelancerdone.dev",
      },
      finalReview: {
        ...createEmptyProfileData().finalReview,
        profilePreviewViewed: true,
        termsAccepted: true,
        contractorAcknowledged: true,
        publishedAt: "2026-03-06T10:00:00.000Z",
      },
    });

    const resanitized = sanitizeProfileData(profile);

    expect(resanitized.portfolio.projects[0]?.technologies).toEqual(["React"]);
    expect(resanitized.portfolio.projects[0]?.role).toBe("Frontend Developer");
    expect(resanitized.expertise.primarySkills[0]?.level).toBe("Advanced");
    expect(deriveProfileCompletion(resanitized).profileCompleted).toBe(true);
  });

  it("removes non-persistable blob previews from saved media", () => {
    const profile = sanitizeProfileData({
      ...createEmptyProfileData(),
      personal: {
        ...createEmptyProfileData().personal,
        profilePhoto: "blob:http://localhost:8080/stale-avatar",
      },
      portfolio: {
        projects: [
          {
            id: "project-blob-preview",
            title: "Video Project",
            description: "Recorded showcase video",
            role: "Editor",
            technologies: ["Premiere Pro"],
            projectUrl: "",
            images: [
              {
                name: "showreel.mp4",
                type: "video/mp4",
                size: 5000,
                lastModified: 171000001,
                preview: "blob:http://localhost:8080/stale-preview",
              },
              {
                name: "valid-thumb.jpg",
                type: "image/jpeg",
                size: 3000,
                lastModified: 171000002,
                preview: "data:image/jpeg;base64,ZmFrZQ==",
              },
            ],
            startDate: "",
            endDate: "",
            clientName: "",
          },
        ],
      },
    });

    expect(profile.personal.profilePhoto).toBe("");
    expect(profile.portfolio.projects[0]?.images[0]?.preview).toBe("");
    expect(profile.portfolio.projects[0]?.images[1]?.preview).toBe("data:image/jpeg;base64,ZmFrZQ==");
  });
});
