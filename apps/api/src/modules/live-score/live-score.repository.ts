import type { Commentary, Prisma } from "@prisma/client";

import { prisma } from "../../core/lib/prisma.js";

/**
 * The ONLY file allowed to touch prisma.Commentary (Section 2 rule 2).
 * Match status/score writes go through match.service.applyLiveControl —
 * this module never touches prisma.Match.
 */

export function createCommentary(data: Prisma.CommentaryUncheckedCreateInput): Promise<Commentary> {
  return prisma.commentary.create({ data });
}

export function findCommentaryById(id: string): Promise<Commentary | null> {
  return prisma.commentary.findUnique({ where: { id } });
}

export function deleteCommentary(id: string): Promise<Commentary> {
  return prisma.commentary.delete({ where: { id } });
}

export function listCommentary(params: {
  matchId: string;
  skip: number;
  take: number;
  /** newest first for feeds; false for building an ordered log */
  newestFirst: boolean;
}): Promise<{ items: Commentary[]; total: number }> {
  const where = { matchId: params.matchId };
  const order = params.newestFirst
    ? ([{ createdAt: "desc" }] as Prisma.CommentaryOrderByWithRelationInput[])
    : ([{ minute: "asc" }, { createdAt: "asc" }] as Prisma.CommentaryOrderByWithRelationInput[]);
  return Promise.all([
    prisma.commentary.findMany({ where, skip: params.skip, take: params.take, orderBy: order }),
    prisma.commentary.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}
