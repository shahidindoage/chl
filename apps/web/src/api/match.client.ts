import type {
  AddMatchEventInput,
  CreateMatchInput,
  MatchDetailDto,
  MatchDto,
  MatchEventDto,
} from "@tournament/shared";

import { http } from "./client.js";
import type { Paginated } from "./tournament.client.js";

/** Module 4 — typed functions 1:1 with apps/api match routes (Section 6). */

export async function listMatches(
  params: { page?: number; limit?: number; status?: string; teamId?: string; tournamentId?: string; from?: string; to?: string } = {}
): Promise<Paginated<MatchDto>> {
  const { data } = await http.get<Paginated<MatchDto>>("/matches", { params });
  return data;
}

export async function getMatch(id: string): Promise<MatchDetailDto> {
  const { data } = await http.get<{ match: MatchDetailDto }>(`/matches/${id}`);
  return data.match;
}

export async function createMatch(input: CreateMatchInput): Promise<MatchDto> {
  const { data } = await http.post<{ match: MatchDto }>("/matches", input);
  return data.match;
}

export async function updateMatch(id: string, input: CreateMatchInput): Promise<MatchDto> {
  const { data } = await http.put<{ match: MatchDto }>(`/matches/${id}`, input);
  return data.match;
}

export async function deleteMatch(id: string): Promise<void> {
  await http.delete(`/matches/${id}`);
}

export async function updateResult(id: string, body: { teamAScore: number; teamBScore: number; summary?: string | null }): Promise<MatchDto> {
  const { data } = await http.put<{ match: MatchDto }>(`/matches/${id}/result`, body);
  return data.match;
}

export async function addEvent(matchId: string, input: AddMatchEventInput): Promise<MatchEventDto> {
  const { data } = await http.post<{ event: MatchEventDto }>(`/matches/${matchId}/events`, input);
  return data.event;
}

export async function deleteEvent(eventId: string): Promise<void> {
  await http.delete(`/matches/events/${eventId}`);
}
