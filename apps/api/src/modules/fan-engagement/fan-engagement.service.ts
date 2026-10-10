import type {
  LeaderboardEntryDto,
  ListPredictionsQuery,
  ListQuizzesQuery,
  PredictionDto,
  QuizAttemptDto,
  QuizDto,
  QuizOption,
  SubmitAttemptInput,
  SubmitPredictionInput,
} from "@tournament/shared";

import { ApiError } from "../../core/utils/ApiError.js";
import { getMatch } from "../match/match.service.js";
import * as repo from "./fan-engagement.repository.js";

/**
 * Module 8 — Fan Engagement (Section 8).
 *
 * Rules that matter here:
 *  - A fan attempts each quiz ONCE (unique index, surfaced as 409).
 *  - correctKey never leaves this module to a non-manager.
 *  - Predictions lock at kickoff: the match must be upcoming and in the future,
 *    and the predicted winner must be one of the two teams.
 *  - Leaderboard aggregates quiz scores + scored-correct predictions.
 */

export interface Actor {
  id: string;
  role: string;
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

function parseOptions(raw: unknown): QuizOption[] {
  return Array.isArray(raw) ? (raw as QuizOption[]) : [];
}

function isManager(actor?: Actor): boolean {
  return actor?.role === "super_admin" || actor?.role === "quiz_manager";
}

/** Strips correctKey — a fan must never receive the answers. */
function toQuizDto(q: repo.QuizWithQuestions, includeAnswers: boolean): QuizDto {
  return {
    id: q.id,
    title: q.title,
    description: q.description,
    status: q.status,
    pointsPerQuestion: q.pointsPerQuestion,
    opensAt: q.opensAt ? q.opensAt.toISOString() : null,
    closesAt: q.closesAt ? q.closesAt.toISOString() : null,
    createdAt: q.createdAt.toISOString(),
    updatedAt: q.updatedAt.toISOString(),
    questions: q.questions.map((question) => {
      const base = {
        id: question.id,
        question: question.question,
        type: question.type,
        options: parseOptions(question.options),
        position: question.position,
        points: question.points,
      };
      return includeAnswers ? { ...base, correctKey: question.correctKey } : base;
    }) as QuizDto["questions"],
  };
}

function toAttemptDto(a: repo.QuizAttemptRow): QuizAttemptDto {
  return {
    id: a.id,
    quizId: a.quizId,
    userId: a.userId,
    score: a.score,
    maxScore: a.maxScore,
    submittedAt: a.submittedAt.toISOString(),
  };
}

function toPredictionDto(p: repo.PredictionRow): PredictionDto {
  return {
    id: p.id,
    matchId: p.matchId,
    userId: p.userId,
    predictedWinnerId: p.predictedWinnerId,
    predictedScore: p.predictedScore,
    isCorrect: p.isCorrect,
    scoredAt: p.scoredAt ? p.scoredAt.toISOString() : null,
    createdAt: p.createdAt.toISOString(),
  };
}

/* ---------------- Quiz CRUD ---------------- */

interface QuizInput {
  title: string;
  description?: string | null;
  status: "draft" | "active" | "closed";
  pointsPerQuestion: number;
  opensAt?: Date | null;
  closesAt?: Date | null;
  questions: {
    question: string;
    type: "single_choice" | "true_false";
    options: QuizOption[];
    correctKey: string;
    points?: number | null;
  }[];
}

export async function createQuiz(input: QuizInput): Promise<QuizDto> {
  return toQuizDto(
    await repo.createQuiz({
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      pointsPerQuestion: input.pointsPerQuestion,
      opensAt: input.opensAt ?? null,
      closesAt: input.closesAt ?? null,
      questions: input.questions.map((q, index) => ({
        question: q.question,
        type: q.type,
        options: q.options,
        correctKey: q.correctKey,
        points: q.points ?? null,
        position: index,
      })),
    }),
    true
  );
}

export async function updateQuiz(id: string, input: QuizInput): Promise<QuizDto> {
  const existing = await repo.findQuizById(id);
  if (!existing) throw ApiError.notFound("Quiz not found");
  return toQuizDto(
    await repo.updateQuiz(id, {
      title: input.title,
      description: input.description ?? null,
      status: input.status,
      pointsPerQuestion: input.pointsPerQuestion,
      opensAt: input.opensAt ?? null,
      closesAt: input.closesAt ?? null,
      questions: input.questions.map((q, index) => ({
        question: q.question,
        type: q.type,
        options: q.options,
        correctKey: q.correctKey,
        points: q.points ?? null,
        position: index,
      })),
    }),
    true
  );
}

export async function setQuizStatus(id: string, status: "draft" | "active" | "closed"): Promise<QuizDto> {
  const existing = await repo.findQuizById(id);
  if (!existing) throw ApiError.notFound("Quiz not found");
  const updated = await repo.setQuizStatus(id, status);
  return toQuizDto({ ...updated, questions: existing.questions }, true);
}

export async function deleteQuiz(id: string): Promise<{ deleted: true; id: string }> {
  const existing = await repo.findQuizById(id);
  if (!existing) throw ApiError.notFound("Quiz not found");
  await repo.deleteQuiz(id);
  return { deleted: true, id };
}

export async function getQuiz(id: string, actor?: Actor): Promise<QuizDto> {
  const found = await repo.findQuizById(id);
  if (!found) throw ApiError.notFound("Quiz not found");
  if (found.status === "draft" && !isManager(actor)) throw ApiError.notFound("Quiz not found");
  return toQuizDto(found, isManager(actor));
}

export async function listQuizzes(
  query: ListQuizzesQuery,
  actor?: Actor
): Promise<{ items: QuizDto[]; pagination: ReturnType<typeof pagination> }> {
  const manager = isManager(actor);
  const status = query.status ?? (manager ? undefined : "active");
  const { items, total } = await repo.listQuizzes({
    skip: (query.page - 1) * query.limit,
    take: query.limit,
    ...(status ? { status } : {}),
  });
  return {
    items: items.filter((q) => manager || q.status !== "draft").map((q) => toQuizDto(q, manager)),
    pagination: pagination(query.page, query.limit, total),
  };
}

/** Dashboard aggregates, exposed for the admin module (it must not read prisma). */
export async function getFanEngagementStats(): Promise<{
  quizzes: Record<string, number>;
  attempts: number;
  predictions: number;
}> {
  const [quizzes, totals] = await Promise.all([
    repo.countQuizzesByStatus(),
    repo.countFanEngagement(),
  ]);
  return { quizzes, ...totals };
}



/* ---------------- Attempting ---------------- */

function assertQuizOpen(quiz: repo.QuizRow, now: Date): void {
  if (quiz.status !== "active") throw ApiError.badRequest("This quiz is not open for attempts");
  if (quiz.opensAt && now < quiz.opensAt) throw ApiError.badRequest("This quiz has not opened yet");
  if (quiz.closesAt && now > quiz.closesAt) throw ApiError.badRequest("This quiz has closed");
}

export async function submitAttempt(quizId: string, input: SubmitAttemptInput, actor: Actor): Promise<QuizAttemptDto> {
  const quiz = await repo.findQuizById(quizId);
  if (!quiz) throw ApiError.notFound("Quiz not found");
  assertQuizOpen(quiz, new Date());

  if (await repo.findAttempt(quizId, actor.id)) {
    throw ApiError.conflict("You have already attempted this quiz");
  }

  const questionsById = new Map(quiz.questions.map((q) => [q.id, q]));
  let score = 0;
  let maxScore = 0;
  const graded = input.answers.map((answer) => {
    const question = questionsById.get(answer.questionId);
    if (!question) throw ApiError.badRequest("Unknown question in answer set");
    const points = question.points ?? quiz.pointsPerQuestion;
    maxScore += points;
    const isCorrect = question.correctKey === answer.selectedKey;
    if (isCorrect) score += points;
    return { questionId: question.id, selectedKey: answer.selectedKey, isCorrect };
  });

  try {
    return toAttemptDto(
      await repo.createAttempt({ quizId, userId: actor.id, score, maxScore, answers: graded })
    );
  } catch (error) {
    // The unique index is the real guard against two concurrent submissions.
    if ((error as { code?: string }).code === "P2002") {
      throw ApiError.conflict("You have already attempted this quiz");
    }
    throw error;
  }
}

export async function getMyAttempt(quizId: string, actor: Actor): Promise<QuizAttemptDto | null> {
  const found = await repo.findAttempt(quizId, actor.id);
  return found ? toAttemptDto(found) : null;
}

export async function listQuizAttempts(quizId: string): Promise<{ attempts: QuizAttemptDto[]; total: number }> {
  const quiz = await repo.findQuizById(quizId);
  if (!quiz) throw ApiError.notFound("Quiz not found");
  const attempts = await repo.listAttempts(quizId);
  return { attempts: attempts.map(toAttemptDto), total: attempts.length };
}

/* ---------------- Predictions ---------------- */

export async function submitPrediction(
  matchId: string,
  input: SubmitPredictionInput,
  actor: Actor
): Promise<PredictionDto> {
  // Match data (and its 404) comes from the match module's service — rule 2.
  const match = await getMatch(matchId);

  if (match.status !== "upcoming") {
    throw ApiError.badRequest("Predictions close once the match starts");
  }
  if (new Date(match.date).getTime() <= Date.now()) {
    throw ApiError.badRequest("Predictions close at kickoff");
  }
  if (input.predictedWinnerId !== match.teamAId && input.predictedWinnerId !== match.teamBId) {
    throw ApiError.badRequest("Pick one of the two teams in this match");
  }

  if (await repo.findPrediction(matchId, actor.id)) {
    throw ApiError.conflict("You have already predicted this match");
  }

  try {
    return toPredictionDto(
      await repo.createPrediction({
        matchId,
        userId: actor.id,
        predictedWinnerId: input.predictedWinnerId,
        predictedScore: input.predictedScore ?? null,
      })
    );
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      throw ApiError.conflict("You have already predicted this match");
    }
    throw error;
  }
}

