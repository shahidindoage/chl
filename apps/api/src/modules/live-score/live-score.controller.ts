import type { Request, Response } from "express";

import { audit } from "../activity-log/activity-log.service.js";
import * as liveService from "./live-score.service.js";
import type {
  EndMatchControlInput,
  LiveScoreInput,
  PublishCommentaryInput,
  StartMatchControlInput,
} from "./live-score.schema.js";

/** Controller: parses req, calls service, shapes response (Section 6). */

export async function start(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const status = await liveService.startMatch(matchId, req.body as StartMatchControlInput);
  audit(req, { action: "live.start", entity: "match", entityId: matchId, metadata: { status } });
  res.status(200).json({ status });
}

export async function pause(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const status = await liveService.pauseMatch(matchId);
  audit(req, { action: "live.pause", entity: "match", entityId: matchId });
  res.status(200).json({ status });
}

export async function resume(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const status = await liveService.resumeMatch(matchId);
  audit(req, { action: "live.resume", entity: "match", entityId: matchId });
  res.status(200).json({ status });
}

export async function end(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const status = await liveService.endMatch(matchId, req.body as EndMatchControlInput);
  // Ending a live match is what settles predictions, same as updateResult.
  audit(req, {
    action: "live.end",
    entity: "match",
    entityId: matchId,
    metadata: { status, predictionsScored: true },
  });
  res.status(200).json({ status });
}

export async function updateScore(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const status = await liveService.updateLiveScore(matchId, req.body as LiveScoreInput);
  const body = req.body as LiveScoreInput;
  audit(req, {
    action: "live.score.update",
    entity: "match",
    entityId: matchId,
    metadata: { teamAScore: body.teamAScore, teamBScore: body.teamBScore, minute: body.minute },
  });
  res.status(200).json({ status });
}

export async function publish(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const line = await liveService.publishCommentary(matchId, req.body as PublishCommentaryInput);
  // Only the type is logged — commentary bodies are editorial content, not audit
  // context, and could be long.
  audit(req, {
    action: "live.commentary.publish",
    entity: "commentary",
    entityId: line.id,
    metadata: { matchId, type: line.type },
  });
  res.status(201).json({ commentary: line });
}

export async function removeCommentary(req: Request, res: Response): Promise<void> {
  const { commentaryId } = req.params as { commentaryId: string };
  const result = await liveService.deleteCommentaryLine(commentaryId);
  audit(req, { action: "live.commentary.delete", entity: "commentary", entityId: commentaryId });
  res.status(200).json(result);
}

export async function feed(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const result = await liveService.getLiveFeed(matchId, page, limit);
  res.status(200).json(result);
}
