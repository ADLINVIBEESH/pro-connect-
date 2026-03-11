import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Signup from "@/pages/Signup";

const fetchMock = vi.fn();

const mockJsonResponse = <T,>(payload: T, ok = true, status = ok ? 200 : 400) =>
  ({
    ok,
    status,
    json: async () => payload,
  }) as Response;

const renderSignup = () =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={["/signup"]}>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/role-select" element={<div>Role Select</div>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

describe("signup OTP flow", () => {
  beforeEach(() => {
    localStorage.clear();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("verifies email first, then creates the account from backend responses", async () => {
    fetchMock
      .mockResolvedValueOnce(mockJsonResponse({ message: "OTP sent successfully." }))
      .mockResolvedValueOnce(mockJsonResponse({ message: "OTP verified successfully.", userId: "507f1f77bcf86cd799439011" }))
      .mockResolvedValueOnce(
        mockJsonResponse({
          message: "Account created successfully.",
          token: "jwt-token",
          user: {
            id: "507f1f77bcf86cd799439011",
            email: "new.user@example.com",
            username: "new_user",
            fullName: "New User",
            isVerified: true,
          },
        }, true, 201),
      );

    renderSignup();

    expect(screen.queryByLabelText(/Full name/i)).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Email address/i), {
      target: { value: "new.user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Send OTP/i }));

    expect(await screen.findByText(/Code sent to new\.user@example\.com/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/One-time password/i), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Verify OTP/i }));

    const fullNameInput = await screen.findByLabelText(/Full name/i);
    const usernameInput = screen.getByLabelText(/Username/i) as HTMLInputElement;

    expect(usernameInput.value).toBe("new.user");

    fireEvent.change(fullNameInput, { target: { value: "New User" } });
    fireEvent.change(usernameInput, { target: { value: "new_user" } });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Create account/i }));

    expect(await screen.findByText("Role Select")).toBeInTheDocument();

    const savedUser = JSON.parse(localStorage.getItem("proconnect_user") ?? "{}");
    expect(localStorage.getItem("proconnect_token")).toBe("jwt-token");
    expect(savedUser.email).toBe("new.user@example.com");
    expect(savedUser.username).toBe("new_user");
    expect(savedUser.name).toBe("New User");

    const firstCallBody = JSON.parse(String((fetchMock.mock.calls[0]?.[1] as RequestInit)?.body ?? "{}"));
    const secondCallBody = JSON.parse(String((fetchMock.mock.calls[1]?.[1] as RequestInit)?.body ?? "{}"));
    const thirdCallBody = JSON.parse(String((fetchMock.mock.calls[2]?.[1] as RequestInit)?.body ?? "{}"));

    expect(firstCallBody).toEqual({ email: "new.user@example.com" });
    expect(secondCallBody).toEqual({ email: "new.user@example.com", otp: "123456" });
    expect(thirdCallBody).toEqual({
      userId: "507f1f77bcf86cd799439011",
      username: "new_user",
      fullName: "New User",
      password: "password123",
    });
  });
});
