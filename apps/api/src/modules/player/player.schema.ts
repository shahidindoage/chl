/**
 * Module 3 — Player input schemas.
 * Shapes live in @tournament/shared (Section 6 reuse pattern).
 */
export {
  createPlayerSchema,
  updatePlayerSchema,
  reassignPlayerSchema,
  listPlayersQuerySchema,
  playerIdParamsSchema,
  playerSchema,
  playerProfileSchema,
  PLAYER_POSITIONS,
  type CreatePlayerInput,
  type UpdatePlayerInput,
  type ReassignPlayerInput,
  type ListPlayersQuery,
  type PlayerDto,
  type PlayerProfileDto,
  type PlayerPositionName,
} from "@tournament/shared";
