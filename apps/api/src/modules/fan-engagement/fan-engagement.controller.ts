import type { Request, Response } from "express";

import { ApiError } from "../../core/utils/ApiError.js";
import { audit } from "../activity-log/activity-log.service.js";
import { listUsers } from "../auth/auth.service.js";
import * as service from "./fan-engagement.service.js";
import type {
  ListPredictionsQuery,
  ListQuizzesQuery,
  SubmitAttemptInput,
  SubmitPredictionInput,
} from "./fan-engagement.schema.js";

/** Controller: parses req, calls service, shapes response (Section 6). */

function actor(req: Request): service.Actor {
  if (!req.user) throw ApiError.unauthorized();
  return { id: req.user.id, role: req.user.role };
}

function optionalActor(req: Request): service.Actor | undefined {
  if (!req.user) return undefined;
  return { id: req.user.id, role: req.user.role };
}

/* ---------------- Quiz ---------------- */

export async function listQuizzes(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListQuizzesQuery;
  const result = await service.listQuizzes(query, optionalActor(req));
  res.status(200).json(result);
}

export async function getQuiz(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const quiz = await service.getQuiz(id, optionalActor(req));
  res.status(200).json({ quiz });
}

export async function createQuiz(req: Request, res: Response): Promise<void> {
  actor(req);
  const quiz = await service.createQuiz(req.body);
  audit(req, {
    action: "quiz.create",
    entity: "quiz",
    entityId: quiz.id,
    metadata: { title: quiz.title, questions: quiz.questions.length },
  });
  res.status(201).json({ quiz });
}

export async function updateQuiz(req: Request, res: Response): Promise<void> {
  actor(req);
  const { id } = req.params as { id: string };
  const quiz = await service.updateQuiz(id, req.body);
  audit(req, {
    action: "quiz.update",
    entity: "quiz",
    entityId: quiz.id,
    metadata: { questions: quiz.questions.length },
  });
  res.status(200).json({ quiz });
}

export async function setQuizStatus(req: Request, res: Response): Promise<void> {
  actor(req);
  const { id } = req.params as { id: string };
  const { status } = req.body as { status: "draft" | "active" | "closed" };
  const quiz = await service.setQuizStatus(id, status);
  audit(req, { action: "quiz.status.update", entity: "quiz", entityId: quiz.id, metadata: { status } });
  res.status(200).json({ quiz });
}

export async function deleteQuiz(req: Request, res: Response): Promise<void> {
  actor(req);
  const { id } = req.params as { id: string };
  const result = await service.deleteQuiz(id);
  audit(req, { action: "quiz.delete", entity: "quiz", entityId: id });
  res.status(200).json(result);
}

/* ---------------- Attempting ---------------- */

export async function submitAttempt(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const attempt = await service.submitAttempt(id, req.body as SubmitAttemptInput, actor(req));
  res.status(201).json({ attempt });
}

export async function getMyAttempt(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const attempt = await service.getMyAttempt(id, actor(req));
  res.status(200).json({ attempt });
}

export async function listQuizAttempts(req: Request, res: Response): Promise<void> {
  actor(req);
  const { id } = req.params as { id: string };
  const result = await service.listQuizAttempts(id);
  res.status(200).json(result);
}

/* ---------------- Predictions ---------------- */

export async function submitPrediction(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const prediction = await service.submitPrediction(
    matchId,
    req.body as SubmitPredictionInput,
    actor(req)
  );
  res.status(201).json({ prediction });
}

export async function getMyPrediction(req: Request, res: Response): Promise<void> {
  const { matchId } = req.params as { matchId: string };
  const prediction = await service.getMyPrediction(matchId, actor(req));
  res.status(200).json({ prediction });
}

/**
 * Read-only for managers, but worth auditing: it exposes every supporter's
 * pick for a match, which is the closest thing to personal data in this module.
 */
export async function listPredictions(req: Request, res: Response): Promise<void> {
  actor(req);
  const { matchId } = req.params as { matchId?: string };
  audit(req, { action: "prediction.list", entity: "prediction", entityId: matchId ?? null });
  const query = req.query as unknown as ListPredictionsQuery;
  const result = await service.listPredictions(query);
  res.status(200).json(result);
}

/* ---------------- Leaderboard ---------------- */

export async function getLeaderboard(req: Request, res: Response): Promise<void> {
  const { limit } = req.query as unknown as { limit: number };
  // Names come from the auth module (rule 2) — this repository never reads User.
  const entries = await service.getLeaderboard(limit, async (ids) => {
    if (ids.length === 0) return new Map<string, string>();
    const { items } = await listUsers(1, 100);
    const byId = new Map<string, string>(items.map((u) => [u.id, u.name]));
    return new Map(ids.map((id) => [id, byId.get(id) ?? "Supporter"]));
  });
  res.status(200).json({ entries });
}