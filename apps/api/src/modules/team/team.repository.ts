import type { Prisma, Sponsor, Team } from "@prisma/client";

import { prisma } from "../../core/lib/prisma.js";

/**
 * The ONLY file allowed to touch prisma.Team / prisma.Sponsor
 * (Section 2 rule 2, Section 6).
 */

export function createTeam(data: Prisma.TeamUncheckedCreateInput): Promise<Team> {
  return prisma.team.create({ data });
}

export function findTeamById(id: string): Promise<Team | null> {
  return prisma.team.findUnique({ where: { id } });
}

export function findTeamByTournamentName(tournamentId: string, name: string): Promise<Team | null> {
  return prisma.team.findUnique({ where: { tournamentId_name: { tournamentId, name } } });
}

export function updateTeam(id: string, data: Prisma.TeamUncheckedUpdateInput): Promise<Team> {
  return prisma.team.update({ where: { id }, data });
}

export function deleteTeam(id: string): Promise<Team> {
  return prisma.team.delete({ where: { id } });
}

export function listTeams(params: {
  skip: number;
  take: number;
  tournamentId?: string;
}): Promise<{ items: Team[]; total: number }> {
  const where = params.tournamentId ? { tournamentId: params.tournamentId } : {};
  return Promise.all([
    prisma.team.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: "desc" },
    }),
    prisma.team.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}

export function findTeamWithSponsors(id: string) {
  return prisma.team.findUnique({
    where: { id },
    include: { sponsors: { orderBy: { createdAt: "asc" } } },
  });
}

export function createSponsor(data: Prisma.SponsorUncheckedCreateInput): Promise<Sponsor> {
  return prisma.sponsor.create({ data });
}

export function findSponsorById(id: string): Promise<Sponsor | null> {
  return prisma.sponsor.findUnique({ where: { id } });
}

export function updateSponsor(id: string, data: Prisma.SponsorUncheckedUpdateInput): Promise<Sponsor> {
  return prisma.sponsor.update({ where: { id }, data });
}

export function deleteSponsor(id: string): Promise<Sponsor> {
  return prisma.sponsor.delete({ where: { id } });
}
