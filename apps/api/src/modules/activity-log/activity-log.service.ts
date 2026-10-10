import type { Role } from "@prisma/client";

import { childLogger } from "../../core/lib/logger.js";
import type { ListActivityLogsQuery, LogActivityInput } from "./activity-log.schema.js";
import * as repo from "./activity-log.repository.js";

/**
 * Module 10 — activity log.
 *
 * This is a cross-cutting write helper called from the *controllers* of other
 * modules, so it deliberately exposes a fire-and-forget `logActivity()` rather
 * than being awaited inside a service. A failed audit write must never fail the
 * action it was recording, so errors are logged and swallowed.
 *
 * Reads (the admin log viewer) live here too, and do propagate errors.
 */

const log = childLogger({ context: "activity-log" });

/**
 * Metadata is caller-supplied context (ids, changed field names, counts). It is
 * written as a JSON column, so callers must never pass secrets or raw request
 * bodies here — ids and counts only.
 */
type Metadata = Record<string, unknown>;

export interface ActorSnapshot {
  id: string;
  role: Role;
  name?: string | null;
}

export interface ActivityEntry {
  action: string;
  entity: string;
  entityId?: string | null;
  metadata?: Metadata;
  actor?: ActorSnapshot | null;
  ipAddress?: string | null;
}

/**
 * Append one audit entry. Never throws — if the insert fails, the business
 * action has already succeeded and must not be rolled back by the audit trail.
 */
export function logActivity(entry: ActivityEntry): void {
  const actor = entry.actor ?? null;
  const run = () =>
    repo.createActivityLog({
      userId: actor?.id ?? null,
      userName: actor?.name ?? null,
      userRole: actor?.role ?? null,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      metadata: entry.metadata as never,
      ipAddress: entry.ipAddress ?? null,
    });

  void run().catch((err: unknown) => {
    log.warn("failed to write activity log entry", {
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId,
      err: err instanceof Error ? err.message : String(err),
    });
  });
}

/**
 * Actor snapshot for `req.user`. The JWT claims carry id/role/email but no
 * display name, so the email is used as the snapshot — the log viewer shows
 * something meaningful without a second lookup on every render.
 */
export function actorFromRequest(
  user: { id: string; role: Role; email?: string } | undefined
): ActorSnapshot | null {
  if (!user) return null;
  return { id: user.id, role: user.role, name: user.email ?? null };
}

/** Minimal Request shape this helper needs — avoids importing express types. */
interface AuditableRequest {
  user?: { id: string; role: Role; email?: string } | undefined;
  ip?: string | undefined;
  socket?: { remoteAddress?: string | undefined } | undefined;
}

/**
 * One-line audit call for controllers:
 *
 *   audit(req, { action: "team.create", entity: "team", entityId: team.id });
 *
 * Fire-and-forget — safe to call immediately after a successful service call.
 */
export function audit(
  req: AuditableRequest,
  entry: Omit<ActivityEntry, "actor" | "ipAddress">
): void {
  logActivity({
    ...entry,
    actor: actorFromRequest(req.user),
    ipAddress: req.ip ?? req.socket?.remoteAddress ?? null,
  });
}

export interface ActivityLogDto {
  id: string;
  userId: string | null;
  userName: string | null;
  userRole: Role | null;
  action: string;
  entity: string;
  entityId: string | null;
  metadata: unknown;
  ipAddress: string | null;
  createdAt: string;
}

export function toDto(row: repo.ActivityLogRow): ActivityLogDto {
  return {
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    userRole: row.userRole,
    action: row.action,
    entity: row.entity,
    entityId: row.entityId,
    metadata: row.metadata,
    ipAddress: row.ipAddress,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listActivityLogs(
  query: ListActivityLogsQuery
): Promise<{ items: ActivityLogDto[]; total: number; page: number; limit: number }> {
  const { page, limit, action, entity, userId, since } = query;
  const { items, total } = await repo.listActivityLogs({
    skip: (page - 1) * limit,
    take: limit,
    ...(action ? { action } : {}),
    ...(entity ? { entity } : {}),
    ...(userId ? { userId } : {}),
    ...(since ? { since } : {}),
  });
  return { items: items.map(toDto), total, page, limit };
}

export async function getActivityFacets(): Promise<{ actions: string[]; entities: string[] }> {
  return repo.getActivityFacets();
}

/** Re-exported so controllers get one validated shape for manual entries. */
export type { LogActivityInput };