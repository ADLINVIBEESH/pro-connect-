import { describe, expect, it } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import Dashboard from "@/pages/Dashboard";
import FreelancerProfileView from "@/pages/FreelancerProfileView";
import ProfileCompletion from "@/pages/ProfileCompletion";
import { AuthProvider, type User } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import { createEmptyProfileData } from "@/lib/profileCompletion";

const seedAuth = (user: User) => {
  localStorage.clear();
  localStorage.setItem("proconnect_user", JSON.stringify(user));
  if (user.role) {
    localStorage.setItem("proconnect_role", user.role);
  }
};

const renderWizardApp = (user: User, path = "/dashboard") => {
  seedAuth(user);

  return render(
    <AuthProvider>
      <AppProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/profile" element={<FreelancerProfileView />} />
            <Route path="/profile-completion" element={<ProfileCompletion />} />
          </Routes>
        </MemoryRouter>
      </AppProvider>
    </AuthProvider>
  );
};

const baseFreelancer = (): User => ({
  id: "wizard-user-1",
  name: "Wizard User",
  email: "wizard.user@example.com",
  role: "freelancer",
  avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=wizard.user@example.com",
  profile_completed: false,
  profile_completion_percent: 0,
  profile_last_step: 1,
  profile: createEmptyProfileData(),
});

const openIntro = async () => {
  const completeProfileButtons = await screen.findAllByRole("button", { name: /Complete Profile/i });
  fireEvent.click(completeProfileButtons[0]);

  expect(
    await screen.findByRole("heading", {
      name: /Complete your profile so clients can discover and trust you\.?/i,
    })
  ).toBeInTheDocument();
};

const openProfileSetup = async () => {
  await openIntro();
  fireEvent.click(await screen.findByRole("button", { name: /Next/i }));
  expect(await screen.findByRole("heading", { name: /You can edit your profile anytime\.?/i })).toBeInTheDocument();
  fireEvent.click(await screen.findByRole("button", { name: /Start Profile Setup/i }));
  expect(await screen.findByRole("heading", { name: /Personal Information/i })).toBeInTheDocument();
};

const completePersonalStep = async () => {
  fireEvent.change(screen.getByLabelText(/Full Name/i), { target: { value: "Wizard User" } });
  fireEvent.change(screen.getByLabelText(/^Country$/i), { target: { value: "India" } });
  expect(screen.getByLabelText(/Phone country code/i)).toHaveValue("+91");
  fireEvent.change(screen.getByPlaceholderText(/Enter your phone number/i), { target: { value: "9876543210" } });
  fireEvent.change(screen.getByLabelText(/^City$/i), { target: { value: "Mumbai" } });
  fireEvent.change(screen.getByLabelText(/^Age$/i), { target: { value: "26" } });
  fireEvent.change(screen.getByLabelText(/Languages Spoken/i), { target: { value: "English" } });
  fireEvent.click(screen.getByRole("button", { name: /Next/i }));
};

const completeProfessionalStep = async () => {
  expect(await screen.findByRole("heading", { name: /Professional Title/i })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/^Professional Title$/i), {
    target: { value: "Frontend Developer" },
  });
  fireEvent.change(screen.getByLabelText(/Bio \/ Description/i), {
    target: {
      value:
        "I build modern frontend experiences for SaaS teams, with a strong focus on performance, usability, and maintainable systems.",
    },
  });
  await waitFor(() => {
    expect(screen.getByDisplayValue("Frontend Developer")).toBeInTheDocument();
  });
  fireEvent.click(screen.getByRole("button", { name: /Next/i }));
};

const completeSkillsStep = async () => {
  expect(await screen.findByRole("heading", { name: /Skills/i })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /Web Development/i }));
  expect(await screen.findByLabelText(/Frontend Development/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/Bookkeeping/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Accounting & Finance/i }));
  expect(await screen.findByLabelText(/Bookkeeping/i)).toBeInTheDocument();
  expect(screen.queryByLabelText(/Frontend Development/i)).not.toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /Web Development/i }));
  fireEvent.click(await screen.findByLabelText(/Frontend Development/i));

  const skillsInput = screen.getByLabelText(/Skills/i);
  for (const skill of ["React", "TypeScript", "Node.js"]) {
    fireEvent.change(skillsInput, { target: { value: skill } });
    fireEvent.keyDown(skillsInput, { key: "Enter", code: "Enter" });
  }
  fireEvent.click(screen.getByRole("button", { name: /Next/i }));
};

