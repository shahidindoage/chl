import { ApiError } from "../../core/utils/ApiError.js";
import { getActiveTournament, getTournament } from "../tournament/tournament.service.js";
import { listTeams } from "../team/team.service.js";
import { listCompletedMatches } from "../match/match.service.js";
import * as standingsCache from "./standings.repository.js";
import type { StandingsDto, StandingsRow } from "./standings.schema.js";

/**
 * Approach A (Section 2 rule 7): compute the table on request from all
 * completed matches, cache in Redis, invalidate on every match write
 * (the hook lives in match.service). Never hand-edited, so it can't drift.
 * Ordering: points → goal difference → goals for → name.
 */
export async function getStandings(tournamentId: string): Promise<StandingsDto> {
  const cached = await standingsCache.getCachedStandings(tournamentId);
  if (cached) return cached;

  // Own service first: 404 for unknown tournaments before doing work.
  const tournament = await getTournament(tournamentId);

  // Cross-module reads go through each module's EXPORTED SERVICE (rule 2).
  const [{ items: teams }, matches] = await Promise.all([
    listTeams({ page: 1, limit: 100, tournamentId }),
    listCompletedMatches(tournamentId),
  ]);

  interface Agg {
    played: number; won: number; drawn: number; lost: number;
    gf: number; ga: number; points: number;
  }
  const agg = new Map<string, Agg>();
  const ensure = (teamId: string): Agg => {
    let a = agg.get(teamId);
    if (!a) {
      a = { played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, points: 0 };
      agg.set(teamId, a);
    }
    return a;
  };
  // Every registered team shows up even with zero matches played.
  for (const t of teams) ensure(t.id);

  for (const m of matches) {
    const a = ensure(m.teamAId);
    const b = ensure(m.teamBId);
    a.played += 1; b.played += 1;
    a.gf += m.teamAScore; a.ga += m.teamBScore;
    b.gf += m.teamBScore; b.ga += m.teamAScore;
    if (m.teamAScore > m.teamBScore) {
      a.won += 1; a.points += 3; b.lost += 1;
    } else if (m.teamAScore < m.teamBScore) {
      b.won += 1; b.points += 3; a.lost += 1;
    } else {
      a.drawn += 1; b.drawn += 1; a.points += 1; b.points += 1;
    }
  }

  const teamById = new Map(teams.map((t) => [t.id, t]));
  const rows: StandingsRow[] = [...agg.entries()]
    .map(([teamId, a]) => {
      const t = teamById.get(teamId);
      return {
        position: 0,
        teamId,
        teamName: t?.name ?? "Unknown team",
        shortName: t?.shortName ?? "???",
        logo: t?.logo ?? null,
        color1: t?.color1 ?? "#64748b",
        played: a.played,
        won: a.won,
        drawn: a.drawn,
        lost: a.lost,
        goalsFor: a.gf,
        goalsAgainst: a.ga,
        goalDifference: a.gf - a.ga,
        points: a.points,
      };
    })
    .sort((x, y) =>
      y.points - x.points ||
      y.goalDifference - x.goalDifference ||
      y.goalsFor - x.goalsFor ||
      x.teamName.localeCompare(y.teamName)
    )
    .map((r, i) => ({ ...r, position: i + 1 }));

  const result: StandingsDto = {
    tournamentId,
    tournamentName: tournament.name,
    season: tournament.season,
    generatedAt: new Date().toISOString(),
    rows,
  };
  await standingsCache.cacheStandings(result);
  return result;
}

export async function getActiveTournamentStandings(): Promise<StandingsDto> {
  const active = await getActiveTournament();
  if (!active) throw ApiError.notFound("No active tournament");
  return getStandings(active.id);
}
