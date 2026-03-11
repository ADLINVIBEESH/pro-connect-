import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import FreelancerProfileView from "@/pages/FreelancerProfileView";
import ProfileCompletion from "@/pages/ProfileCompletion";
import ClientProfileCompletion from "@/pages/ClientProfileCompletion";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider, type User } from "@/contexts/AuthContext";
import { createEmptyClientProfileData } from "@/lib/clientProfileCompletion";
import { createEmptyProfileData } from "@/lib/profileCompletion";
import FreelancerSelfProfileView from "@/components/profile/FreelancerSelfProfileView";

const seedAuth = (user: User) => {
  localStorage.clear();
  localStorage.setItem("proconnect_user", JSON.stringify(user));
  if (user.role) localStorage.setItem("proconnect_role", user.role);
};

const renderFreelancerStandalone = (user: User, path = "/profile") => {
  seedAuth(user);

  return render(
    <AuthProvider>
      <AppProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/profile" element={<FreelancerProfileView />} />
            <Route path="/profile-completion" element={<ProfileCompletion />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="*" element={<div>outside</div>} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </AuthProvider>
  );
};

const renderDashboardProfile = (user: User, path = "/client-dashboard/profile") => {
  seedAuth(user);

  return render(
    <AuthProvider>
      <AppProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/client-dashboard/*" element={<Dashboard />} />
            <Route path="/client-profile-completion" element={<ClientProfileCompletion />} />
            <Route path="*" element={<div>outside</div>} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </AuthProvider>
  );
};

const freelancerUser = (): User => {
  const base = createEmptyProfileData();

  return {
    id: "freelancer-self-view",
    name: "Nora Patel",
    email: "nora.patel@example.com",
    role: "freelancer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=nora.patel@example.com",
    profile_completed: true,
    profile_completion_percent: 100,
    profile_last_step: 1,
    profile: {
      ...base,
      personal: {
        ...base.personal,
        fullName: "Nora Patel",
        email: "nora.patel@example.com",
        phoneCountryCode: "+91",
        phoneNumber: "9876543210",
        city: "Bengaluru",
        country: "India",
        ageRange: "28",
        languages: ["English"],
      },
      professional: {
        ...base.professional,
        title: "Frontend Engineer",
        overview: "I build polished and performant web applications for growth-stage teams.",
        availabilityStatus: "available_now",
        domains: ["Web Development"],
        specializations: ["Frontend Development"],
      },
      expertise: {
        ...base.expertise,
        primarySkills: [
          { name: "React", level: "Expert", years: "5" },
          { name: "TypeScript", level: "Advanced", years: "4" },
          { name: "Next.js", level: "Advanced", years: "3" },
        ],
        specializations: ["Frontend Development"],
        tools: ["React", "TypeScript", "Next.js", "Vite"],
      },
      portfolio: {
        projects: [
          {
            id: "proj-1",
            title: "Commerce Dashboard",
            description: "Built a multi-tenant analytics dashboard for subscription commerce operations.",
            role: "Lead Frontend Engineer",
            technologies: ["React", "TypeScript"],
            projectUrl: "https://example.com/commerce-dashboard",
            images: [
              {
                name: "commerce-dashboard.png",
                type: "image/png",
                size: 42000,
                lastModified: 171000000,
                preview: "https://example.com/media/commerce-dashboard.png",
              },
            ],
            startDate: "Jan 2024",
            endDate: "Jun 2024",
            clientName: "Acme Labs",
          },
          {
            id: "proj-2",
            title: "Customer Insights Portal",
            description: "Delivered insight workflows and reporting modules for product and growth teams.",
            role: "Frontend Developer",
            technologies: ["React", "Recharts"],
            projectUrl: "",
            images: [
              {
                name: "insights-spec.pdf",
                type: "application/pdf",
                size: 9000,
                lastModified: 171100000,
              },
            ],
            startDate: "Jul 2023",
            endDate: "Dec 2023",
            clientName: "Acme Labs",
          },
          {
            id: "proj-3",
            title: "Marketing Site Revamp",
            description: "Improved conversion-focused page architecture and performance budgets.",
            role: "Frontend Engineer",
            technologies: ["Next.js"],
            projectUrl: "",
            images: [],
            startDate: "",
            endDate: "",
            clientName: "Globex",
          },
          {
            id: "proj-4",
            title: "Launch Campaign Reel",
            description: "Produced and delivered a short-form product launch reel for paid and organic channels.",
            role: "Video Editor",
            technologies: ["Premiere Pro", "After Effects"],
            projectUrl: "",
            images: [
              {
                name: "campaign-brief.pdf",
                type: "application/pdf",
                size: 7500,
                lastModified: 171200000,
              },
              {
                name: "launch-reel.mp4",
                type: "video/mp4",
                size: 8400000,
                lastModified: 171200111,
                preview: "data:image/jpeg;base64,ZmFrZS12aWRlby10aHVtYm5haWw=",
              },
            ],
            startDate: "Aug 2024",
            endDate: "Sep 2024",
            clientName: "Helio",
          },
        ],
      },
      payment: {
        ...base.payment,
        hourlyRateMin: "55",
        hourlyRateMax: "65",
        currency: "USD",
        minimumProjectBudget: "1200",
      },
      socialLinks: {
        ...base.socialLinks,
        portfolioWebsite: "https://norapatel.dev",
        linkedIn: "https://linkedin.com/in/norapatel",
        github: "https://github.com/norapatel",
      },
      finalReview: {
        ...base.finalReview,
        profilePreviewViewed: true,
        termsAccepted: true,
        contractorAcknowledged: true,
        publishedAt: "2026-03-06T10:00:00.000Z",
      },
    },
  };
};

const clientUser = (): User => {
  const base = createEmptyClientProfileData();

  return {
    id: "client-self-view",
    name: "Northstar Labs",
    email: "client.user@example.com",
    role: "client",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=client.user@example.com",
    profile_completed: true,
    profile_completion_percent: 100,
    profile_last_step: 1,
    profile: createEmptyProfileData(),
    client_profile_completed: true,
    client_profile_completion_percent: 100,
    client_profile_last_step: 1,
    client_profile: {
      ...base,
      basic: {
        ...base.basic,
        companyName: "Northstar Labs",
        professionalTitle: "Product Hiring Lead",
        username: "northstarlabs",
      },
      about: {
        ...base.about,
        bio: "We hire freelance specialists for product launches, growth experiments, and design-system work across our SaaS portfolio.",
        industries: ["SaaS", "Information Technology"],
        businessType: "company",
      },
      contact: {
        ...base.contact,
        country: "India",
        city: "Bengaluru",
        timezone: "Asia/Kolkata",
        languages: ["English"],
        linkedIn: "https://linkedin.com/company/northstarlabs",
        website: "https://northstarlabs.example.com",
      },
      budget: {
        ...base.budget,
        budgetRange: "5k_10k",
        projectDurationPreference: "1_3_months",
        paymentMethod: "Bank transfer",
        paymentVerified: true,
      },
      hiring: {
        skills: ["React", "Product Design", "Content Strategy"],
      },
      projects: {
        projects: [
          {
            id: "client-proj-1",
            title: "Growth Site Refresh",
            budget: "$6,500 fixed",
            duration: "6 weeks",
            outcome: "Launched a refreshed acquisition site with cleaner conversion paths and improved signup completion.",
            media: [],
          },
        ],
      },
      availability: {
        ...base.availability,
        availabilityStatus: "actively_hiring",
        preferredMeetingTimes: ["Morning"],
        notificationSettings: ["Email updates"],
      },
      verification: {
        ...base.verification,
        email: "client.user@example.com",
        phoneNumber: "9876543210",
        emailVerified: true,
        phoneVerified: true,
        paymentVerified: true,
      },
      finalReview: {
        ...base.finalReview,
        profilePreviewViewed: true,
        termsAccepted: true,
        publishedAt: "2026-03-06T10:00:00.000Z",
      },
    },
  };
};

describe("freelancer self profile page", () => {
  it("renders standalone freelancer profile sections and derived values", async () => {
    const user = freelancerUser();

    render(
      <FreelancerSelfProfileView user={user} profile={user.profile} onEditProfile={() => undefined} />
    );

    expect(await screen.findByRole("heading", { name: "Frontend Engineer" })).toBeInTheDocument();
    expect(screen.getByText("Nora Patel")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Update Profile/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /LinkedIn/i })).toHaveAttribute("href", "https://linkedin.com/in/norapatel");
    expect(screen.getByRole("link", { name: /GitHub/i })).toHaveAttribute("href", "https://github.com/norapatel");

    expect(screen.getByText("Domains")).toBeInTheDocument();
    expect(screen.getByText("Web Development")).toBeInTheDocument();
    expect(screen.getAllByText("React").length).toBeGreaterThan(0);
    expect(screen.getByTestId("hourly-rate-stat")).toHaveTextContent("USD 55 - 65 / hr");
    expect(screen.getByTestId("clients-served-count-stat")).toHaveTextContent("3");

    expect(screen.getByTestId("project-media-preview-proj-1")).toBeInTheDocument();
    expect(screen.getByTestId("project-media-placeholder-proj-2")).toBeInTheDocument();
    expect(screen.getByTestId("project-media-preview-proj-4").tagName).toBe("IMG");
  });

  it("shows dashboard chrome on the standalone profile page and keeps onboarding standalone", async () => {
    renderFreelancerStandalone(freelancerUser());

    expect(await screen.findByText("ProConnect")).toBeInTheDocument();
    expect(screen.getByText("Freelancer Workspace")).toBeInTheDocument();
    expect(screen.getByText("Categories")).toBeInTheDocument();
    expect(screen.getByText("ProConnect freelancer dashboard experience.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Complete Profile|Update Profile/i }));

    expect(
      await screen.findByRole("heading", { name: "Complete your profile so clients can discover and trust you." })
    ).toBeInTheDocument();
    expect(screen.queryByText("Categories")).not.toBeInTheDocument();
  });

  it("shows the new client self profile view and opens client profile completion", async () => {
    renderDashboardProfile(clientUser());

    expect(await screen.findByText("Client profile preview")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Product Hiring Lead" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Update Profile/i }));

    expect(
      await screen.findByRole("heading", { name: "Complete your profile so freelancers can trust your vision." })
    ).toBeInTheDocument();
  });
});
