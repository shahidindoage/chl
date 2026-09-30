import type { Match, MatchEvent, Prisma } from "@prisma/client";

import { prisma } from "../../core/lib/prisma.js";

/**
 * The ONLY file allowed to touch prisma.Match / prisma.MatchEvent.
 * Embedded team/venue/player info in responses comes from relation
 * `include` on Match's OWN schema — this repo never queries
 * prisma.team / prisma.venue / prisma.player directly (Section 2 rule 2).
 */

const matchInclude = {
  teamA: { select: { id: true, name: true, shortName: true, logo: true, color1: true, tournamentId: true } },
  teamB: { select: { id: true, name: true, shortName: true, logo: true, color1: true, tournamentId: true } },
  venue: { select: { id: true, name: true, city: true } },
} satisfies Prisma.MatchInclude;

export type MatchWithRelations = Prisma.MatchGetPayload<{ include: typeof matchInclude }>;

export function createMatch(data: Prisma.MatchUncheckedCreateInput): Promise<Match> {
  return prisma.match.create({ data });
}

export function findMatchById(id: string): Promise<Match | null> {
  return prisma.match.findUnique({ where: { id } });
}

export function findMatchWithRelations(id: string): Promise<MatchWithRelations | null> {
  return prisma.match.findUnique({ where: { id }, include: matchInclude });
}

export function updateMatch(id: string, data: Prisma.MatchUncheckedUpdateInput): Promise<Match> {
  return prisma.match.update({ where: { id }, data });
}

export function deleteMatch(id: string): Promise<Match> {
  return prisma.match.delete({ where: { id } });
}

export function listMatches(params: {
  skip: number;
  take: number;
  status?: string;
  teamId?: string;
  tournamentId?: string;
  from?: Date;
  to?: Date;
}): Promise<{ items: MatchWithRelations[]; total: number }> {
  const where: Prisma.MatchWhereInput = {
    ...(params.status ? { status: params.status as never } : {}),
    ...(params.teamId ? { OR: [{ teamAId: params.teamId }, { teamBId: params.teamId }] } : {}),
    ...(params.tournamentId ? { tournamentId: params.tournamentId } : {}),
    ...(params.from || params.to
      ? { date: { ...(params.from ? { gte: params.from } : {}), ...(params.to ? { lte: params.to } : {}) } }
      : {}),
  };
  return Promise.all([
    prisma.match.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { date: "asc" },
      include: matchInclude,
    }),
    prisma.match.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}

export function createEvent(data: Prisma.MatchEventUncheckedCreateInput): Promise<MatchEvent> {
  return prisma.matchEvent.create({ data });
}

export function findEventById(id: string): Promise<MatchEvent | null> {
  return prisma.matchEvent.findUnique({ where: { id } });
}

export function deleteEvent(id: string): Promise<MatchEvent> {
  return prisma.matchEvent.delete({ where: { id } });
}

export type MatchEventWithNames = Awaited<ReturnType<typeof listEventsForMatch>>[number];

export function listEventsForMatch(matchId: string) {
  return prisma.matchEvent.findMany({
    where: { matchId },
    orderBy: [{ minute: "asc" }, { createdAt: "asc" }],
    include: {
      team: { select: { name: true } },
      player: { select: { name: true } },
    },
  });
}