export async function getMyPrediction(matchId: string, actor: Actor): Promise<PredictionDto | null> {
  const found = await repo.findPrediction(matchId, actor.id);
  return found ? toPredictionDto(found) : null;
}

export async function listPredictions(query: ListPredictionsQuery): Promise<{
  items: PredictionDto[];
  pagination: ReturnType<typeof pagination>;
}> {
  if (!query.matchId) throw ApiError.badRequest("matchId is required");
  const { items, total } = await repo.listPredictions(
    query.matchId,
    (query.page - 1) * query.limit,
    query.limit
  );
  return { items: items.map(toPredictionDto), pagination: pagination(query.page, query.limit, total) };
}

/* ---------------- Scoring (called by the match module) ---------------- */

/**
 * Score a match's predictions once it reaches a final result (Section 8:
 * "scored on match completion").
 *
 * A draw marks every prediction incorrect — there is no winner to have
 * predicted. Re-running is safe: only unscored rows are touched.
 */
export async function scorePredictionsForMatch(match: {
  id: string;
  teamAId: string;
  teamBId: string;
  teamAScore: number;
  teamBScore: number;
}): Promise<number> {
  const winnerId =
    match.teamAScore === match.teamBScore ? null : match.teamAScore > match.teamBScore ? match.teamAId : match.teamBId;

  const pending = await repo.listUnscoredPredictions(match.id);
  const now = new Date();
  await Promise.all(
    pending.map((p) =>
      repo.markPredictionScored(p.id, winnerId !== null && p.predictedWinnerId === winnerId, now)
    )
  );
  return pending.length;
}

/* ---------------- Leaderboard ---------------- */

/** Names come from the auth module so this repository never reads User. */
export async function getLeaderboard(
  limit: number,
  resolveNames: (ids: string[]) => Promise<Map<string, string>>
): Promise<LeaderboardEntryDto[]> {
  const [quizTotals, predictionTotals] = await Promise.all([
    repo.quizTotalsByUser(),
    repo.predictionTotalsByUser(),
  ]);

  const ids = new Set<string>([...quizTotals.keys(), ...predictionTotals.keys()]);
  const names = await resolveNames([...ids]);

  return [...ids]
    .map((userId) => {
      const quizPoints = quizTotals.get(userId) ?? 0;
      const predictionPoints = predictionTotals.get(userId) ?? 0;
      return {
        userId,
        name: names.get(userId) ?? "Supporter",
        quizPoints,
        predictionPoints,
        total: quizPoints + predictionPoints,
      };
    })
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name))
    .slice(0, limit);
}