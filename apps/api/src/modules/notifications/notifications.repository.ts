import { prisma } from "../../core/lib/prisma.js";

/**
 * The ONLY file allowed to touch prisma.PushSubscription / prisma.TeamFollow
 * (Section 2 rule 2).
 *
 * Match and Team details are never joined here — callers use the match and team
 * services, so this module stays ignorant of other modules' models.
 */

export type PushSubscriptionRow = {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export function upsertSubscription(data: {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
}): Promise<PushSubscriptionRow> {
  // endpoint is @unique, so a browser that re-subscribes updates in place
  // instead of creating a duplicate row for the same device.
  return prisma.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    create: data,
    update: {
      // Re-attach to whoever currently owns it — the key rotation and the
      // session may not match the row that was there before.
      userId: data.userId,
      p256dh: data.p256dh,
      auth: data.auth,
      userAgent: data.userAgent,
    },
    select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true },
  });
}

export function deleteSubscriptionByEndpoint(endpoint: string): Promise<{ count: number }> {
  return prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export function deleteSubscriptionsForUser(userId: string): Promise<{ count: number }> {
  return prisma.pushSubscription.deleteMany({ where: { userId } });
}

/** Every subscription for a set of users — the fan-out list for one match. */
export function listSubscriptionsForUsers(userIds: string[]): Promise<PushSubscriptionRow[]> {
  if (userIds.length === 0) return Promise.resolve([]);
  return prisma.pushSubscription.findMany({
    where: { userId: { in: userIds } },
    select: { id: true, userId: true, endpoint: true, p256dh: true, auth: true },
  });
}

export function countSubscriptions(): Promise<number> {
  return prisma.pushSubscription.count();
}

/* ---------------- Team follows ---------------- */

/** Team ids the user follows — used to work out who to notify for a match. */
export function listFollowedTeamIds(userId: string): Promise<string[]> {
  return prisma.teamFollow.findMany({ where: { userId }, select: { teamId: true } }).then((rows) =>
    rows.map((r) => r.teamId)
  );
}

/** Distinct user ids following any of these teams. */
export function listFollowerUserIds(teamIds: string[]): Promise<string[]> {
  if (teamIds.length === 0) return Promise.resolve([]);
  return prisma.teamFollow.findMany({
    where: { teamId: { in: teamIds } },
    select: { userId: true },
    distinct: ["userId"],
  }).then((rows) => rows.map((r) => r.userId));
}

export function followTeam(userId: string, teamId: string): Promise<{ created: boolean }> {
  return prisma.teamFollow
    .create({ data: { userId, teamId } })
    .then(() => ({ created: true }))
    .catch((err: unknown) => {
      // Already following is a success from the caller's point of view.
      if ((err as { code?: string }).code === "P2002") return { created: false };
      throw err;
    });
}

export function unfollowTeam(userId: string, teamId: string): Promise<{ count: number }> {
  return prisma.teamFollow.deleteMany({ where: { userId, teamId } });
}

export function countTeamFollows(teamId: string): Promise<number> {
  return prisma.teamFollow.count({ where: { teamId } });
}