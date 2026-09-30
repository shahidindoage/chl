import type { Player } from "@prisma/client";

import { prisma } from "../../core/lib/prisma.js";

/**
 * The ONLY file allowed to touch prisma.Player (Section 2 rule 2).
 * Player carries a denormalized tournamentId copied from its team by the
 * service layer.
 */

export type PlayerRow = Player;

export function createPlayer(data: {
  name: string;
  image: string | null;
  jerseyNumber: number;
  position: Player["position"];
  dateOfBirth: Date;
  nationality: string;
  teamId: string;
  tournamentId: string;
}): Promise<Player> {
  return prisma.player.create({ data });
}

export function findPlayerById(id: string): Promise<Player | null> {
  return prisma.player.findUnique({ where: { id } });
}

export function findPlayerByTeamJersey(teamId: string, jerseyNumber: number): Promise<Player | null> {
  return prisma.player.findUnique({
    where: { teamId_jerseyNumber: { teamId, jerseyNumber } },
  });
}

export function updatePlayer(id: string, data: {
  name: string;
  image: string | null;
  jerseyNumber: number;
  position: Player["position"];
  dateOfBirth: Date;
  nationality: string;
  teamId: string;
  tournamentId: string;
}): Promise<Player> {
  return prisma.player.update({ where: { id }, data });
}

export function deletePlayer(id: string): Promise<Player> {
  return prisma.player.delete({ where: { id } });
}

export function listPlayers(params: {
  skip: number;
  take: number;
  teamId?: string;
  tournamentId?: string;
  position?: string;
}): Promise<{ items: Player[]; total: number }> {
  const where = {
    ...(params.teamId ? { teamId: params.teamId } : {}),
    ...(params.tournamentId ? { tournamentId: params.tournamentId } : {}),
    ...(params.position ? { position: params.position as never } : {}),
  };
  return Promise.all([
    prisma.player.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: [{ teamId: "asc" }, { jerseyNumber: "asc" }],
    }),
    prisma.player.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}

/** Team display info is fetched via team.service.getTeam (Section 2 rule 2),
 *  so this repository never touches any model but Player. */
