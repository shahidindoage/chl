import { z } from "zod";

/**
 * Module 10 — admin dashboard aggregates.
 *
 * Deliberately read-only and small: the counts the plan asks for (teams,
 * matches, users, live matches now) plus the activity feed and upcoming
 * fixtures that give the dashboard something actionable.
 */

/** Roles allowed to read the dashboard. Mirrors the admin shell menu. */
export const DASHBOARD_ROLES = [
  "super_admin",
  "team_owner",
  "content_manager",
  "score_manager",
  "quiz_manager",
] as const;
export type DashboardRole = (typeof DASHBOARD_ROLES)[number];

export const dashboardQuerySchema = z.object({
  /** How many upcoming fixtures to surface. */
  fixtures: z.coerce.number().int().min(1).max(10).default(5),
  /** How many recent audit entries to surface. */
  activity: z.coerce.number().int().min(1).max(25).default(8),
});

export type DashboardQuery = z.infer<typeof dashboardQuerySchema>;