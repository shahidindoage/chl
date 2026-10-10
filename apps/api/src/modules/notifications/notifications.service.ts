import webpush from "web-push";

import { env, isPushEnabled } from "../../core/config/env.js";
import { childLogger } from "../../core/lib/logger.js";
import * as repo from "./notifications.repository.js";

/**
 * Module 11 — Web Push delivery.
 *
 * Two halves:
 *   - Subscription + follow management (the opt-in), which propagates errors.
 *   - Fan-out to push services, which never throws. A failed notification must
 *     never fail the score update that triggered it.
 */

const log = childLogger({ context: "notifications" });

if (isPushEnabled) {
  webpush.setVapidDetails(env.VAPID_SUBJECT, env.VAPID_PUBLIC_KEY, env.VAPID_PRIVATE_KEY);
}

/* ---------------- Subscription + follow management ---------------- */

export interface Actor {
  id: string;
}

export async function subscribeUser(
  userId: string,
  data: { endpoint: string; p256dh: string; auth: string; userAgent: string | null }
): Promise<{ subscribed: true }> {
  await repo.upsertSubscription({ userId, ...data });
  return { subscribed: true };
}

export async function unsubscribeUser(userId: string, endpoint?: string | null): Promise<{ removed: number }> {
  // No endpoint means "turn this device off"; with one it's a targeted delete.
  const result: { count: number } = endpoint
    ? await repo.deleteSubscriptionByEndpoint(endpoint)
    : await repo.deleteSubscriptionsForUser(userId);
  return { removed: result.count };
}

export async function followTeam(userId: string, teamId: string): Promise<{ following: true }> {
  await repo.followTeam(userId, teamId);
  return { following: true };
}

export async function unfollowTeam(userId: string, teamId: string): Promise<{ following: false }> {
  await repo.unfollowTeam(userId, teamId);
  return { following: false };
}

export async function listFollowedTeams(userId: string): Promise<string[]> {
  return repo.listFollowedTeamIds(userId);
}

/** Public key + capability flags the browser needs before it can subscribe. */
export function getPushConfig(): {
  enabled: boolean;
  publicKey: string;
  supported: "requires-service-worker";
} {
  return {
    enabled: isPushEnabled,
    publicKey: env.VAPID_PUBLIC_KEY,
    // A service worker is mandatory for push — the browser cannot be asked
    // before one exists, so the UI checks this first.
    supported: "requires-service-worker",
  };
}

/* ---------------- Delivery ---------------- */

export interface PushPayload {
  title: string;
  body: string;
  url: string;
  matchId: string;
  /** Replaces the previous notification for the same match instead of stacking. */
  tag: string;
}

export interface FanOutResult {
  recipients: number;
  sent: number;
  failed: number;
  /** Endpoints the push service reported dead — now deleted. */
  pruned: number;
}

/**
 * Runs `worker` over `items` with at most `env.PUSH_CONCURRENCY` in flight.
 * A plain Promise.all would open one socket per subscriber at once.
 */
async function withConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const item = items[cursor++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

/**
 * Sends to every subscription belonging to the users following either team.
 * Fire-and-forget — returns void and logs its own failures.
 */
export async function notifyMatchFans(input: {
  matchId: string;
  teamIds: string[];
  payload: PushPayload;
}): Promise<void> {
  if (!isPushEnabled) return;

  const userIds = await repo.listFollowerUserIds(input.teamIds);
  if (userIds.length === 0) return;

  const subscriptions = await repo.listSubscriptionsForUsers(userIds);
  if (subscriptions.length === 0) return;

  const body = JSON.stringify(input.payload);
  let sent = 0;
  let failed = 0;
  const deadEndpoints: string[] = [];

  await withConcurrency(subscriptions, env.PUSH_CONCURRENCY, async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body
      );
      sent += 1;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      failed += 1;
      // 404/410 mean the browser dropped the subscription for good. Anything
      // else is transient (429, 5xx) and must NOT delete the row.
      if (statusCode === 404 || statusCode === 410) {
        deadEndpoints.push(sub.endpoint);
      } else {
        log.warn("push send failed", {
          matchId: input.matchId,
          statusCode,
          message: (err as Error).message,
        });
      }
    }
  });

  if (deadEndpoints.length > 0) {
    await repo.deleteSubscriptionByEndpoint(deadEndpoints[0]).catch(() => undefined);
    for (const endpoint of deadEndpoints.slice(1)) {
      await repo.deleteSubscriptionByEndpoint(endpoint).catch(() => undefined);
    }
  }

  log.info("push fan-out complete", {
    matchId: input.matchId,
    tag: input.payload.tag,
    recipients: subscriptions.length,
    sent,
    failed,
    pruned: deadEndpoints.length,
  });
}

export interface MatchForNotification {
  id: string;
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
}

function matchUrl(matchId: string): string {
  return `/matches/${matchId}/live`;
}

