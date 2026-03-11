import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FindTalent from "@/pages/dashboard/FindTalent";
import SettingsPlaceholder from "@/pages/dashboard/SettingsPlaceholder";
import ReadOnlyProfilePage from "@/pages/ReadOnlyProfilePage";

const logoutMock = vi.fn();
const authState = {
  isAuthenticated: true,
  logout: logoutMock,
  user: {
    id: "user-1",
    name: "Client User",
    email: "client@example.com",
    avatar: "https://example.com/avatar.png",
    role: "client" as const,
    hasPassword: true,
    authProviders: ["local"] as const,
    profile_completed: true,
    profile_completion_percent: 100,
    profile: {} as never,
    profile_last_step: 1 as const,
    client_profile: {
      hiring: {
        domains: ["Frontend"],
        subdomains: ["React"],
        skills: ["TypeScript"],
      },
    } as never,
    client_profile_completed: true,
    client_profile_completion_percent: 100,
    client_profile_last_step: 1 as const,
  },
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/lib/googleIdentity", () => ({
  requestGoogleCredential: vi.fn(),
}));

const createResponse = (body: unknown, init?: Partial<Response>) =>
  ({
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    statusText: init?.statusText ?? "OK",
    text: async () => JSON.stringify(body),
  }) as Response;

const renderWithProviders = (ui: ReactNode, initialEntries = ["/"]) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  );
};

describe("dashboard live data flows", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    global.fetch = vi.fn();
    authState.user.role = "client";
    authState.user.hasPassword = true;
    authState.user.authProviders = ["local"];
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows the MongoDB-backed empty state when no freelancers are available", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(createResponse({ freelancers: [] }));

    renderWithProviders(<FindTalent />);

    expect(await screen.findByText("No freelancers available yet.")).toBeInTheDocument();
  });

  it("submits password confirmation when deleting a local account from settings", async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(createResponse({ message: "Account deleted successfully." }));

    renderWithProviders(<SettingsPlaceholder />);

    fireEvent.click(screen.getAllByRole("button", { name: "Delete Account" })[0]);
    fireEvent.change(screen.getByLabelText("Enter your password"), { target: { value: "Password123!" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Delete Account" })[1]);

    await waitFor(() => expect(logoutMock).toHaveBeenCalledTimes(1));
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/users/delete-account",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ password: "Password123!" }),
      }),
    );
  });

  it("renders the shared profile UI in read-only mode without an edit button", async () => {
    authState.user.role = "freelancer";
    authState.user.hasPassword = true;
    authState.user.authProviders = ["local"];

    vi.mocked(global.fetch).mockResolvedValueOnce(
      createResponse({
        role: "freelancer",
        user: {
          id: "freelancer-1",
          email: "freelancer@example.com",
          username: "freelancer.one",
          fullName: "Freelancer One",
          avatar: "https://example.com/freelancer.png",
          role: "freelancer",
          authProviders: ["local"],
          hasPassword: true,
          freelancerProfile: {
            profileCompleted: true,
            profileData: {
              personal: {
                fullName: "Freelancer One",
                email: "freelancer@example.com",
                country: "India",
                city: "Bengaluru",
              },
              professional: {
                title: "React Developer",
                overview: "Builds product-quality React applications.",
                domains: ["Frontend"],
              },
              expertise: {
                primarySkills: [{ name: "React", level: "Advanced", years: "4" }],
                specializations: ["React"],
                tools: [],
              },
              portfolio: { projects: [] },
              socialLinks: {},
              payment: {
                hourlyRateMin: "40",
                hourlyRateMax: "60",
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
                  country: "",
                },
              },
              finalReview: {
                profilePreviewViewed: true,
                termsAccepted: true,
              },
            },
          },
          clientProfile: null,
        },
        summary: null,
      }),
    );

    renderWithProviders(
      <Routes>
        <Route path="/profile/:userId" element={<ReadOnlyProfilePage />} />
      </Routes>,
      ["/profile/freelancer-1"],
    );

    expect(await screen.findByText("Freelancer One")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /update profile|complete profile/i })).not.toBeInTheDocument();
  });
});
