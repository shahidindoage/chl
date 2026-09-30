/**
 * Module 4 — Match input schemas.
 * Shapes live in @tournament/shared (Section 6 reuse pattern).
 */
export {
  createMatchSchema,
  updateMatchSchema,
  updateResultSchema,
  listMatchesQuerySchema,
  matchIdParamsSchema,
  addMatchEventSchema,
  matchEventParamsSchema,
  matchSchema,
  matchDetailSchema,
  matchEventSchema,
  MATCH_STATUSES,
  MATCH_EVENT_TYPES,
  type CreateMatchInput,
  type UpdateMatchInput,
  type UpdateResultInput,
  type ListMatchesQuery,
  type AddMatchEventInput,
  type MatchDto,
  type MatchDetailDto,
  type MatchEventDto,
  type MatchStatusName,
  type MatchEventTypeName,
} from "@tournament/shared";
