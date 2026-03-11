import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import { AuthProvider, type User } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { createEmptyProfileData } from "@/lib/profileCompletion";

const renderDashboardAt = (path: string, user: User) => {
  localStorage.clear();
  localStorage.setItem("proconnect_user", JSON.stringify(user));
  if (user.role) {
    localStorage.setItem("proconnect_role", user.role);
  }

  return render(
    <AuthProvider>
      <AppProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/client-dashboard/*" element={<Dashboard />} />
            <Route path="*" element={<div>outside</div>} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </AuthProvider>
  );
};

const incompleteFreelancer = (): User => ({
  id: "freelancer-x1",
  name: "Freelancer Test",
  email: "freelancer.test@example.com",
  role: "freelancer",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=freelancer.test@example.com",
  profile_completed: false,
  profile_completion_percent: 0,
  profile_last_step: 1,
  profile: createEmptyProfileData(),
});

const completeFreelancer = (): User => {
  const profile = {
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
      overview: "I build production dashboards and client portals for startup teams with a strong focus on usability.",
      domains: ["Web Development"],
      specializations: ["Frontend Development"],
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
    payment: {
      ...createEmptyProfileData().payment,
      hourlyRateMin: "50",
      hourlyRateMax: "50",
      currency: "USD",
    },
    finalReview: {
      ...createEmptyProfileData().finalReview,
      profilePreviewViewed: true,
      termsAccepted: true,
      contractorAcknowledged: true,
      publishedAt: "2026-03-06T10:00:00.000Z",
    },
  };

  return {
    id: "freelancer-x2",
    name: "Freelancer Done",
    email: "freelancer.done@example.com",
    role: "freelancer",
    avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=freelancer.done@example.com",
    profile_completed: true,
    profile_completion_percent: 100,
    profile_last_step: 1,
    profile,
  };
};

const clientUser = (): User => ({
  id: "client-x1",
  name: "Client Test",
  email: "client.test@example.com",
  role: "client",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=client.test@example.com",
  profile_completed: true,
  profile_completion_percent: 100,
  profile_last_step: 1,
  profile: createEmptyProfileData(),
});

describe("dashboard onboarding gate", () => {
  it("redirects incomplete freelancers away from locked routes", async () => {
    renderDashboardAt("/dashboard/saved", incompleteFreelancer());

    const banners = await screen.findAllByText("Complete your profile to unlock full features");
    expect(banners.length).toBeGreaterThan(0);
    expect(screen.queryAllByText("Jobs you've bookmarked for later.").length).toBe(0);
  });

  it("does not gate clients when opening their dashboard", async () => {
    renderDashboardAt("/client-dashboard", clientUser());

    expect(await screen.findByText("Client Workspace")).toBeInTheDocument();
    expect(screen.queryAllByText("Complete your profile to unlock full features").length).toBe(0);
  });

  it("shows banner only for incomplete freelancer", async () => {
    const first = renderDashboardAt("/dashboard", incompleteFreelancer());
    const banners = await screen.findAllByText("Complete your profile to unlock full features");
    expect(banners.length).toBeGreaterThan(0);
    first.unmount();

    renderDashboardAt("/dashboard", completeFreelancer());
    await waitFor(() => {
      expect(screen.queryAllByText("Complete your profile to unlock full features").length).toBe(0);
    });
  });
});
