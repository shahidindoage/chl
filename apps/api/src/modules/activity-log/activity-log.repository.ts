import type { ActivityLog, Prisma, Role } from "@prisma/client";

import { prisma } from "../../core/lib/prisma.js";

/**
 * The ONLY file allowed to touch prisma.ActivityLog (Section 2 rule 2).
 * User display info arrives via the auth service, never a join here.
 */

export type ActivityLogRow = ActivityLog;

export type CreateActivityLogData = {
  userId: string | null;
  userName: string | null;
  userRole: Role | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: Prisma.InputJsonValue | undefined;
  ipAddress: string | null;
};

export function createActivityLog(data: CreateActivityLogData): Promise<ActivityLogRow> {
  return prisma.activityLog.create({ data });
}

export function listActivityLogs(params: {
  skip: number;
  take: number;
  action?: string;
  entity?: string;
  userId?: string;
  since?: Date;
}): Promise<{ items: ActivityLogRow[]; total: number }> {
  const { skip, take, action, entity, userId, since } = params;
  const where: Prisma.ActivityLogWhereInput = {
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(userId ? { userId } : {}),
    ...(since ? { createdAt: { gte: since } } : {}),
  };

  return Promise.all([
    prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    prisma.activityLog.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}

/** Distinct actions + entities present in the log, for the viewer's filter UI. */
export function getActivityFacets(): Promise<{ actions: string[]; entities: string[] }> {
  return Promise.all([
    prisma.activityLog.findMany({ distinct: ["action"], select: { action: true } }),
    prisma.activityLog.findMany({ distinct: ["entity"], select: { entity: true } }),
  ]).then(([actions, entities]) => ({
    actions: actions.map((a) => a.action).sort(),
    entities: entities.map((e) => e.entity).sort(),
  }));
}