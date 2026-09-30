import type { CommentaryDto, LiveStatusDto } from "@tournament/shared";
import type {
  EndMatchControlInput,
  LiveScoreInput,
  PublishCommentaryInput,
  StartMatchControlInput,
} from "@tournament/shared";

import type { Commentary } from "@prisma/client";

import { ApiError } from "../../core/utils/ApiError.js";
import { publishLiveEvent } from "../../core/lib/redis.js";
import { getMatch, applyLiveControl } from "../match/match.service.js";
import * as repo from "./live-score.repository.js";

/**
 * Module 5 — the live control layer. score_manager starts/pauses/resumes/
 * ends a match; score+clock updates and commentary lines stream to the
 * Socket.io room `match:{id}` through the Redis bridge (Section 9:
 * write → publish → broadcast — the API never touches sockets directly).
 * All Match-row writes go through match.service.applyLiveControl (rule 2).
 */

function toCommentaryDto(c: Commentary): CommentaryDto {
  return {
    id: c.id,
    matchId: c.matchId,
    minute: c.minute,
    text: c.text,
    type: c.type,
    createdAt: c.createdAt.toISOString(),
  };
}

async function liveStatus(matchId: string): Promise<LiveStatusDto> {
  const m = await getMatch(matchId);
  return {
    matchId: m.id,
    status: m.status,
    isPaused: m.isPaused,
    currentMinute: m.currentMinute,
    currentPeriod: m.currentPeriod,
    teamAScore: m.teamAScore,
    teamBScore: m.teamBScore,
    serverTime: new Date().toISOString(),
  };
}

export async function startMatch(id: string, input: StartMatchControlInput): Promise<LiveStatusDto> {
  await applyLiveControl(id, "start", {
    currentMinute: input.minute,
    currentPeriod: input.period,
    isPaused: false,
  });
  return liveStatus(id);
}

export async function pauseMatch(id: string): Promise<LiveStatusDto> {
  await applyLiveControl(id, "pause", { isPaused: true });
  return liveStatus(id);
}

export async function resumeMatch(id: string): Promise<LiveStatusDto> {
  await applyLiveControl(id, "resume", { isPaused: false });
  return liveStatus(id);
}

export async function endMatch(id: string, input: EndMatchControlInput): Promise<LiveStatusDto> {
  const before = await liveStatus(id);
  await applyLiveControl(id, "end", {
    summary: input.summary ?? null,
    isPaused: false,
    currentMinute: before.currentMinute,
    currentPeriod: before.currentPeriod,
  });
  // Final broadcast so open viewers switch to the completed view instantly.
  await publishLiveEvent(id, "match:ended", { matchId: id, at: new Date().toISOString() });
  return liveStatus(id);
}

/** Update the live score (and optionally the clock). Broadcast on change. */
export async function updateLiveScore(id: string, input: LiveScoreInput): Promise<LiveStatusDto> {
  const before = await liveStatus(id);
  await applyLiveControl(id, "score", {
    teamAScore: input.teamAScore,
    teamBScore: input.teamBScore,
    ...(input.minute !== undefined ? { currentMinute: input.minute } : {}),
    ...(input.period !== undefined ? { currentPeriod: input.period } : {}),
  });
  const after = await liveStatus(id);
  if (
    after.teamAScore !== before.teamAScore ||
    after.teamBScore !== before.teamBScore ||
    after.currentMinute !== before.currentMinute ||
    after.currentPeriod !== before.currentPeriod
  ) {
    await publishLiveEvent(id, "match:score", after);
  }
  return after;
}

/** Publish a commentary line — stored, then broadcast to the room. */
export async function publishCommentary(id: string, input: PublishCommentaryInput): Promise<CommentaryDto> {
  const status = await liveStatus(id);
  if (status.status !== "live") {
    throw ApiError.badRequest(`Cannot publish commentary — match is ${status.status}`);
  }
  const created = await repo.createCommentary({
    matchId: id,
    minute: input.minute,
    text: input.text,
    type: input.type,
  });
  const dto = toCommentaryDto(created);
  await publishLiveEvent(id, "commentary:new", dto);
  return dto;
}

export async function deleteCommentaryLine(commentaryId: string): Promise<{ deleted: true; id: string }> {
  const existing = await repo.findCommentaryById(commentaryId);
  if (!existing) throw ApiError.notFound("Commentary line not found");
  await repo.deleteCommentary(commentaryId);
  await publishLiveEvent(existing.matchId, "commentary:deleted", { id: commentaryId });
  return { deleted: true, id: commentaryId };
}

/** GET feed — reconnecting clients fetch current state via REST (Section 9). */
export async function getLiveFeed(id: string, page: number, limit: number): Promise<{
  status: LiveStatusDto;
  commentary: CommentaryDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const status = await liveStatus(id);
  const { items, total } = await repo.listCommentary({
    matchId: id,
    skip: (page - 1) * limit,
    take: limit,
    newestFirst: true,
  });
  return {
    status,
    commentary: items.map(toCommentaryDto),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}
