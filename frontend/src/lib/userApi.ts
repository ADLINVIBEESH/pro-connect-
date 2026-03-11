import { apiRequest } from "@/lib/apiClient";
import type { ServerAuthUser, ServerClientProfile, ServerFreelancerProfile } from "@/lib/authApi";

export interface FreelancerSummary {
  userId: string;
  name: string;
  email: string;
  username?: string;
  avatar: string;
  title: string;
  bio: string;
  location: string;
  domains: string[];
  subdomains: string[];
  skills: string[];
  hourlyRateMin: number;
  hourlyRateMax: number;
  profileCompleted: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReadOnlyProfileResponse {
  role: "client" | "freelancer" | null;
  user: ServerAuthUser;
  summary: FreelancerSummary | ClientSummary | null;
}

export interface ClientSummary {
  userId: string;
  name: string;
  email: string;
  username?: string;
  avatar: string;
  bio: string;
  skills: string[];
  domains: string[];
  subdomains: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DeleteAccountPayload {
  password?: string;
  googleCredential?: string;
}

export const fetchFreelancersRequest = () =>
  apiRequest<{ freelancers: FreelancerSummary[] }>("/api/users/freelancers");

export const fetchReadOnlyProfileRequest = (userId: string) =>
  apiRequest<ReadOnlyProfileResponse>(`/api/users/${userId}/profile`);

export const deleteAccountRequest = (payload: DeleteAccountPayload) =>
  apiRequest<{ message: string }>("/api/users/delete-account", {
    method: "DELETE",
    body: payload,
  });

export type ServerProfilePayload = {
  role: "client" | "freelancer" | null;
  user: ServerAuthUser & {
    freelancerProfile?: ServerFreelancerProfile | null;
    clientProfile?: ServerClientProfile | null;
  };
};
