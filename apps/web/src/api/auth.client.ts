import type {
  AuthResponse,
  AuthUser,
  ConfirmSignUpInput,
  ResendOtpInput,
  Role,
  SignInInput,
  SignUpInput,
} from "@tournament/shared";

import { http } from "./client.js";

/**
 * Module 9 — typed functions 1:1 with apps/api/src/modules/auth routes
 * (Section 6 frontend mirror).
 */

export interface PaginatedUsers {
  items: AuthUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function signUp(input: SignUpInput): Promise<{ sent: boolean; expiresInSeconds: number }> {
  const { data } = await http.post("/auth/signup", input);
  return data;
}

export async function resendOtp(input: ResendOtpInput): Promise<{ sent: boolean; expiresInSeconds: number }> {
  const { data } = await http.post("/auth/otp/resend", input);
  return data;
}

export async function confirmSignUp(input: ConfirmSignUpInput): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/auth/signup/confirm", input);
  return data;
}

export async function signIn(input: SignInInput): Promise<AuthResponse> {
  const { data } = await http.post<AuthResponse>("/auth/login", input);
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await http.get<{ user: AuthUser }>("/auth/me");
  return data.user;
}

export async function logout(): Promise<void> {
  await http.post("/auth/logout");
}

export async function listUsers(params: { page: number; limit: number }): Promise<PaginatedUsers> {
  const { data } = await http.get<PaginatedUsers>("/auth/users", { params });
  return data;
}

export async function updateUserRole(userId: string, role: Role): Promise<AuthUser> {
  const { data } = await http.patch<{ user: AuthUser }>(`/auth/users/${userId}/role`, { role });
  return data.user;
}

export async function deleteUser(userId: string): Promise<void> {
  await http.delete(`/auth/users/${userId}`);
}
