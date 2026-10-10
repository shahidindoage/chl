import type { Role, User } from "@prisma/client";

import { prisma } from "../../core/lib/prisma.js";

/**
 * The ONLY file allowed to touch prisma.User / prisma.OtpCode
 * (Section 2 rule 2, Section 6).
 */

export function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export function createUser(data: {
  email: string;
  name: string;
  phone?: string | null;
  role?: Role;
  isVerified?: boolean;
  password?: string | null;
}): Promise<User> {
  return prisma.user.create({ data });
}

export function updateUser(
  id: string,
  data: { name?: string; phone?: string | null; password?: string | null }
): Promise<User> {
  return prisma.user.update({ where: { id }, data });
}

export function setUserVerified(id: string): Promise<User> {
  return prisma.user.update({ where: { id }, data: { isVerified: true } });
}

export function setUserRole(id: string, role: Role): Promise<User> {
  return prisma.user.update({ where: { id }, data: { role } });
}

export function deleteUser(id: string): Promise<User> {
  return prisma.user.delete({ where: { id } });
}

export function countSuperAdmins(): Promise<number> {
  return prisma.user.count({ where: { role: "super_admin" } });
}

export function listUsers(params: {
  skip: number;
  take: number;
}): Promise<{ items: User[]; total: number }> {
  // Plain parallel queries instead of interactive $transaction — no
  // dedicated pooled connection required, so it can't hit the
  // transaction-start timeout.
  return Promise.all([
    prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.count(),
  ]).then(([items, total]) => ({ items, total }));
}

/** Dashboard aggregate — read by the admin module via authService (rule 2). */
export function countUsers(filter?: { role?: Role }): Promise<number> {
  return prisma.user.count({ where: filter?.role ? { role: filter.role } : {} });
}

/** Newest signups, for the dashboard's "recent users" panel. */
type RecentUserRow = Pick<User, "id" | "name" | "email" | "role" | "createdAt">;

export function findRecentUsers(limit: number): Promise<RecentUserRow[]> {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });
}

export function countRecentOtpForEmail(email: string, since: Date): Promise<number> {
  return prisma.otpCode.count({ where: { email, createdAt: { gte: since } } });
}

export function createOtpCode(data: {
  email: string;
  codeHash: string;
  expiresAt: Date;
}): Promise<{ id: string }> {
  return prisma.otpCode.create({ data, select: { id: true } });
}

export function findLatestActiveOtp(email: string, now: Date) {
  return prisma.otpCode.findFirst({
    where: { email, consumedAt: null, expiresAt: { gt: now } },
    orderBy: { createdAt: "desc" },
  });
}

export function markOtpConsumed(id: string, userId: string): Promise<unknown> {
  return prisma.otpCode.update({
    where: { id },
    data: { consumedAt: new Date(), userId },
    select: { id: true },
  });
}

export function incrementOtpAttempts(id: string): Promise<unknown> {
  return prisma.otpCode.update({
    where: { id },
    data: { attempts: { increment: 1 } },
    select: { id: true },
  });
}

export function invalidateEmailOtps(email: string): Promise<unknown> {
  return prisma.otpCode.updateMany({
    where: { email, consumedAt: null },
    data: { consumedAt: new Date() },
  });
}
