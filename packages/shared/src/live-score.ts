import { z } from "zod";

export const COMMENTARY_TYPES = ["goal", "penalty", "card", "substitution", "period", "injury", "info", "other"] as const;
export type CommentaryTypeName = (typeof COMMENTARY_TYPES)[number];

export const commentarySchema = z.object({
  id: z.string().uuid(),
  matchId: z.string().uuid(),
  minute: z.number().int(),
  text: z.string(),
  type: z.enum(COMMENTARY_TYPES),
  createdAt: z.string().datetime(),
});
export type CommentaryDto = z.infer<typeof commentarySchema>;

export const publishCommentarySchema = z.object({
  minute: z.coerce.number().int().min(0).max(200),
  text: z.string().trim().min(1, "Commentary text is required").max(500),
  type: z.enum(COMMENTARY_TYPES).default("info"),
});
export type PublishCommentaryInput = z.infer<typeof publishCommentarySchema>;

/** Live scoreboard state — everything a client needs after (re)connecting. */
export const liveStatusSchema = z.object({
  matchId: z.string().uuid(),
  status: z.enum(["upcoming", "live", "completed", "cancelled"]),
  isPaused: z.boolean(),
  currentMinute: z.number().int().nullable(),
  currentPeriod: z.string().nullable(),
  teamAScore: z.number().int(),
  teamBScore: z.number().int(),
  serverTime: z.string().datetime(),
});
export type LiveStatusDto = z.infer<typeof liveStatusSchema>;

/** Control actions: start needs period/minute (default 1 / 0); end can take summary. */
export const startMatchControlSchema = z.object({
  period: z.string().trim().min(1).max(24).default("1st"),
  minute: z.coerce.number().int().min(0).max(200).default(0),
});
export type StartMatchControlInput = z.infer<typeof startMatchControlSchema>;

export const liveScoreSchema = z.object({
  teamAScore: z.coerce.number().int().min(0).max(100),
  teamBScore: z.coerce.number().int().min(0).max(100),
  minute: z.coerce.number().int().min(0).max(200).optional(),
  period: z.string().trim().min(1).max(24).optional(),
});
export type LiveScoreInput = z.infer<typeof liveScoreSchema>;

export const endMatchControlSchema = z.object({
  summary: z.string().trim().max(2000).nullish(),
});
export type EndMatchControlInput = z.infer<typeof endMatchControlSchema>;

export const liveMatchParamsSchema = z.object({
  matchId: z.string().uuid("Match id must be a UUID"),
});