describe("profile wizard flow", () => {
  it("opens onboarding as a standalone page without dashboard navigation", async () => {
    renderWizardApp(baseFreelancer());

    await openIntro();
    expect(screen.getByRole("button", { name: /Back to Dashboard/i })).toBeInTheDocument();
    expect(screen.queryByText("Ongoing Works")).not.toBeInTheDocument();
    expect(screen.queryByText("Quick Actions")).not.toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: /Next/i }));
    expect(await screen.findByRole("heading", { name: /You can edit your profile anytime\.?/i })).toBeInTheDocument();

    fireEvent.click(await screen.findByRole("button", { name: /Start Profile Setup/i }));
    expect(await screen.findByRole("heading", { name: /Personal Information/i })).toBeInTheDocument();
  });

  it("publishes the six-step onboarding flow and unlocks the dashboard", async () => {
    renderWizardApp(baseFreelancer());

    await openProfileSetup();
    await completePersonalStep();
    await completeProfessionalStep();
    await completeSkillsStep();

    expect(await screen.findByRole("heading", { name: /Projects \/ Portfolio/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add Project/i }));
    fireEvent.change(await screen.findByLabelText(/Project Title/i), { target: { value: "Analytics Dashboard" } });
    fireEvent.change(screen.getByLabelText(/Project Description/i), {
      target: {
        value:
          "Designed and shipped an analytics dashboard that improved reporting speed and reduced manual client updates.",
      },
    });
    const projectSkillsInput = screen.getByLabelText(/Skills Used/i);
    fireEvent.change(projectSkillsInput, { target: { value: "React" } });
    fireEvent.keyDown(projectSkillsInput, { key: "Enter", code: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    expect(await screen.findByRole("heading", { name: /Social Links/i })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/Portfolio Website/i), {
      target: { value: "https://wizard.dev" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Next/i }));

    expect(await screen.findByRole("heading", { name: /Review & Publish/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Publish Profile/i }));

    expect(await screen.findByRole("link", { name: /Dashboard/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Frontend Developer/i })).toBeInTheDocument();
    expect(screen.getByText("Domains")).toBeInTheDocument();
    expect(screen.getAllByText("Web Development").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Frontend Development").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("link", { name: /Dashboard/i }));

    expect((await screen.findAllByText("Quick Actions")).length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(screen.queryAllByText("Complete your profile to unlock full features").length).toBe(0);
    });
  }, 10000);

  it("updates the phone code, city list, and language list when the country changes", async () => {
    renderWizardApp(baseFreelancer());

    await openProfileSetup();

    fireEvent.change(screen.getByLabelText(/^Country$/i), { target: { value: "India" } });
    expect(screen.getByLabelText(/Phone country code/i)).toHaveValue("+91");
    expect(screen.getByRole("option", { name: "Mumbai" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Hindi" })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^Country$/i), { target: { value: "United States" } });
    expect(screen.getByLabelText(/Phone country code/i)).toHaveValue("+1");
    expect(screen.getByRole("option", { name: "Los Angeles" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "English" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "Mumbai" })).not.toBeInTheDocument();
  }, 10000);

  it("collapses completed projects into title buttons when adding another project", async () => {
    renderWizardApp(baseFreelancer());

    await openProfileSetup();
    await completePersonalStep();
    await completeProfessionalStep();
    await completeSkillsStep();

    expect(await screen.findByRole("heading", { name: /Projects \/ Portfolio/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add Project/i }));
    fireEvent.change(await screen.findByLabelText(/Project Title/i), { target: { value: "Analytics Dashboard" } });
    fireEvent.change(screen.getByLabelText(/Project Description/i), {
      target: {
        value:
          "Designed and shipped an analytics dashboard that improved reporting speed and reduced manual client updates.",
      },
    });
    const firstProjectSkillsInput = screen.getByLabelText(/Skills Used/i);
    fireEvent.change(firstProjectSkillsInput, { target: { value: "React" } });
    fireEvent.keyDown(firstProjectSkillsInput, { key: "Enter", code: "Enter" });

    fireEvent.click(screen.getByRole("button", { name: /Add Project/i }));

    expect(await screen.findByRole("button", { name: "Analytics Dashboard" })).toBeInTheDocument();
    expect(screen.getAllByLabelText(/Project Title/i)).toHaveLength(1);
    expect(screen.getByLabelText(/Project Title/i)).toHaveValue("");

    fireEvent.click(screen.getByRole("button", { name: "Analytics Dashboard" }));
    expect(screen.getByLabelText(/Project Title/i)).toHaveValue("Analytics Dashboard");
  }, 10000);
});
