import { createHash, randomInt } from "node:crypto";

import type { Role } from "@tournament/shared";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../../core/config/env.js";
import { cacheDel, cacheGetJson, cacheSetJson } from "../../core/lib/redis.js";
import { sendMail } from "../../core/lib/mailer.js";
import { logger } from "../../core/lib/logger.js";
import { ApiError } from "../../core/utils/ApiError.js";
import type {
  AuthResponse,
  AuthTokens,
  AuthUser,
  ConfirmSignUpInput,
  ResendOtpInput,
  SignInInput,
  SignUpInput,
} from "./auth.schema.js";
import * as repo from "./auth.repository.js";

const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_WINDOW_MS = 15 * 60 * 1000;
const OTP_RESEND_LIMIT = 5;
const BCRYPT_ROUNDS = 10;

interface UserWithPassword {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  isVerified: boolean;
  password: string | null;
  createdAt: Date;
}

function hashOtp(email: string, code: string): string {
  return createHash("sha256").update(`${email}:${code}:${env.JWT_SECRET}`).digest("hex");
}

function toAuthUser(user: {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  isVerified: boolean;
  createdAt: Date;
}): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    isVerified: user.isVerified,
    createdAt: user.createdAt.toISOString(),
  };
}

function issueTokens(user: { id: string; email: string; role: Role }): AuthTokens {
  const token = jwt.sign({ email: user.email, role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    issuer: "tournament-api",
    audience: "tournament-clients",
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
  return { token, tokenType: "Bearer", expiresIn: env.JWT_EXPIRES_IN };
}

const USER_CACHE_PREFIX = "auth:user:";

async function getCachedUser(id: string) {
  return cacheGetJson<AuthUser | null>(`${USER_CACHE_PREFIX}${id}`);
}

async function cacheUser(user: AuthUser): Promise<void> {
  await cacheSetJson(`${USER_CACHE_PREFIX}${user.id}`, user, 300);
}

async function issueAndDeliverOtp(email: string): Promise<{ sent: true; expiresInSeconds: number }> {
  const windowStart = new Date(Date.now() - OTP_RESEND_WINDOW_MS);
  const recent = await repo.countRecentOtpForEmail(email, windowStart);
  if (recent >= OTP_RESEND_LIMIT) {
    throw ApiError.tooManyRequests("Too many OTP requests for this email. Try again later.");
  }

  const code = String(randomInt(100_000, 1_000_000));
  await repo.createOtpCode({
    email,
    codeHash: hashOtp(email, code),
    expiresAt: new Date(Date.now() + OTP_TTL_MS),
  });

  await sendMail({
    to: email,
    subject: "Confirm your tournament platform account",
    text: `Your verification code is ${code}. It expires in ${OTP_TTL_MS / 60_000} minutes. If you didn't request it, ignore this email.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in ${OTP_TTL_MS / 60_000} minutes. If you didn't request it, ignore this email.</p>`,
  });
  logger.info(`otp sent to ${email}`);

  return { sent: true, expiresInSeconds: OTP_TTL_MS / 1000 };
}

/**
 * Fan sign-up: name + email + phone + password.
 * Creates (or updates a pending) unverified account and emails the OTP.
 * Sign-in afterwards is email + password only — no OTP.
 */
export async function signUp(input: SignUpInput): Promise<{ sent: true; expiresInSeconds: number }> {
  const { name, email, phone, password } = input;

  const existing = await repo.findUserByEmail(email);
  if (existing && existing.isVerified) {
    // Don't reveal whether the account exists + is verified in a guessable way,
    // but for sign-up UX the honest message is the useful one.
    throw ApiError.conflict("An account with this email already exists. Sign in instead.");
  }

  const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
  if (existing) {
    // Pending sign-up: refresh details + password, then resend OTP.
    await repo.updateUser(existing.id, { name, phone, password: hash });
  } else {
    await repo.createUser({ email, name, phone, password: hash, role: "fan", isVerified: false });
  }

  return issueAndDeliverOtp(email);
}

/** Resend the OTP for a pending (unverified) sign-up. */
export async function resendOtp(input: ResendOtpInput): Promise<{ sent: true; expiresInSeconds: number }> {
  const user = await repo.findUserByEmail(input.email);
  if (!user || user.isVerified) {
    throw ApiError.notFound("No pending sign-up for this email");
  }
  return issueAndDeliverOtp(input.email);
}

/** Confirm sign-up with the emailed OTP — verifies the account and issues the JWT. */
export async function confirmSignUp(input: ConfirmSignUpInput): Promise<AuthResponse> {
  const { email, code } = input;

  const user = await repo.findUserByEmail(email);
  if (!user) throw ApiError.badRequest("Start the sign-up first — no account for this email.");
  if (user.isVerified) throw ApiError.badRequest("This account is already verified. Sign in instead.");

  const otp = await repo.findLatestActiveOtp(email, new Date());
  if (!otp) {
    throw ApiError.badRequest("OTP not found or expired. Resend the code.");
  }
  if (otp.attempts >= OTP_MAX_ATTEMPTS) {
    await repo.invalidateEmailOtps(email);
    throw ApiError.tooManyRequests("Too many incorrect attempts. Request a new code.");
  }

  if (hashOtp(email, code) !== otp.codeHash) {
    await repo.incrementOtpAttempts(otp.id);
    throw ApiError.badRequest("Incorrect OTP code.");
  }

  await repo.markOtpConsumed(otp.id, user.id);
  const verified = await repo.setUserVerified(user.id);

  const authUser = toAuthUser(verified);
  await cacheUser(authUser);
  return { user: authUser, tokens: issueTokens(verified) };
}

/**
 * Sign in — email + password, no OTP. Used by fans and staff/admin roles
 * (replaces the old separate admin login; role comes from the user record).
 */
export async function signIn(input: SignInInput): Promise<AuthResponse> {
  const { email, password } = input;

  const user = await repo.findUserByEmail(email);
  // Same message either way — don't leak account existence (Section 9 security).
  if (!user || !user.password) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    throw ApiError.unauthorized("Invalid email or password");
  }
  if (!user.isVerified) {
    throw ApiError.unauthorized("Please confirm your email with the OTP code first.");
  }

  const authUser = toAuthUser(user);
  await cacheUser(authUser);
  return { user: authUser, tokens: issueTokens(user) };
}

/** Cross-module lookup for seeds/services: email -> AuthUser or null. */
export async function findUserByEmailSafe(email: string): Promise<AuthUser | null> {
  const user = await repo.findUserByEmail(email);
  return user ? toAuthUser(user) : null;
}

export async function getMe(userId: string): Promise<AuthUser> {  const cached = await getCachedUser(userId);
  if (cached) return cached;

  const user = await repo.findUserById(userId);
  if (!user) throw ApiError.notFound("User not found");

  const authUser = toAuthUser(user);
  await cacheUser(authUser);
  return authUser;
}

export async function listUsers(page: number, limit: number): Promise<{
  items: AuthUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const { items, total } = await repo.listUsers({
    skip: (page - 1) * limit,
    take: limit,
  });
  return {
    items: items.map(toAuthUser),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function updateUserRole(
  targetUserId: string,
  role: Role,
  actor: { id: string; role: Role }
): Promise<AuthUser> {
  const user = await repo.findUserById(targetUserId);
  if (!user) throw ApiError.notFound("User not found");

  // A super_admin locking themselves out would break the whole platform.
  if (user.id === actor.id && user.role === "super_admin" && role !== "super_admin") {
    throw ApiError.badRequest("You cannot remove your own super_admin role");
  }
  // Sign-in requires a password; promoting a passwordless account would lock it out.
  if (role !== "fan" && !user.password) {
    throw ApiError.conflict("This account has no password yet — password login is required for admin roles");
  }

  const updated = await repo.setUserRole(user.id, role);
  await cacheDel(`${USER_CACHE_PREFIX}${user.id}`);
  return toAuthUser(updated);
}

/**
 * super_admin deletes a user account.
 * Guards: no self-delete, and never delete the last super_admin.
 * OtpCode rows for the email are left to expire naturally (FK is SetNull).
 */
export async function deleteUser(targetUserId: string, actor: { id: string }): Promise<{ deleted: true; id: string }> {
  const user = await repo.findUserById(targetUserId);
  if (!user) throw ApiError.notFound("User not found");

  if (user.id === actor.id) {
    throw ApiError.badRequest("You cannot delete your own account");
  }
  if (user.role === "super_admin") {
    const admins = await repo.countSuperAdmins();
    if (admins <= 1) {
      throw ApiError.conflict("Cannot delete the last super_admin account");
    }
  }

  await repo.deleteUser(user.id);
  await cacheDel(`${USER_CACHE_PREFIX}${user.id}`);
  logger.info(`user deleted: ${user.email} by ${actor.id}`);
  return { deleted: true, id: user.id };
}

/** Seed helper: create a user (with bcrypt password if given); backfills missing passwords. */
export async function ensureUser(data: {
  email: string;
  name: string;
  role: Role;
  password?: string;
}): Promise<UserWithPassword> {
  const existing = await repo.findUserByEmail(data.email);
  if (existing) {
    if (data.password && !existing.password) {
      const hash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);
      return repo.updateUser(existing.id, { password: hash });
    }
    return existing;
  }
  const hash = data.password ? await bcrypt.hash(data.password, BCRYPT_ROUNDS) : null;
  const created = await repo.createUser({
    email: data.email,
    name: data.name,
    role: data.role,
    password: hash,
    isVerified: true,
  });
  return created;
}
