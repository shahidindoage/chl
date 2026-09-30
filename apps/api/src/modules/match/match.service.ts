import type {
  AddMatchEventInput,
  CreateMatchInput,
  ListMatchesQuery,
  MatchDetailDto,
  MatchDto,
  MatchEventDto,
  UpdateMatchInput,
  UpdateResultInput,
} from "@tournament/shared";
import type { MatchWithRelations } from "./match.repository.js";

import { ApiError } from "../../core/utils/ApiError.js";
import { cacheDel, publishLiveEvent } from "../../core/lib/redis.js";
import { getVenue } from "../tournament/tournament.service.js";
import { getTeam } from "../team/team.service.js";
import { getPlayer } from "../player/player.service.js";
import * as repo from "./match.repository.js";

/**
 * Module 4 business rules:
 * - a match always sits inside a tournament, with two distinct teams that
 *   belong to that tournament; venue is optional but must exist.
 * - lifecycle: upcoming → live → completed (live control is Module 5's job;
 *   this module schedules, edits, cancels and records results/timeline).
 * - manual result entry is blocked while a match is live.
 */

function toMatchDto(m: MatchWithRelations): MatchDto {
  return {
    id: m.id,
    tournamentId: m.tournamentId,
    teamAId: m.teamAId,
    teamBId: m.teamBId,
    venueId: m.venueId,
    date: m.date.toISOString(),
    status: m.status,
    teamAScore: m.teamAScore,
    teamBScore: m.teamBScore,
    currentMinute: m.currentMinute,
    currentPeriod: m.currentPeriod,
    isPaused: m.isPaused,
    summary: m.summary,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    teamA: {
      id: m.teamA.id, name: m.teamA.name, shortName: m.teamA.shortName,
      logo: m.teamA.logo, color1: m.teamA.color1,
    },
    teamB: {
      id: m.teamB.id, name: m.teamB.name, shortName: m.teamB.shortName,
      logo: m.teamB.logo, color1: m.teamB.color1,
    },
    venue: m.venue ? { id: m.venue.id, name: m.venue.name, city: m.venue.city } : null,
  };
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

/**
 * Section 2 rule 7: a match result changing invalidates its tournament's
 * standings cache. Kept here so every Module 4 write path enforces it,
 * and Module 5's live control reuses this exact helper.
 */
export async function invalidateStandingsCache(tournamentId: string): Promise<void> {
  await cacheDel(`standings:${tournamentId}`);
}

async function assertMatchShape(tournamentId: string, teamAId: string, teamBId: string, venueId?: string | null): Promise<void> {
  const teamA = await getTeam(teamAId); // 404 if missing
  const teamB = await getTeam(teamBId);
  if (teamAId === teamBId) throw ApiError.badRequest("A team cannot play itself");
  if (teamA.tournamentId !== tournamentId || teamB.tournamentId !== tournamentId) {
    throw ApiError.badRequest("Both teams must belong to the selected tournament");
  }
  if (venueId) await getVenue(venueId);
}

export async function createMatch(input: CreateMatchInput): Promise<MatchDto> {
  await assertMatchShape(input.tournamentId, input.teamAId, input.teamBId, input.venueId ?? null);
  if (input.status === "live") {
    throw ApiError.badRequest("Matches start as upcoming — use the live control panel (Module 5) to go live");
  }
  const created = await repo.createMatch({
    tournamentId: input.tournamentId,
    teamAId: input.teamAId,
    teamBId: input.teamBId,
    venueId: input.venueId ?? null,
    date: new Date(input.date),
    status: input.status,
  });
  const withRelations = await repo.findMatchWithRelations(created.id);
  return toMatchDto(withRelations as MatchWithRelations);
}

export async function updateMatch(id: string, input: UpdateMatchInput): Promise<MatchDto> {
  const existing = await repo.findMatchById(id);
  if (!existing) throw ApiError.notFound("Match not found");
  if (existing.status === "live") {
    throw ApiError.badRequest("Cannot edit a live match — end it first");
  }
  if (input.status === "live") {
    throw ApiError.badRequest("Cannot switch a match to live here — use the live control panel (Module 5)");
  }
  if (existing.status === "completed" && input.status !== "completed") {
    throw ApiError.badRequest("A completed match cannot move back a status — delete and reschedule instead");
  }
  await assertMatchShape(input.tournamentId, input.teamAId, input.teamBId, input.venueId ?? null);

  await repo.updateMatch(id, {
    tournamentId: input.tournamentId,
    teamAId: input.teamAId,
    teamBId: input.teamBId,
    venueId: input.venueId ?? null,
    date: new Date(input.date),
    status: input.status,
  });
  const withRelations = await repo.findMatchWithRelations(id);
  return toMatchDto(withRelations as MatchWithRelations);
}

export async function deleteMatch(id: string): Promise<{ deleted: true; id: string }> {
  const existing = await repo.findMatchById(id);
  if (!existing) throw ApiError.notFound("Match not found");
  if (existing.status === "live") {
    throw ApiError.badRequest("Cannot delete a live match — end or cancel it first");
  }
  await repo.deleteMatch(id);
  // Deleting a match with a recorded result changes the standings (rule 7).
  await invalidateStandingsCache(existing.tournamentId);
  return { deleted: true, id };
}

export async function getMatch(id: string): Promise<MatchDetailDto> {
  const found = await repo.findMatchWithRelations(id);
  if (!found) throw ApiError.notFound("Match not found");
  const events = await repo.listEventsForMatch(id);
  return { ...toMatchDto(found), events: events.map(toEventDto) };
}

export async function listMatches(query: ListMatchesQuery): Promise<{
  items: MatchDto[];
  pagination: ReturnType<typeof pagination>;
}> {
  const { items, total } = await repo.listMatches({
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    ...(query.status ? { status: query.status } : {}),
    ...(query.teamId ? { teamId: query.teamId } : {}),
    ...(query.tournamentId ? { tournamentId: query.tournamentId } : {}),
    ...(query.from ? { from: query.from } : {}),
    ...(query.to ? { to: query.to } : {}),
  });
  return { items: items.map(toMatchDto), pagination: pagination(query.page, query.limit, total) };
}

/** Internal data source for Module 6 (standings calc) — exported service, not repo (rule 2). */
export async function listCompletedMatches(tournamentId: string): Promise<MatchDto[]> {
  const { items } = await repo.listMatches({ skip: 0, take: 1000, tournamentId, status: "completed" });
  return items.map(toMatchDto);
}

/**
 * Internal data source for Module 5 (live control) — the only sanctioned
 * way to move a match through its live lifecycle. Validates transitions
 * here so the state machine is owned once; applies the patch; keeps the
 * standings cache honest on completion.
 */
export async function applyLiveControl(
  id: string,
  action: "start" | "pause" | "resume" | "end" | "score",
  patch: Partial<{
    currentMinute: number | null;
    currentPeriod: string | null;
    isPaused: boolean;
    teamAScore: number;
    teamBScore: number;
    summary: string | null;
  }>
): Promise<MatchDto> {
  const existing = await repo.findMatchById(id);
  if (!existing) throw ApiError.notFound("Match not found");

  switch (action) {
    case "start":
      if (existing.status === "live") throw ApiError.badRequest("Match is already live");
      if (existing.status !== "upcoming") throw ApiError.badRequest(`Cannot start a ${existing.status} match`);
      break;
    case "pause":
    case "resume":
    case "score":
      if (existing.status !== "live") throw ApiError.badRequest(`Match is ${existing.status}, not live`);
      break;
    case "end":
      if (existing.status !== "live") throw ApiError.badRequest(`Match is ${existing.status}, not live`);
      break;
  }

  const data: Record<string, unknown> = { ...patch };
  if (action === "start") data.status = "live";
  if (action === "end") data.status = "completed";

  await repo.updateMatch(id, data as never);
  // Entering completed (end) always refreshes standings; score/pause keep
  // the same status, but a score bump on a live game doesn't affect the
  // table until completion — standings only count completed matches.
  if (action === "end") await invalidateStandingsCache(existing.tournamentId);

  const withRelations = await repo.findMatchWithRelations(id);
  const dto = toMatchDto(withRelations as MatchWithRelations);

  // Section 9: write → Redis publish → Socket.io broadcast to match:{id}.
  // API never touches sockets directly.
  await publishLiveEvent(id, "match:status", {
    matchId: id,
    action,
    status: dto.status,
    isPaused: dto.isPaused,
    currentMinute: dto.currentMinute,
    currentPeriod: dto.currentPeriod,
    teamAScore: dto.teamAScore,
    teamBScore: dto.teamBScore,
    at: new Date().toISOString(),
  });
  return dto;
}

/** Manual result entry (upcoming/cancelled/completed — not live). */
export async function updateResult(id: string, input: UpdateResultInput): Promise<MatchDto> {
  const existing = await repo.findMatchById(id);
  if (!existing) throw ApiError.notFound("Match not found");
  if (existing.status === "live") {
    throw ApiError.badRequest("Use the live control panel (Module 5) to change scores while live");
  }

  const updated = await repo.updateMatch(id, {
    teamAScore: input.teamAScore,
    teamBScore: input.teamBScore,
    summary: input.summary ?? existing.summary,
    status: existing.status === "upcoming" ? "completed" : existing.status,
  });
  // Results feed standings (Section 2 rule 7).
  await invalidateStandingsCache(updated.tournamentId);
  const withRelations = await repo.findMatchWithRelations(updated.id);
  return toMatchDto(withRelations as MatchWithRelations);
}

function toEventDto(e: repo.MatchEventWithNames): MatchEventDto {
  return {
    id: e.id,
    matchId: e.matchId,
    eventType: e.eventType,
    teamId: e.teamId,
    teamName: e.team?.name ?? null,
    playerId: e.playerId,
    playerName: e.player?.name ?? null,
    minute: e.minute,
    description: e.description,
    createdAt: e.createdAt.toISOString(),
  };
}

export async function addEvent(matchId: string, input: AddMatchEventInput): Promise<MatchEventDto> {
  const match = await repo.findMatchById(matchId);
  if (!match) throw ApiError.notFound("Match not found");

  if (input.teamId) {
    if (input.teamId !== match.teamAId && input.teamId !== match.teamBId) {
      throw ApiError.badRequest("Event team must be one of the two teams playing this match");
    }
  }
  if (input.playerId) {
    const player = await getPlayer(input.playerId);
    if (input.teamId && player.teamId !== input.teamId) {
      throw ApiError.badRequest("Player does not belong to the selected team");
    }
    if (!input.teamId && player.teamId !== match.teamAId && player.teamId !== match.teamBId) {
      throw ApiError.badRequest("Player does not belong to either team in this match");
    }
  }

  const created = await repo.createEvent({
    matchId,
    eventType: input.eventType,
    teamId: input.teamId ?? null,
    playerId: input.playerId ?? null,
    minute: input.minute,
    description: input.description ?? null,
  });
  // Re-read to embed team/player names via the relation include.
  const events = await repo.listEventsForMatch(matchId);
  const withNames = events.find((e) => e.id === created.id);
  if (!withNames) throw ApiError.internal("Event vanished after create");
  const dto = toEventDto(withNames);
  // While live, timeline events also stream to the room.
  if (match.status === "live") {
    await publishLiveEvent(matchId, "match:event", dto);
  }
  return dto;
}

export async function deleteEvent(eventId: string): Promise<{ deleted: true; id: string }> {
  const existing = await repo.findEventById(eventId);
  if (!existing) throw ApiError.notFound("Event not found");
  await repo.deleteEvent(eventId);
  return { deleted: true, id: eventId };
}
