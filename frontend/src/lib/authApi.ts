import { authRequest, clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken } from "@/lib/apiClient";
export { clearStoredAuthToken, getStoredAuthToken, setStoredAuthToken } from "@/lib/apiClient";

export type ServerUserRole = "client" | "freelancer" | null;
export type ServerAuthProvider = "local" | "google";

export interface ServerFreelancerProfile {
  id: string;
  userId: string;
  profileCompleted: boolean;
  profileData: Record<string, unknown>;
  skills: string[];
  portfolio: unknown[];
  bio: string;
  location: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServerClientProfile {
  id: string;
  userId: string;
  profileCompleted: boolean;
  profileData: Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServerAuthUser {
  id: string;
  email: string;
  username?: string;
  fullName: string;
  role?: ServerUserRole | "hirer";
  isVerified?: boolean;
  avatar?: string;
  authProviders?: ServerAuthProvider[];
  hasPassword?: boolean;
  freelancerProfile?: ServerFreelancerProfile | null;
  clientProfile?: ServerClientProfile | null;
}

export interface ServerSessionPayload {
  token?: string;
  user: ServerAuthUser;
  message?: string;
}

export interface SendOtpResponse {
  message: string;
}

export interface VerifyOtpResponse {
  message: string;
  userId: string;
}

export interface CompleteSignupResponse extends ServerSessionPayload {
  message: string;
  token: string;
}

export interface ResetPasswordResponse extends ServerSessionPayload {
  message: string;
  token: string;
}

export const sendOtpRequest = (email: string) =>
  authRequest<SendOtpResponse>("send-otp", {
    method: "POST",
    body: { email },
  });

export const verifyOtpRequest = (email: string, otp: string) =>
  authRequest<VerifyOtpResponse>("verify-otp", {
    method: "POST",
    body: { email, otp },
  });

export const completeSignupRequest = (payload: {
  userId: string;
  username: string;
  fullName: string;
  password: string;
}) =>
  authRequest<CompleteSignupResponse>("complete-signup", {
    method: "POST",
    body: payload,
  });

export const loginRequest = (payload: { email: string; password: string }) =>
  authRequest<ServerSessionPayload>("login", {
    method: "POST",
    body: payload,
  });

export const googleAuthRequest = (credential: string) =>
  authRequest<ServerSessionPayload>("google", {
    method: "POST",
    body: { credential },
  });

export const sendPasswordResetOtpRequest = (email: string) =>
  authRequest<SendOtpResponse>("send-password-reset-otp", {
    method: "POST",
    body: { email },
  });

export const resetPasswordRequest = (payload: { email: string; otp: string; password: string }) =>
  authRequest<ResetPasswordResponse>("reset-password", {
    method: "POST",
    body: payload,
  });

export const fetchCurrentSession = () => authRequest<{ user: ServerAuthUser }>("me");

export const selectRoleRequest = (role: "client" | "freelancer") =>
  authRequest<ServerSessionPayload>("select-role", {
    method: "POST",
    body: { role },
  });

export const saveFreelancerProfileRequest = (payload: {
  fullName?: string;
  profileData: Record<string, unknown>;
  profileCompleted: boolean;
  skills: string[];
  portfolio: unknown[];
  bio: string;
  location: string;
}) =>
  authRequest<{ message: string; user: ServerAuthUser }>("freelancer-profile", {
    method: "PUT",
    body: payload,
  });

export const saveClientProfileRequest = (payload: {
  fullName?: string;
  profileData: Record<string, unknown>;
  profileCompleted: boolean;
}) =>
  authRequest<{ message: string; user: ServerAuthUser }>("client-profile", {
    method: "PUT",
    body: payload,
  });
