import { z } from "zod";

/**
 * Module 10 — Zod input schemas for the activity log and admin dashboard.
 * Body/query/params live here so `validate()` can reuse them (Section 6).
 */

/** Dotted action verb, e.g. "team.create", "match.result.update". */
export const actionNameSchema = z
  .string()
  .trim()
  .min(3, "Action is required")
  .max(80)
  .regex(/^[a-z][a-z0-9-]*(\.[a-z][a-z0-9-]*)+$/, "Action must be dotted lowercase, e.g. team.create");

/** Entity kind the action targeted, e.g. "team", "match", "article". */
export const entityNameSchema = z
  .string()
  .trim()
  .min(2, "Entity is required")
  .max(40)
  .regex(/^[a-z][a-z0-9-]*$/, "Entity must be a single lowercase word");

/**
 * Metadata is a small context blob for the log viewer — ids, changed field
 * names, counts. Callers must never pass secrets, tokens or raw bodies.
 */
export const activityMetadataSchema = z.record(z.unknown());

export const logActivitySchema = z.object({
  action: actionNameSchema,
  entity: entityNameSchema,
  entityId: z.string().trim().max(100).nullish(),
  metadata: activityMetadataSchema.optional(),
});

export const listActivityLogsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  /** Exact action or entity filter, plus a free-text match on either. */
  action: actionNameSchema.optional(),
  entity: entityNameSchema.optional(),
  userId: z.string().uuid("User id must be a UUID").optional(),
  /** ISO timestamp lower bound — narrows the "recent activity" dashboard feed. */
  since: z.coerce.date().optional(),
});

export type LogActivityInput = z.infer<typeof logActivitySchema>;
export type ListActivityLogsQuery = z.infer<typeof listActivityLogsQuerySchema>;