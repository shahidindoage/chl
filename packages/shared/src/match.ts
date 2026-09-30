import { z } from "zod";

export const MATCH_STATUSES = ["upcoming", "live", "completed", "cancelled"] as const;
export type MatchStatusName = (typeof MATCH_STATUSES)[number];

export const MATCH_EVENT_TYPES = [
  "goal",
  "penalty",
  "card",
  "substitution",
  "period_start",
  "period_end",
  "other",
] as const;
export type MatchEventTypeName = (typeof MATCH_EVENT_TYPES)[number];

/** Lightweight team/venue/player info embedded in match responses. */
export const matchTeamInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  shortName: z.string(),
  logo: z.string().nullable(),
  color1: z.string(),
});
export type MatchTeamInfo = z.infer<typeof matchTeamInfoSchema>;

export const matchVenueInfoSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  city: z.string(),
});
export type MatchVenueInfo = z.infer<typeof matchVenueInfoSchema>;

export const matchEventSchema = z.object({
  id: z.string().uuid(),
  matchId: z.string().uuid(),
  eventType: z.enum(MATCH_EVENT_TYPES),
  teamId: z.string().uuid().nullable(),
  teamName: z.string().nullable(),
  playerId: z.string().uuid().nullable(),
  playerName: z.string().nullable(),
  minute: z.number().int(),
  description: z.string().nullable(),
  createdAt: z.string().datetime(),
});
export type MatchEventDto = z.infer<typeof matchEventSchema>;

export const matchSchema = z.object({
  id: z.string().uuid(),
  tournamentId: z.string().uuid(),
  teamAId: z.string().uuid(),
  teamBId: z.string().uuid(),
  venueId: z.string().uuid().nullable(),
  date: z.string().datetime(),
  status: z.enum(MATCH_STATUSES),
  teamAScore: z.number().int(),
  teamBScore: z.number().int(),
  currentMinute: z.number().int().nullable(),
  currentPeriod: z.string().nullable(),
  isPaused: z.boolean(),
  summary: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  // Embedded for convenient rendering (service fills these on every response).
  teamA: matchTeamInfoSchema,
  teamB: matchTeamInfoSchema,
  venue: matchVenueInfoSchema.nullable(),
});
export type MatchDto = z.infer<typeof matchSchema>;

export const matchDetailSchema = matchSchema.extend({
  events: z.array(matchEventSchema),
});
export type MatchDetailDto = z.infer<typeof matchDetailSchema>;

const matchFields = {
  tournamentId: z.string().uuid(),
  teamAId: z.string().uuid(),
  teamBId: z.string().uuid(),
  venueId: z.string().uuid().nullish(),
  date: z.coerce.date(),
  status: z.enum(MATCH_STATUSES),
};

export const createMatchSchema = z.object(matchFields).refine(
  (d) => d.teamAId !== d.teamBId,
  { message: "A team cannot play itself", path: ["teamBId"] }
);
export interface CreateMatchInput {
  tournamentId: string;
  teamAId: string;
  teamBId: string;
  venueId?: string | null;
  date: Date | string;
  status: MatchStatusName;
}

export const updateMatchSchema = z.object(matchFields).refine(
  (d) => d.teamAId !== d.teamBId,
  { message: "A team cannot play itself", path: ["teamBId"] }
);
export type UpdateMatchInput = CreateMatchInput;

/** Manual result entry (upcoming/completed only — live is Module 5's territory). */
export const updateResultSchema = z.object({
  teamAScore: z.coerce.number().int().min(0).max(100),
  teamBScore: z.coerce.number().int().min(0).max(100),
  summary: z.string().trim().max(2000).nullish(),
});
export type UpdateResultInput = z.infer<typeof updateResultSchema>;

export const matchIdParamsSchema = z.object({
  id: z.string().uuid("Match id must be a UUID"),
});

export const listMatchesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(MATCH_STATUSES).optional(),
  teamId: z.string().uuid().optional(),
  tournamentId: z.string().uuid().optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});
export type ListMatchesQuery = z.infer<typeof listMatchesQuerySchema>;

/** Events: add via body on the timeline editor. */
export const addMatchEventSchema = z.object({
  eventType: z.enum(MATCH_EVENT_TYPES),
  teamId: z.string().uuid().nullish(),
  playerId: z.string().uuid().nullish(),
  minute: z.coerce.number().int().min(0).max(200),
  description: z.string().trim().max(500).nullish(),
});
export type AddMatchEventInput = z.infer<typeof addMatchEventSchema>;

export const matchEventParamsSchema = z.object({
  eventId: z.string().uuid("Event id must be a UUID"),
});
