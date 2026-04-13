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

export interface Notification {
  _id: string;
  recipientId: string;
  senderId: {
    _id: string;
    fullName: string;
    avatar: string;
    email: string;
  };
  type: string;
  jobId?: {
    _id: string;
    title: string;
    description: string;
    clientId: string;
    status: string;
  };
  message: string;
  isRead: boolean;
  createdAt: string;
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

export const saveFreelancerRequest = (freelancerId: string) =>
  apiRequest<{ message: string }>(`/api/users/save-freelancer/${freelancerId}`, { method: "POST" });

export const removeSavedFreelancerRequest = (freelancerId: string) =>
  apiRequest<{ message: string }>(`/api/users/save-freelancer/${freelancerId}`, { method: "DELETE" });

export const fetchSavedFreelancersRequest = () =>
  apiRequest<{ freelancers: FreelancerSummary[] }>("/api/users/saved-freelancers");

export const notifyUserRequest = (userId: string, payload: { message: string; type?: string; jobId?: string }) =>
  apiRequest<{ message: string }>(`/api/users/${userId}/notify`, {
    method: "POST",
    body: payload,
  });

export const fetchNotificationsRequest = () =>
  apiRequest<{ notifications: Notification[] }>("/api/users/notifications");

export const markNotificationReadRequest = (id: string) =>
  apiRequest<{ message: string }>(`/api/users/notifications/${id}/read`, { method: "PUT" });

export const deleteNotificationRequest = (id: string) =>
  apiRequest<{ message: string }>(`/api/users/notifications/${id}`, { method: "DELETE" });

export const deleteAllNotificationsRequest = () =>
  apiRequest<{ message: string }>("/api/users/notifications", { method: "DELETE" });
