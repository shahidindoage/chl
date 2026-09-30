import type { Request, Response } from "express";

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
  res.status(200).json({ status });
}

export async function pause(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const status = await liveService.pauseMatch(matchId);
  res.status(200).json({ status });
}

export async function resume(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const status = await liveService.resumeMatch(matchId);
  res.status(200).json({ status });
}

export async function end(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const status = await liveService.endMatch(matchId, req.body as EndMatchControlInput);
  res.status(200).json({ status });
}

export async function updateScore(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const status = await liveService.updateLiveScore(matchId, req.body as LiveScoreInput);
  res.status(200).json({ status });
}

export async function publish(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const line = await liveService.publishCommentary(matchId, req.body as PublishCommentaryInput);
  res.status(201).json({ commentary: line });
}

export async function removeCommentary(req: Request, res: Response): Promise<void> {
  const { commentaryId } = req.params as { commentaryId: string };
  const result = await liveService.deleteCommentaryLine(commentaryId);
  res.status(200).json(result);
}

export async function feed(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const result = await liveService.getLiveFeed(matchId, page, limit);
  res.status(200).json(result);
}
