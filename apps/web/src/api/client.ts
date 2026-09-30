import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

const TOKEN_KEY = "tournament.token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export const http = axios.create({
  baseURL: API_BASE_URL,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/** Normalizes backend { error: { code, message, details } } (Section 2 rule 4). */
export function apiErrorMessage(error: unknown, fallback = "Something went wrong"): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { error?: { message?: string; details?: Record<string, unknown> } }
      | undefined;
    if (data?.error?.message) {
      const details = data.error.details;
      if (details && typeof details === "object") {
        const msgs = Object.entries(details).flatMap(([field, issues]) =>
          Array.isArray(issues) ? issues.map((m) => `${field}: ${String(m)}`) : []
        );
        if (msgs.length > 0) return `${data.error.message} — ${msgs.join("; ")}`;
      }
      return data.error.message;
    }
  }
  if (error instanceof Error) return error.message;
  return fallback;
}
