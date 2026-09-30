import type {
  CreateTournamentInput,
  CreateVenueInput,
  TournamentDto,
  UpdateTournamentInput,
  UpdateVenueInput,
  VenueDto,
} from "@tournament/shared";

import { http } from "./client.js";

/**
 * Module 1 — typed functions 1:1 with apps/api tournament + venue routes.
 */

export interface Paginated<T> {
  items: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export async function listTournaments(params: { page?: number; limit?: number; status?: string } = {}): Promise<Paginated<TournamentDto>> {
  const { data } = await http.get<Paginated<TournamentDto>>("/tournaments", { params });
  return data;
}

export async function getActiveTournament(): Promise<TournamentDto | null> {
  const { data } = await http.get<{ tournament: TournamentDto | null }>("/tournaments/active");
  return data.tournament;
}

export async function getTournament(id: string): Promise<TournamentDto> {
  const { data } = await http.get<{ tournament: TournamentDto }>(`/tournaments/${id}`);
  return data.tournament;
}

export async function getRules(id: string): Promise<{ id: string; name: string; format: string; rules: string | null }> {
  const { data } = await http.get(`/tournaments/${id}/rules`);
  return data;
}

export async function createTournament(input: CreateTournamentInput): Promise<TournamentDto> {
  const { data } = await http.post<{ tournament: TournamentDto }>("/tournaments", input);
  return data.tournament;
}

export async function updateTournament(id: string, input: UpdateTournamentInput): Promise<TournamentDto> {
  const { data } = await http.put<{ tournament: TournamentDto }>(`/tournaments/${id}`, input);
  return data.tournament;
}

export async function deleteTournament(id: string): Promise<void> {
  await http.delete(`/tournaments/${id}`);
}

export async function listVenues(params: { page?: number; limit?: number; city?: string } = {}): Promise<Paginated<VenueDto>> {
  const { data } = await http.get<Paginated<VenueDto>>("/venues", { params });
  return data;
}

export async function getVenue(id: string): Promise<VenueDto> {
  const { data } = await http.get<{ venue: VenueDto }>(`/venues/${id}`);
  return data.venue;
}

export async function createVenue(input: CreateVenueInput): Promise<VenueDto> {
  const { data } = await http.post<{ venue: VenueDto }>("/venues", input);
  return data.venue;
}

export async function updateVenue(id: string, input: UpdateVenueInput): Promise<VenueDto> {
  const { data } = await http.put<{ venue: VenueDto }>(`/venues/${id}`, input);
  return data.venue;
}

export async function deleteVenue(id: string): Promise<void> {
  await http.delete(`/venues/${id}`);
}
