import { z } from "zod";

export const TOURNAMENT_FORMATS = ["league", "knockout", "group_knockout"] as const;
export type TournamentFormatName = (typeof TOURNAMENT_FORMATS)[number];

export const TOURNAMENT_STATUSES = ["draft", "upcoming", "ongoing", "completed", "cancelled"] as const;
export type TournamentStatusName = (typeof TOURNAMENT_STATUSES)[number];

export const tournamentSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  season: z.string(),
  format: z.enum(TOURNAMENT_FORMATS),
  rules: z.string().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(TOURNAMENT_STATUSES),
  logo: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type TournamentDto = z.infer<typeof tournamentSchema>;

export const venueSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  address: z.string(),
  city: z.string(),
  capacity: z.number().int().nullable(),
  image: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type VenueDto = z.infer<typeof venueSchema>;

/** name + season must be unique together; dates validated as a pair. */
const tournamentFields = {
  name: z.string().trim().min(2).max(120),
  season: z
    .string()
    .trim()
    .min(2)
    .max(24)
    .regex(/^[\w .\/-]+$/, "Season may contain letters, numbers, spaces, / . - only"),
  format: z.enum(TOURNAMENT_FORMATS),
  rules: z.string().trim().max(20_000).nullish(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  status: z.enum(TOURNAMENT_STATUSES),
  logo: z.string().trim().max(500).nullish(),
  isActive: z.boolean(),
};

export const createTournamentSchema = z
  .object(tournamentFields)
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });

/** Dates arrive as Date or ISO string; validate() coerces to Date server-side. */
export interface TournamentFieldsInput {
  name: string;
  season: string;
  format: TournamentFormatName;
  rules?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  status: TournamentStatusName;
  logo?: string | null;
  isActive: boolean;
}

export type CreateTournamentInput = TournamentFieldsInput;

export const updateTournamentSchema = z
  .object(tournamentFields)
  .refine((d) => d.endDate >= d.startDate, {
    message: "End date must be on or after start date",
    path: ["endDate"],
  });
export type UpdateTournamentInput = TournamentFieldsInput;

export const listTournamentsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(TOURNAMENT_STATUSES).optional(),
});
export type ListTournamentsQuery = z.infer<typeof listTournamentsQuerySchema>;

export const tournamentIdParamsSchema = z.object({
  id: z.string().uuid("Tournament id must be a UUID"),
});

const venueFields = {
  name: z.string().trim().min(2).max(120),
  address: z.string().trim().min(3).max(300),
  city: z.string().trim().min(2).max(100),
  capacity: z.coerce.number().int().min(1).max(500_000).nullish(),
  image: z.string().trim().max(500).nullish(),
};

export const createVenueSchema = z.object(venueFields);
export type CreateVenueInput = z.infer<typeof createVenueSchema>;

export const updateVenueSchema = z.object(venueFields);
export type UpdateVenueInput = z.infer<typeof updateVenueSchema>;

export const listVenuesQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  city: z.string().trim().min(1).max(100).optional(),
});
export type ListVenuesQuery = z.infer<typeof listVenuesQuerySchema>;

export const venueIdParamsSchema = z.object({
  id: z.string().uuid("Venue id must be a UUID"),
});
