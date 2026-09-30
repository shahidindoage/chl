import { z } from "zod";

export const standingsRowSchema = z.object({
  position: z.number().int(),
  teamId: z.string().uuid(),
  teamName: z.string(),
  shortName: z.string(),
  logo: z.string().nullable(),
  color1: z.string(),
  played: z.number().int(),
  won: z.number().int(),
  drawn: z.number().int(),
  lost: z.number().int(),
  goalsFor: z.number().int(),
  goalsAgainst: z.number().int(),
  goalDifference: z.number().int(),
  points: z.number().int(),
});
export type StandingsRow = z.infer<typeof standingsRowSchema>;

export const standingsSchema = z.object({
  tournamentId: z.string().uuid(),
  tournamentName: z.string(),
  season: z.string(),
  generatedAt: z.string().datetime(),
  rows: z.array(standingsRowSchema),
});
export type StandingsDto = z.infer<typeof standingsSchema>;

export const standingsParamsSchema = z.object({
  tournamentId: z.string().uuid("Tournament id must be a UUID"),
});
