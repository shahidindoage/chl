import type { Request, Response } from "express";

import { ApiError } from "../../core/utils/ApiError.js";
import { audit } from "../activity-log/activity-log.service.js";
import type { pushSubscriptionSchema } from "./notifications.schema.js";
import { resolveSubscriptionKeys } from "./notifications.schema.js";
import * as service from "./notifications.service.js";

/** Controller: parses req, calls service, shapes response (Section 6). */

function actor(req: Request): service.Actor {
  if (!req.user) throw ApiError.unauthorized();
  return { id: req.user.id };
}

export async function subscribe(req: Request, res: Response): Promise<void> {
  const { id: userId } = actor(req);
  const body = req.body as ReturnType<typeof pushSubscriptionSchema.parse>;
  const keys = resolveSubscriptionKeys(body);
  if (!keys) {
    throw ApiError.badRequest("Subscription is missing its keys (p256dh and auth)");
  }
  await service.subscribeUser(userId, {
    endpoint: body.endpoint,
    ...keys,
    userAgent: body.userAgent ?? null,
  });
  audit(req, {
    action: "notification.subscribe",
    entity: "push_subscription",
    // The endpoint is a long opaque browser URL, so only its host is recorded.
    metadata: { host: safeHost(body.endpoint), userAgent: body.userAgent ?? null },
  });
  res.status(201).json({ subscribed: true });
}

/** Never log a full push endpoint — it identifies one specific browser. */
function safeHost(endpoint: string): string | null {
  try {
    return new URL(endpoint).host;
  } catch {
    return null;
  }
}

export async function unsubscribe(req: Request, res: Response): Promise<void> {
  const { id: userId } = actor(req);
  const endpoint = typeof req.body?.endpoint === "string" ? req.body.endpoint : null;
  const result = await service.unsubscribeUser(userId, endpoint);
  audit(req, {
    action: "notification.unsubscribe",
    entity: "push_subscription",
    metadata: { removed: result.removed, targeted: endpoint !== null },
  });
  res.status(200).json(result);
}

export async function getConfig(_req: Request, res: Response): Promise<void> {
  res.status(200).json(service.getPushConfig());
}

export async function getFollows(req: Request, res: Response): Promise<void> {
  const { id: userId } = actor(req);
  const teamIds = await service.listFollowedTeams(userId);
  res.status(200).json({ teamIds });
}

export async function follow(req: Request, res: Response): Promise<void> {
  const { id: userId } = actor(req);
  const { teamId } = req.params as { teamId: string };
  const result = await service.followTeam(userId, teamId);
  audit(req, { action: "team.follow", entity: "team", entityId: teamId });
  res.status(200).json(result);
}

export async function unfollow(req: Request, res: Response): Promise<void> {
  const { id: userId } = actor(req);
  const { teamId } = req.params as { teamId: string };
  const result = await service.unfollowTeam(userId, teamId);
  audit(req, { action: "team.unfollow", entity: "team", entityId: teamId });
  res.status(200).json(result);
}

/**
 * Fire-and-check endpoint for local testing. Returns exactly what the push
 * service said, so a browser-side problem can be told apart from a server one.
 */
export async function sendTest(req: Request, res: Response): Promise<void> {
  const { id: userId } = actor(req);
  const result = await service.sendTestNotification(userId);
  res.status(result.delivered ? 200 : 400).json(result);
}