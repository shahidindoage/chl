/**
 * Module 1 — Tournament input schemas.
 * Shapes live in @tournament/shared (Section 6 reuse pattern).
 */
export {
  createTournamentSchema,
  updateTournamentSchema,
  listTournamentsQuerySchema,
  tournamentIdParamsSchema,
  createVenueSchema,
  updateVenueSchema,
  listVenuesQuerySchema,
  venueIdParamsSchema,
  tournamentSchema,
  venueSchema,
  TOURNAMENT_FORMATS,
  TOURNAMENT_STATUSES,
  type CreateTournamentInput,
  type UpdateTournamentInput,
  type ListTournamentsQuery,
  type CreateVenueInput,
  type UpdateVenueInput,
  type ListVenuesQuery,
  type TournamentDto,
  type VenueDto,
  type TournamentFormatName,
  type TournamentStatusName,
} from "@tournament/shared";
