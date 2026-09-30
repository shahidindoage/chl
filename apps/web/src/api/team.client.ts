import type {
  CreateSponsorInput,
  CreateTeamInput,
  SponsorDto,
  TeamDto,
  TeamWithSponsorsDto,
  UpdateTeamInput,
} from "@tournament/shared";

import { http } from "./client.js";
import type { Paginated } from "./tournament.client.js";

/** Module 2 — typed functions 1:1 with apps/api team routes (Section 6). */

export async function listTeams(params: { page?: number; limit?: number; tournamentId?: string } = {}): Promise<Paginated<TeamDto>> {
  const { data } = await http.get<Paginated<TeamDto>>("/teams", { params });
  return data;
}

export async function getTeam(id: string): Promise<TeamWithSponsorsDto> {
  const { data } = await http.get<{ team: TeamWithSponsorsDto }>(`/teams/${id}`);
  return data.team;
}

export async function createTeam(input: CreateTeamInput): Promise<TeamDto> {
  const { data } = await http.post<{ team: TeamDto }>("/teams", input);
  return data.team;
}

export async function updateTeam(id: string, input: UpdateTeamInput): Promise<TeamDto> {
  const { data } = await http.put<{ team: TeamDto }>(`/teams/${id}`, input);
  return data.team;
}

export async function deleteTeam(id: string): Promise<void> {
  await http.delete(`/teams/${id}`);
}

export async function addSponsor(teamId: string, input: CreateSponsorInput): Promise<SponsorDto> {
  const { data } = await http.post<{ sponsor: SponsorDto }>(`/teams/${teamId}/sponsors`, input);
  return data.sponsor;
}

export async function updateSponsor(sponsorId: string, input: CreateSponsorInput): Promise<SponsorDto> {
  const { data } = await http.put<{ sponsor: SponsorDto }>(`/teams/sponsors/${sponsorId}`, input);
  return data.sponsor;
}

export async function deleteSponsor(sponsorId: string): Promise<void> {
  await http.delete(`/teams/sponsors/${sponsorId}`);
}
