import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Login from "@/pages/Login";

vi.mock("@/components/ui/input-otp", () => ({
  InputOTP: ({
    value,
    onChange,
    "aria-label": ariaLabel,
  }: {
    value?: string;
    onChange?: (value: string) => void;
    "aria-label"?: string;
  }) => (
    <input
      aria-label={ariaLabel ?? "One-time password"}
      value={value ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
  InputOTPGroup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  InputOTPSlot: () => null,
}));

const fetchMock = vi.fn();

const mockJsonResponse = <T,>(payload: T, ok = true, status = ok ? 200 : 400) =>
  ({
    ok,
    status,
    json: async () => payload,
  }) as Response;

const renderLogin = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<div>Dashboard</div>} />
          <Route path="/client-dashboard" element={<div>Client Dashboard</div>} />
          <Route path="/role-select" element={<div>Role Select</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

describe("login forgot password flow", () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sends a reset OTP, resets the password, and signs the user in", async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ message: "Password reset OTP sent successfully." }))
      .mockResolvedValueOnce(
        mockJsonResponse({
          message: "Password reset successfully.",
          token: "reset-token",
          user: {
            id: "507f1f77bcf86cd799439011",
            email: "existing.user@example.com",
            username: "existing_user",
            fullName: "Existing User",
            role: "freelancer",
            isVerified: true,
          },
        }),
      );

    renderLogin();

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "existing.user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Forgot password\?/i }));

    const resetEmailInput = screen.getByLabelText(/Email address/i) as HTMLInputElement;
    expect(resetEmailInput.value).toBe("existing.user@example.com");

    fireEvent.click(screen.getByRole("button", { name: /Send OTP/i }));

    expect(await screen.findByText(/Code sent to existing\.user@example\.com/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/One-time password/i), {
      target: { value: "123456" },
    });
    fireEvent.change(screen.getByLabelText(/^New password$/i), {
      target: { value: "newPassword123" },
    });
    fireEvent.change(screen.getByLabelText(/^Confirm new password$/i), {
      target: { value: "newPassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Reset & Sign In/i }));

    expect(await screen.findByText("Dashboard")).toBeInTheDocument();

    const savedUser = JSON.parse(localStorage.getItem("proconnect_user") ?? "{}");
    expect(localStorage.getItem("proconnect_token")).toBe("reset-token");
    expect(savedUser.email).toBe("existing.user@example.com");
    expect(savedUser.username).toBe("existing_user");
    expect(savedUser.role).toBe("freelancer");

    const firstCallBody = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit)?.body ?? "{}"));
    const secondCallBody = JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit)?.body ?? "{}"));

    expect(firstCallBody).toEqual({ email: "existing.user@example.com" });
    expect(secondCallBody).toEqual({
      email: "existing.user@example.com",
      otp: "123456",
      password: "newPassword123",
    });
  });
});
