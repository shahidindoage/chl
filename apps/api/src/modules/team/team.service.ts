import type { Team } from "@prisma/client";
import type {
  CreateTeamInput,
  ListTeamsQuery,
  SponsorDto,
  TeamDto,
  TeamWithSponsorsDto,
  UpdateTeamInput,
} from "@tournament/shared";
import type { Role } from "@tournament/shared";

import { ApiError } from "../../core/utils/ApiError.js";
import { getTournament } from "../tournament/tournament.service.js";
import * as repo from "./team.repository.js";

/** Caller identity for the access rule (Section 2 rule 2, Section 8). */
export interface Actor {
  id: string;
  role: Role;
}

const OWNER_MANAGED_ROLES = new Set<Role>(["team_owner"]);

function toTeamDto(t: {
  id: string; name: string; shortName: string; logo: string | null;
  color1: string; color2: string | null; tournamentId: string;
  coachName: string | null; coachImage: string | null; ownerId: string | null;
  createdAt: Date; updatedAt: Date;
}): TeamDto {
  return {
    id: t.id,
    name: t.name,
    shortName: t.shortName,
    logo: t.logo,
    color1: t.color1,
    color2: t.color2,
    tournamentId: t.tournamentId,
    coachName: t.coachName,
    coachImage: t.coachImage,
    ownerId: t.ownerId,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  };
}

function toSponsorDto(s: {
  id: string; name: string; logo: string | null; teamId: string;
  createdAt: Date; updatedAt: Date;
}): SponsorDto {
  return {
    id: s.id,
    name: s.name,
    logo: s.logo,
    teamId: s.teamId,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  };
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/** team_owner may only touch teams they own; super_admin may touch all. */
async function requireTeamAccess(teamId: string, actor: Actor): Promise<Team> {
  const team = await repo.findTeamById(teamId);
  if (!team) throw ApiError.notFound("Team not found");
  if (actor.role === "super_admin") return team;
  if (OWNER_MANAGED_ROLES.has(actor.role) && team.ownerId === actor.id) return team;
  throw ApiError.forbidden("You can only manage your own team");
}

export async function createTeam(input: CreateTeamInput, actor: Actor): Promise<TeamDto> {
  // Validate the parent tournament exists via its OWN service (rule 2).
  await getTournament(input.tournamentId);

  const clash = await repo.findTeamByTournamentName(input.tournamentId, input.name);
  if (clash) throw ApiError.conflict(`A team "${input.name}" already exists in this tournament`);

  let ownerId = input.ownerId ?? null;
  if (actor.role === "team_owner") {
    // A team_owner always owns the teams they create; they cannot assign to others.
    ownerId = actor.id;
  }

  try {
    const created = await repo.createTeam({
      name: input.name,
      shortName: input.shortName,
      logo: input.logo ?? null,
      color1: input.color1,
      color2: input.color2 ?? null,
      tournamentId: input.tournamentId,
      coachName: input.coachName ?? null,
      coachImage: input.coachImage ?? null,
      ownerId,
    });
    return toTeamDto(created);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw ApiError.conflict("A team with that name already exists in this tournament");
    }
    if ((error as { code?: string }).code === "P2003") {
      throw ApiError.badRequest("Invalid tournament or owner reference");
    }
    throw error;
  }
}

export async function updateTeam(id: string, input: UpdateTeamInput, actor: Actor): Promise<TeamDto> {
  const existing = await requireTeamAccess(id, actor);

  await getTournament(input.tournamentId);

  const clash = await repo.findTeamByTournamentName(input.tournamentId, input.name);
  if (clash && clash.id !== id) {
    throw ApiError.conflict(`A team "${input.name}" already exists in this tournament`);
  }

  // team_owner cannot reassign ownership or move their team to another tournament owner.
  let ownerId = input.ownerId ?? null;
  if (actor.role === "team_owner") {
    ownerId = existing.ownerId;
  }

  const updated = await repo.updateTeam(id, {
    name: input.name,
    shortName: input.shortName,
    logo: input.logo ?? null,
    color1: input.color1,
    color2: input.color2 ?? null,
    tournamentId: input.tournamentId,
    coachName: input.coachName ?? null,
    coachImage: input.coachImage ?? null,
    ownerId,
  });
  return toTeamDto(updated);
}

export async function deleteTeam(id: string, actor: Actor): Promise<{ deleted: true; id: string }> {
  await requireTeamAccess(id, actor);
  await repo.deleteTeam(id);
  return { deleted: true, id };
}

export async function getTeam(id: string): Promise<TeamWithSponsorsDto> {
  const found = await repo.findTeamWithSponsors(id);
  if (!found) throw ApiError.notFound("Team not found");
  return {
    ...toTeamDto(found),
    sponsors: found.sponsors.map(toSponsorDto),
  };
}

export async function listTeams(query: ListTeamsQuery): Promise<{
  items: TeamDto[];
  pagination: ReturnType<typeof pagination>;
}> {
  const { items, total } = await repo.listTeams({
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    ...(query.tournamentId ? { tournamentId: query.tournamentId } : {}),
  });
  return { items: items.map(toTeamDto), pagination: pagination(query.page, query.limit, total) };
}

export async function addSponsor(teamId: string, data: { name: string; logo?: string | null }, actor: Actor): Promise<SponsorDto> {
  await requireTeamAccess(teamId, actor);
  try {
    const created = await repo.createSponsor({ name: data.name, logo: data.logo ?? null, teamId });
    return toSponsorDto(created);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw ApiError.conflict(`Sponsor "${data.name}" is already attached to this team`);
    }
    throw error;
  }
}

export async function updateSponsor(sponsorId: string, data: { name: string; logo?: string | null }, actor: Actor): Promise<SponsorDto> {
  const sponsor = await repo.findSponsorById(sponsorId);
  if (!sponsor) throw ApiError.notFound("Sponsor not found");
  await requireTeamAccess(sponsor.teamId, actor);
  try {
    const updated = await repo.updateSponsor(sponsorId, { name: data.name, logo: data.logo ?? null });
    return toSponsorDto(updated);
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw ApiError.conflict(`Sponsor "${data.name}" is already attached to this team`);
    }
    throw error;
  }
}

export async function deleteSponsor(sponsorId: string, actor: Actor): Promise<{ deleted: true; id: string }> {
  const sponsor = await repo.findSponsorById(sponsorId);
  if (!sponsor) throw ApiError.notFound("Sponsor not found");
  await requireTeamAccess(sponsor.teamId, actor);
  await repo.deleteSponsor(sponsorId);
  return { deleted: true, id: sponsorId };
}
