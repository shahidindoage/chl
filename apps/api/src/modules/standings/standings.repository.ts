import { cacheDel, cacheGetJson, cacheSetJson } from "../../core/lib/redis.js";
import type { StandingsDto } from "./standings.schema.js";

/**
 * Module 6 owns no Prisma model — standings are DERIVED at request time
 * from completed matches (Approach A, Section 2 rule 7) and cached in
 * Redis. This "repository" is the cache access layer only; no other
 * module may read/write these keys directly.
 */
export const STANDINGS_TTL_SECONDS = 300;

export function standingsKey(tournamentId: string): string {
  return `standings:${tournamentId}`;
}

export function getCachedStandings(tournamentId: string): Promise<StandingsDto | null> {
  return cacheGetJson<StandingsDto>(standingsKey(tournamentId));
}

export function cacheStandings(standings: StandingsDto): Promise<void> {
  return cacheSetJson(standingsKey(standings.tournamentId), standings, STANDINGS_TTL_SECONDS);
}

/** Used via the module boundary if ever needed; match writes use the
 *  same key through match.service.invalidateStandingsCache. */
export async function invalidateStandings(tournamentId: string): Promise<void> {
  await cacheDel(standingsKey(tournamentId));
}
