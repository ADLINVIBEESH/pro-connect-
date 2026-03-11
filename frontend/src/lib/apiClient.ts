export const AUTH_TOKEN_KEY = "proconnect_token";
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000").replace(/\/$/, "");

interface ApiResponseWithMessage {
  message?: string;
}

export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string;
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

const getStorage = () => (typeof window === "undefined" ? null : window.localStorage);

export const getStoredAuthToken = () => getStorage()?.getItem(AUTH_TOKEN_KEY) ?? "";

export const setStoredAuthToken = (token: string) => {
  getStorage()?.setItem(AUTH_TOKEN_KEY, token);
};

export const clearStoredAuthToken = () => {
  getStorage()?.removeItem(AUTH_TOKEN_KEY);
};

const getDefaultErrorMessage = (response: Response) => {
  if (response.status === 413) {
    return "Uploaded profile data is too large. Use fewer or smaller images and try again.";
  }

  return response.statusText ? `Request failed: ${response.status} ${response.statusText}.` : "Request failed.";
};

export const apiRequest = async <T,>(path: string, options: RequestOptions = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
  };

  const token = options.token ?? getStoredAuthToken();

  if (!options.skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const rawText = await response.text();
  const data = rawText ? (JSON.parse(rawText) as T & ApiResponseWithMessage) : ({} as T & ApiResponseWithMessage);

  if (!response.ok) {
    throw new Error(
      typeof data.message === "string" && data.message.trim() ? data.message : getDefaultErrorMessage(response),
    );
  }

  return data;
};

export const authRequest = <T,>(path: string, options: RequestOptions = {}) =>
  apiRequest<T>(`/api/auth/${path}`, options);
