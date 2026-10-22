import { z } from "zod";

/**
 * Positions a player can hold.
 *
 * "tbc" is for a squad member whose role has not been decided yet. It is
 * stored as "tbc" so it sorts and filters like any other value, and is shown
 * as "To Be Confirmed" everywhere via playerPositionLabel.
 */
export const PLAYER_POSITIONS = [
  "goalkeeper",
  "defender",
  "midfielder",
  "forward",
  "tbc",
] as const;
export type PlayerPositionName = (typeof PLAYER_POSITIONS)[number];

/** Display label for a stored position value. */
export const PLAYER_POSITION_LABEL: Record<PlayerPositionName, string> = {
  goalkeeper: "Goalkeeper",
  defender: "Defender",
  midfielder: "Midfielder",
  forward: "Forward",
  tbc: "To Be Confirmed",
};

/** Human-readable label for a position, falling back to the raw value. */
export function playerPositionLabel(position: string): string {
  return PLAYER_POSITION_LABEL[position as PlayerPositionName] ?? position;
}

/**
 * Heading label for a group of players sharing a position. Pluralised, except
 * "goalkeeper" (already singular) and "tbc", which reads as a sentence.
 */
export const PLAYER_POSITION_GROUP_LABEL: Record<PlayerPositionName, string> = {
  goalkeeper: "Goalkeeper",
  defender: "Defenders",
  midfielder: "Midfielders",
  forward: "Forwards",
  tbc: "To Be Confirmed",
};

export function playerPositionGroupLabel(position: string): string {
  return PLAYER_POSITION_GROUP_LABEL[position as PlayerPositionName] ?? position;
}

export const playerSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  image: z.string().nullable(),
  jerseyNumber: z.number().int(),
  position: z.enum(PLAYER_POSITIONS),
  dateOfBirth: z.string().datetime(),
  nationality: z.string(),
  flagImage: z.string().nullable(),
  backgroundImage: z.string().nullable(),
  teamId: z.string().uuid(),
  tournamentId: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type PlayerDto = z.infer<typeof playerSchema>;

/** Player profile for public display — player + their team's display info. */
export const playerProfileSchema = playerSchema.extend({
  teamName: z.string(),
  teamShortName: z.string(),
  teamColor1: z.string(),
  teamColor2: z.string().nullable(),
});
export type PlayerProfileDto = z.infer<typeof playerProfileSchema>;

/** An uploaded path or an http(s) URL — never a data: or javascript: value. */
const mediaUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v.startsWith("/uploads/") || /^https?:\/\//i.test(v), {
    message: "Must be an uploaded path (/uploads/...) or an http(s) URL",
  })
  .nullish();

const playerFields = {
  name: z.string().trim().min(2).max(120),
  image: z.string().trim().max(500).nullish(),
  flagImage: mediaUrl,
  backgroundImage: mediaUrl,
  jerseyNumber: z.coerce.number().int().min(1).max(99),
  position: z.enum(PLAYER_POSITIONS),
  dateOfBirth: z.coerce.date().refine((d) => d < new Date(), "Date of birth must be in the past")
    .refine((d) => d > new Date("1900-01-01T00:00:00Z"), "Date of birth looks too old"),
  nationality: z.string().trim().min(2).max(60),
};

export const createPlayerSchema = z.object({
  ...playerFields,
  teamId: z.string().uuid("Team id must be a UUID"),
});
export interface CreatePlayerInput {
  name: string;
  image?: string | null;
  flagImage?: string | null;
  backgroundImage?: string | null;
  jerseyNumber: number;
  position: PlayerPositionName;
  dateOfBirth: Date | string;
  nationality: string;
  teamId: string;
}

export const updatePlayerSchema = z.object({
  ...playerFields,
  teamId: z.string().uuid("Team id must be a UUID"),
});
export type UpdatePlayerInput = CreatePlayerInput;

export const reassignPlayerSchema = z.object({
  teamId: z.string().uuid("Team id must be a UUID"),
});
export type ReassignPlayerInput = z.infer<typeof reassignPlayerSchema>;

export const listPlayersQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  teamId: z.string().uuid().optional(),
  tournamentId: z.string().uuid().optional(),
  position: z.enum(PLAYER_POSITIONS).optional(),
});
export type ListPlayersQuery = z.infer<typeof listPlayersQuerySchema>;

export const playerIdParamsSchema = z.object({
  id: z.string().uuid("Player id must be a UUID"),
});