/** Kickoff — always sent when a match goes live. */
export async function notifyMatchStarted(match: MatchForNotification): Promise<void> {
  await notifyMatchFans({
    matchId: match.id,
    teamIds: [match.teamAId, match.teamBId],
    payload: {
      title: "Match live now",
      body: `${match.teamAName} vs ${match.teamBName} is under way`,
      url: matchUrl(match.id),
      matchId: match.id,
      tag: `match-${match.id}`,
    },
  });
}

/**
 * Goal notifications use a lead-change rule: a goal is only worth interrupting
 * someone for if it changed who is winning. A 3-1 goal that leaves the same
 * team ahead tells a follower nothing they don't already know, and six of those
 * in one match is what makes fans mute a site for good.
 */
function leadChanged(
  before: { a: number; b: number },
  after: { a: number; b: number }
): boolean {
  const leader = (s: { a: number; b: number }) => Math.sign(s.a - s.b);
  return leader(before) !== leader(after);
}

export async function notifyGoalScored(
  match: MatchForNotification,
  before: { a: number; b: number }
): Promise<void> {
  if (!leadChanged(before, { a: match.teamAScore, b: match.teamBScore })) return;

  const leaderName = match.teamAScore === match.teamBScore
    ? null
    : match.teamAScore > match.teamBScore
      ? match.teamAName
      : match.teamBName;

  const body = leaderName
    ? `${leaderName} lead ${match.teamAScore}-${match.teamBScore}`
    : `Level at ${match.teamAScore}-${match.teamBScore}`;

  await notifyMatchFans({
    matchId: match.id,
    teamIds: [match.teamAId, match.teamBId],
    payload: {
      title: "Goal!",
      body: `${match.teamAName} ${match.teamAScore} - ${match.teamBScore} ${match.teamBName}. ${body}`,
      url: matchUrl(match.id),
      matchId: match.id,
      // Same tag as kickoff so the score notification replaces it in place
      // rather than stacking under the "match live" one.
      tag: `match-${match.id}`,
    },
  });
}

/** Full time — always sent, regardless of the lead-change rule. */
export async function notifyMatchEnded(match: MatchForNotification): Promise<void> {
  const winner =
    match.teamAScore === match.teamBScore
      ? "Draw"
      : `${match.teamAScore > match.teamBScore ? match.teamAName : match.teamBName} win`;

  await notifyMatchFans({
    matchId: match.id,
    teamIds: [match.teamAId, match.teamBId],
    payload: {
      title: "Full time",
      body: `${winner} — ${match.teamAName} ${match.teamAScore}-${match.teamBScore} ${match.teamBName}`,
      url: `/matches/${match.id}`,
      matchId: match.id,
      tag: `match-${match.id}`,
    },
  });
}

/** True when both VAPID keys are configured — used by the health endpoint. */
export function pushEnabled(): boolean {
  return isPushEnabled;
}

/**
 * Send a test notification to the caller's own devices.
 *
 * Not the same code path as a match: it bypasses the follow check so a fan can
 * confirm delivery even before following anything. Uses the same push service,
 * so if this arrives the problem is in the browser, and if it doesn't the
 * problem is in the subscription or VAPID setup.
 */
export async function sendTestNotification(userId: string): Promise<{
  delivered: boolean;
  recipients: number;
  sent: number;
  failed: number;
  pruned: number;
  reason?: string;
}> {
  if (!isPushEnabled) {
    return { delivered: false, recipients: 0, sent: 0, failed: 0, pruned: 0, reason: "push is not configured on the server" };
  }

  const subscriptions = await repo.listSubscriptionsForUsers([userId]);
  if (subscriptions.length === 0) {
    return {
      delivered: false,
      recipients: 0,
      sent: 0,
      failed: 0,
      pruned: 0,
      reason: "no push subscription is saved for this account",
    };
  }

  const body = JSON.stringify({
    title: "Notifications are working",
    body: "You will get one of these when a team you follow goes live.",
    url: "/",
    matchId: "test",
    tag: "chl-test",
  } satisfies PushPayload);

  let sent = 0;
  let failed = 0;
  const deadEndpoints: string[] = [];

  await withConcurrency(subscriptions, env.PUSH_CONCURRENCY, async (sub) => {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        body
      );
      sent += 1;
    } catch (err) {
      const statusCode = (err as { statusCode?: number }).statusCode;
      failed += 1;
      if (statusCode === 404 || statusCode === 410) {
        deadEndpoints.push(sub.endpoint);
      } else {
        log.warn("test push failed", { statusCode, message: (err as Error).message });
      }
    }
  });

  if (deadEndpoints.length > 0) {
    await repo.deleteSubscriptionByEndpoint(deadEndpoints[0]).catch(() => undefined);
    for (const endpoint of deadEndpoints.slice(1)) {
      await repo.deleteSubscriptionByEndpoint(endpoint).catch(() => undefined);
    }
  }

  return { delivered: sent > 0, recipients: subscriptions.length, sent, failed, pruned: deadEndpoints.length };
}