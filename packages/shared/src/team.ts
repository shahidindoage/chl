import { z } from "zod";

const hexColor = /^#[0-9a-fA-F]{6}$/;

export const teamSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  shortName: z.string(),
  logo: z.string().nullable(),
  color1: z.string(),
  color2: z.string().nullable(),
  tournamentId: z.string().uuid(),
  coachName: z.string().nullable(),
  coachImage: z.string().nullable(),
  ownerId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TeamDto = z.infer<typeof teamSchema>;

export const sponsorSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  logo: z.string().nullable(),
  teamId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type SponsorDto = z.infer<typeof sponsorSchema>;

export const teamWithSponsorsSchema = teamSchema.extend({
  sponsors: z.array(sponsorSchema),
});
export type TeamWithSponsorsDto = z.infer<typeof teamWithSponsorsSchema>;

const teamFields = {
  name: z.string().trim().min(2).max(120),
  shortName: z
    .string()
    .trim()
    .min(2)
    .max(8)
    .regex(/^[A-Za-z0-9]+$/, "Short name: 2-8 letters/numbers only"),
  logo: z.string().trim().max(500).nullish(),
  color1: z.string().trim().regex(hexColor, "Must be a hex color like #0a6cc2"),
  color2: z.string().trim().regex(hexColor, "Must be a hex color like #ffffff").nullish(),
  tournamentId: z.string().uuid("Tournament id must be a UUID"),
  coachName: z.string().trim().max(120).nullish(),
  coachImage: z.string().trim().max(500).nullish(),
  ownerId: z.string().uuid().nullish(),
};

export const createTeamSchema = z.object({
  ...teamFields,
  // Unique-per-tournament enforced in the service via DB constraint.
});
export type CreateTeamInput = {
  name: string;
  shortName: string;
  logo?: string | null;
  color1: string;
  color2?: string | null;
  tournamentId: string;
  coachName?: string | null;
  coachImage?: string | null;
  ownerId?: string | null;
};

export const updateTeamSchema = z.object(teamFields);
export type UpdateTeamInput = CreateTeamInput;

export const listTeamsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  tournamentId: z.string().uuid().optional(),
});
export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;

export const teamIdParamsSchema = z.object({
  id: z.string().uuid("Team id must be a UUID"),
});

export const createSponsorSchema = z.object({
  name: z.string().trim().min(2).max(120),
  logo: z.string().trim().max(500).nullish(),
});
export type CreateSponsorInput = z.infer<typeof createSponsorSchema>;

export const updateSponsorSchema = createSponsorSchema;
export type UpdateSponsorInput = z.infer<typeof updateSponsorSchema>;

export const sponsorParamsSchema = z.object({
  sponsorId: z.string().uuid("Sponsor id must be a UUID"),
});
