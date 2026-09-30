import type { PlayerDto, PlayerProfileDto } from "@tournament/shared";
import type {
  CreatePlayerInput,
  ListPlayersQuery,
  UpdatePlayerInput,
} from "@tournament/shared";
import type { Role } from "@tournament/shared";

import { ApiError } from "../../core/utils/ApiError.js";
import { getTeam } from "../team/team.service.js";
import * as repo from "./player.repository.js";

/** Caller identity for the access rule (Section 8 Module 3). */
export interface Actor {
  id: string;
  role: Role;
}

const OWNER_MANAGED_ROLES = new Set<Role>(["team_owner"]);

function toPlayerDto(p: repo.PlayerRow): PlayerDto {
  return {
    id: p.id,
    name: p.name,
    image: p.image,
    jerseyNumber: p.jerseyNumber,
    position: p.position,
    dateOfBirth: p.dateOfBirth.toISOString(),
    nationality: p.nationality,
    teamId: p.teamId,
    tournamentId: p.tournamentId,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/**
 * Access rule (Section 8 Module 2): team_owner manages only players on
 * their own team; super_admin manages everything. Team info comes from the
 * team module's service — never prisma.team here (Section 2 rule 2).
 */
async function requireTeamManagementAccess(teamId: string, actor: Actor) {
  const team = await getTeam(teamId); // 404s if the team doesn't exist
  if (actor.role === "super_admin") return team;
  if (OWNER_MANAGED_ROLES.has(actor.role) && team.ownerId === actor.id) return team;
  throw ApiError.forbidden("You can only manage players on your own team");
}

export async function createPlayer(input: CreatePlayerInput, actor: Actor): Promise<PlayerDto> {
  const team = await requireTeamManagementAccess(input.teamId, actor);

  const clash = await repo.findPlayerByTeamJersey(input.teamId, input.jerseyNumber);
  if (clash) {
    throw ApiError.conflict(`Jersey #${input.jerseyNumber} is taken on this team (${clash.name})`);
  }

  try {
    const created = await repo.createPlayer({
      name: input.name,
      image: input.image ?? null,
      jerseyNumber: input.jerseyNumber,
      position: input.position,
      dateOfBirth: new Date(input.dateOfBirth),
      nationality: input.nationality,
      teamId: team.id,
      tournamentId: team.tournamentId,
    });
    return toPlayerDto(created);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw ApiError.conflict(`Jersey #${input.jerseyNumber} is already taken on this team`);
    }
    throw error;
  }
}

export async function updatePlayer(id: string, input: UpdatePlayerInput, actor: Actor): Promise<PlayerDto> {
  const existing = await repo.findPlayerById(id);
  if (!existing) throw ApiError.notFound("Player not found");
  await requireTeamManagementAccess(existing.teamId, actor);

  const movingTeam = input.teamId !== existing.teamId;
  let tournamentId = existing.tournamentId;
  if (movingTeam) {
    const target = await requireTeamManagementAccess(input.teamId, actor);
    tournamentId = target.tournamentId;
  }

  const clash = await repo.findPlayerByTeamJersey(input.teamId, input.jerseyNumber);
  if (clash && clash.id !== id) {
    throw ApiError.conflict(`Jersey #${input.jerseyNumber} is taken on that team (${clash.name})`);
  }

  try {
    const updated = await repo.updatePlayer(id, {
      name: input.name,
      image: input.image ?? null,
      jerseyNumber: input.jerseyNumber,
      position: input.position,
      dateOfBirth: new Date(input.dateOfBirth),
      nationality: input.nationality,
      teamId: input.teamId,
      tournamentId,
    });
    return toPlayerDto(updated);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw ApiError.conflict(`Jersey #${input.jerseyNumber} is already taken on that team`);
    }
    throw error;
  }
}

/** Section 8 endpoint: reassign team — moves the player, keeps details. */
export async function reassignPlayer(id: string, teamId: string, actor: Actor): Promise<PlayerDto> {
  const existing = await repo.findPlayerById(id);
  if (!existing) throw ApiError.notFound("Player not found");
  await requireTeamManagementAccess(existing.teamId, actor);
  const targetTeam = await requireTeamManagementAccess(teamId, actor);

  const clash = await repo.findPlayerByTeamJersey(teamId, existing.jerseyNumber);
  if (clash && clash.id !== id) {
    throw ApiError.conflict(`Jersey #${existing.jerseyNumber} is taken on ${targetTeam.name} — update the jersey number first`);
  }

  const updated = await repo.updatePlayer(id, {
    name: existing.name,
    image: existing.image,
    jerseyNumber: existing.jerseyNumber,
    position: existing.position,
    dateOfBirth: existing.dateOfBirth,
    nationality: existing.nationality,
    teamId,
    tournamentId: targetTeam.tournamentId,
  });
  return toPlayerDto(updated);
}

export async function deletePlayer(id: string, actor: Actor): Promise<{ deleted: true; id: string }> {
  const existing = await repo.findPlayerById(id);
  if (!existing) throw ApiError.notFound("Player not found");
  await requireTeamManagementAccess(existing.teamId, actor);
  await repo.deletePlayer(id);
  return { deleted: true, id };
}

export async function getPlayer(id: string): Promise<PlayerDto> {
  const found = await repo.findPlayerById(id);
  if (!found) throw ApiError.notFound("Player not found");
  return toPlayerDto(found);
}

/** Player profile — team display fields pulled via the team service (rule 2). */
export async function getPlayerProfile(id: string): Promise<PlayerProfileDto> {
  const player = await getPlayer(id);
  const team = await getTeam(player.teamId);
  return {
    ...player,
    teamName: team.name,
    teamShortName: team.shortName,
    teamColor1: team.color1,
    teamColor2: team.color2,
  };
}

export async function listPlayers(query: ListPlayersQuery): Promise<{
  items: PlayerDto[];
  pagination: ReturnType<typeof pagination>;
}> {
  const { items, total } = await repo.listPlayers({
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    ...(query.teamId ? { teamId: query.teamId } : {}),
    ...(query.tournamentId ? { tournamentId: query.tournamentId } : {}),
    ...(query.position ? { position: query.position } : {}),
  });
  return { items: items.map(toPlayerDto), pagination: pagination(query.page, query.limit, total) };
}
