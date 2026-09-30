import type { Prisma, Tournament, Venue } from "@prisma/client";

import { prisma } from "../../core/lib/prisma.js";

/**
 * The ONLY file allowed to touch prisma.Tournament / prisma.Venue
 * (Section 2 rule 2, Section 6).
 */

export function createTournament(data: Prisma.TournamentUncheckedCreateInput): Promise<Tournament> {
  return prisma.tournament.create({ data });
}

export function findTournamentById(id: string): Promise<Tournament | null> {
  return prisma.tournament.findUnique({ where: { id } });
}

export function findTournamentBySeasonName(season: string, name: string): Promise<Tournament | null> {
  return prisma.tournament.findUnique({ where: { season_name: { season, name } } });
}

export function updateTournament(id: string, data: Prisma.TournamentUncheckedUpdateInput): Promise<Tournament> {
  return prisma.tournament.update({ where: { id }, data });
}

export function deleteTournament(id: string): Promise<Tournament> {
  return prisma.tournament.delete({ where: { id } });
}

export function listTournaments(params: {
  skip: number;
  take: number;
  status?: string;
}): Promise<{ items: Tournament[]; total: number }> {
  const where = params.status ? { status: params.status as never } : {};
  // Plain parallel queries instead of interactive $transaction — no
  // dedicated pooled connection required, so it can't hit the
  // transaction-start timeout.
  return Promise.all([
    prisma.tournament.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.tournament.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}

export function findActiveTournament(): Promise<Tournament | null> {
  return prisma.tournament.findFirst({
    where: { isActive: true },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });
}

/** Ensures a single active tournament — deactivates all others first. */
export async function setActiveTournament(id: string): Promise<void> {
  await prisma.$transaction([
    prisma.tournament.updateMany({ where: { isActive: true }, data: { isActive: false } }),
    prisma.tournament.update({ where: { id }, data: { isActive: true } }),
  ]);
}

export function createVenue(data: Prisma.VenueUncheckedCreateInput): Promise<Venue> {
  return prisma.venue.create({ data });
}

export function findVenueById(id: string): Promise<Venue | null> {
  return prisma.venue.findUnique({ where: { id } });
}

export function updateVenue(id: string, data: Prisma.VenueUncheckedUpdateInput): Promise<Venue> {
  return prisma.venue.update({ where: { id }, data });
}

export function deleteVenue(id: string): Promise<Venue> {
  return prisma.venue.delete({ where: { id } });
}

export function listVenues(params: {
  skip: number;
  take: number;
  city?: string;
}): Promise<{ items: Venue[]; total: number }> {
  const where = params.city ? { city: { equals: params.city, mode: "insensitive" as const } } : {};
  return Promise.all([
    prisma.venue.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.venue.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}
