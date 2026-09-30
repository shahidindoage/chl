import type { Request, Response } from "express";

import type { AuthUser } from "@tournament/shared";

import { ApiError } from "../../core/utils/ApiError.js";
import * as authService from "./auth.service.js";
import type {
  ConfirmSignUpInput,
  ResendOtpInput,
  SignInInput,
  SignUpInput,
  UpdateUserRoleInput,
} from "./auth.schema.js";

/**
 * Controller: parses req, calls service, shapes response —
 * no Prisma, no business logic (Section 6).
 */

export async function signUp(req: Request, res: Response): Promise<void> {
  const body = req.body as SignUpInput;
  const result = await authService.signUp(body);
  res.status(200).json(result);
}

export async function resendOtp(req: Request, res: Response): Promise<void> {
  const body = req.body as ResendOtpInput;
  const result = await authService.resendOtp(body);
  res.status(200).json(result);
}

export async function confirmSignUp(req: Request, res: Response): Promise<void> {
  const body = req.body as ConfirmSignUpInput;
  const result = await authService.confirmSignUp(body);
  res.status(200).json(result);
}

export async function signIn(req: Request, res: Response): Promise<void> {
  const body = req.body as SignInInput;
  const result = await authService.signIn(body);
  res.status(200).json(result);
}

export async function me(req: Request, res: Response): Promise<void> {
  const userId = req.user?.id;
  if (!userId) throw ApiError.unauthorized();
  const user: AuthUser = await authService.getMe(userId);
  res.status(200).json({ user });
}

/** Logout is client-side token discard (Section 8) — endpoint exists for parity + audit. */
export async function logout(_req: Request, res: Response): Promise<void> {
  res.status(200).json({ success: true });
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const result = await authService.listUsers(page, limit);
  res.status(200).json(result);
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { role } = req.body as UpdateUserRoleInput;
  if (!req.user) throw ApiError.unauthorized();
  const user = await authService.updateUserRole(id, role, { id: req.user.id, role: req.user.role });
  res.status(200).json({ user });
}

export async function deleteUser(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  if (!req.user) throw ApiError.unauthorized();
  const result = await authService.deleteUser(id, { id: req.user.id });
  res.status(200).json(result);
}
