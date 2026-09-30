import type { StandingsDto } from "@tournament/shared";

import { http } from "./client.js";

/** Module 6 — typed functions 1:1 with apps/api standings routes. */

export async function getStandings(tournamentId: string): Promise<StandingsDto> {
  const { data } = await http.get<{ standings: StandingsDto }>(`/standings/tournaments/${tournamentId}`);
  return data.standings;
}

export async function getActiveStandings(): Promise<StandingsDto> {
  const { data } = await http.get<{ standings: StandingsDto }>("/standings/active");
  return data.standings;
}
