import type {
  CreatePlayerInput,
  PlayerDto,
  PlayerProfileDto,
} from "@tournament/shared";

import { http } from "./client.js";
import type { Paginated } from "./tournament.client.js";

/** Module 3 — typed functions 1:1 with apps/api player routes (Section 6). */

export async function listPlayers(
  params: { page?: number; limit?: number; teamId?: string; tournamentId?: string; position?: string } = {}
): Promise<Paginated<PlayerDto>> {
  const { data } = await http.get<Paginated<PlayerDto>>("/players", { params });
  return data;
}

export async function getPlayer(id: string): Promise<PlayerProfileDto> {
  const { data } = await http.get<{ player: PlayerProfileDto }>(`/players/${id}`);
  return data.player;
}

export async function createPlayer(input: CreatePlayerInput): Promise<PlayerDto> {
  const { data } = await http.post<{ player: PlayerDto }>("/players", input);
  return data.player;
}

export async function updatePlayer(id: string, input: CreatePlayerInput): Promise<PlayerDto> {
  const { data } = await http.put<{ player: PlayerDto }>(`/players/${id}`, input);
  return data.player;
}

export async function reassignPlayer(id: string, teamId: string): Promise<PlayerDto> {
  const { data } = await http.post<{ player: PlayerDto }>(`/players/${id}/reassign`, { teamId });
  return data.player;
}

export async function deletePlayer(id: string): Promise<void> {
  await http.delete(`/players/${id}`);
}
