/**
 * Module 2 — Team input schemas.
 * Shapes live in @tournament/shared (Section 6 reuse pattern).
 */
export {
  createTeamSchema,
  updateTeamSchema,
  listTeamsQuerySchema,
  teamIdParamsSchema,
  createSponsorSchema,
  updateSponsorSchema,
  sponsorParamsSchema,
  teamSchema,
  sponsorSchema,
  teamWithSponsorsSchema,
  type CreateTeamInput,
  type UpdateTeamInput,
  type ListTeamsQuery,
  type CreateSponsorInput,
  type UpdateSponsorInput,
  type TeamDto,
  type SponsorDto,
  type TeamWithSponsorsDto,
} from "@tournament/shared";
