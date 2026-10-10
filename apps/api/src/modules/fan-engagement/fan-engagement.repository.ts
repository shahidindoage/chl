import type { Prediction, Prisma, Quiz, QuizAnswer, QuizAttempt, QuizQuestion } from "@prisma/client";

import type { QuizOption } from "@tournament/shared";

import { prisma } from "../../core/lib/prisma.js";

/**
 * The ONLY file allowed to touch prisma.Quiz / QuizQuestion / QuizAttempt /
 * QuizAnswer / Prediction (Section 2 rule 2). Match and User display info is
 * never joined here — callers use the match/auth services instead.
 */

export type QuizRow = Quiz;
export type QuizQuestionRow = QuizQuestion;
export type QuizAttemptRow = QuizAttempt;
export type QuizAnswerRow = QuizAnswer;
export type PredictionRow = Prediction;
export type QuizWithQuestions = Quiz & { questions: QuizQuestion[] };
export type QuizAttemptWithQuiz = QuizAttempt & { quiz: { title: string } };

/* ---------------- Quiz ---------------- */

const quizInclude = { questions: { orderBy: { position: "asc" as const } } };

type QuestionCreate = {
  question: string;
  type: QuizQuestion["type"];
  options: QuizOption[];
  correctKey: string;
  points: number | null;
  position: number;
};

function questionData(quizId: string, q: QuestionCreate) {
  return {
    quizId,
    question: q.question,
    type: q.type,
    // Prisma's Json type is narrower than our option array.
    options: q.options as unknown as Prisma.InputJsonValue,
    correctKey: q.correctKey,
    points: q.points,
    position: q.position,
  };
}

export function createQuiz(data: {
  title: string;
  description: string | null;
  status: Quiz["status"];
  pointsPerQuestion: number;
  opensAt: Date | null;
  closesAt: Date | null;
  questions: QuestionCreate[];
}): Promise<QuizWithQuestions> {
  // quizId is unknown until the parent exists, so create the quiz first and
  // then attach its questions in the same transaction.
  return prisma.$transaction(async (tx) => {
    const quiz = await tx.quiz.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        pointsPerQuestion: data.pointsPerQuestion,
        opensAt: data.opensAt,
        closesAt: data.closesAt,
      },
    });
    await tx.quizQuestion.createMany({
      data: data.questions.map((q) => questionData(quiz.id, q)),
    });
    return tx.quiz.findUniqueOrThrow({
      where: { id: quiz.id },
      include: quizInclude,
    });
  });
}

export function findQuizById(id: string): Promise<QuizWithQuestions | null> {
  return prisma.quiz.findUnique({ where: { id }, include: quizInclude });
}

export function updateQuiz(id: string, data: {
  title: string;
  description: string | null;
  status: Quiz["status"];
  pointsPerQuestion: number;
  opensAt: Date | null;
  closesAt: Date | null;
  questions: {
    question: string;
    type: QuizQuestion["type"];
    options: unknown;
    correctKey: string;
    points: number | null;
    position: number;
  }[];
}): Promise<QuizWithQuestions> {
  // Questions are replaced wholesale, same as the Module 7 gallery editor —
  // but existing answers are kept: deleting them would wipe fan scores.
  return prisma.$transaction(async (tx) => {
    const keepIds: string[] = [];
    for (const [index, q] of data.questions.entries()) {
      // Reuse the existing row at this position so its answers survive.
      const existingAtPosition = await tx.quizQuestion.findFirst({
        where: { quizId: id, position: index },
        orderBy: { position: "asc" },
      });
      if (existingAtPosition) {
        await tx.quizQuestion.update({
          where: { id: existingAtPosition.id },
          data: {
            question: q.question,
            type: q.type,
            options: q.options as never,
            correctKey: q.correctKey,
            points: q.points,
          },
        });
        keepIds.push(existingAtPosition.id);
      } else {
        const created = await tx.quizQuestion.create({
          data: {
            quizId: id,
            question: q.question,
            type: q.type,
            options: q.options as never,
            correctKey: q.correctKey,
            points: q.points,
            position: index,
          },
        });
        keepIds.push(created.id);
      }
    }
    await tx.quizQuestion.deleteMany({
      where: { quizId: id, ...(keepIds.length > 0 ? { id: { notIn: keepIds } } : {}) },
    });
    return tx.quiz.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        pointsPerQuestion: data.pointsPerQuestion,
        opensAt: data.opensAt,
        closesAt: data.closesAt,
      },
      include: quizInclude,
    });
  });
}

export function setQuizStatus(id: string, status: Quiz["status"]): Promise<QuizRow> {
  return prisma.quiz.update({ where: { id }, data: { status } });
}

export function deleteQuiz(id: string): Promise<QuizRow> {
  return prisma.quiz.delete({ where: { id } });
}

export function listQuizzes(params: {
  skip: number;
  take: number;
  status?: string;
}): Promise<{ items: QuizWithQuestions[]; total: number }> {
  const where = params.status ? { status: params.status as Quiz["status"] } : {};
  return Promise.all([
    prisma.quiz.findMany({ where, skip: params.skip, take: params.take, orderBy: { createdAt: "desc" }, include: quizInclude }),
    prisma.quiz.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}

/** Dashboard aggregate — read by the admin module via the service (rule 2). */
export function countQuizzesByStatus(): Promise<Record<string, number>> {
  return prisma.quiz.groupBy({ by: ["status"], _count: { _all: true } }).then((rows) =>
    rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = r._count._all;
      return acc;
    }, {})
  );
}

/** Dashboard aggregate — participation totals for the fan-engagement panel. */
export function countFanEngagement(): Promise<{ attempts: number; predictions: number }> {
  return Promise.all([prisma.quizAttempt.count(), prisma.prediction.count()]).then(
    ([attempts, predictions]) => ({ attempts, predictions })
  );
}

/* ---------------- Attempts ---------------- */

export function findAttempt(quizId: string, userId: string): Promise<QuizAttemptRow | null> {
  return prisma.quizAttempt.findUnique({ where: { quizId_userId: { quizId, userId } } });
}

export function findAttemptById(id: string): Promise<QuizAttemptWithQuiz | null> {
  return prisma.quizAttempt.findUnique({ where: { id }, include: { quiz: { select: { title: true } } } });
}

export function createAttempt(data: {
  quizId: string;
  userId: string;
  score: number;
  maxScore: number;
  answers: { questionId: string; selectedKey: string; isCorrect: boolean }[];
}): Promise<QuizAttemptRow> {
  return prisma.quizAttempt.create({
    data: {
      quizId: data.quizId,
      userId: data.userId,
      score: data.score,
      maxScore: data.maxScore,
      answers: { create: data.answers },
    },
  });
}

export function listAttempts(quizId: string): Promise<QuizAttemptRow[]> {
  return prisma.quizAttempt.findMany({ where: { quizId }, orderBy: [{ score: "desc" }, { submittedAt: "asc" }] });
}

/** Per-user totals for the leaderboard projection. */
export async function quizTotalsByUser(): Promise<Map<string, number>> {
  const rows = await prisma.quizAttempt.findMany({ select: { userId: true, score: true } });
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.userId, (totals.get(row.userId) ?? 0) + row.score);
  return totals;
}

/* ---------------- Predictions ---------------- */

export function createPrediction(data: {
  matchId: string;
  userId: string;
  predictedWinnerId: string;
  predictedScore: string | null;
}): Promise<PredictionRow> {
  return prisma.prediction.create({ data });
}

export function findPrediction(matchId: string, userId: string): Promise<PredictionRow | null> {
  return prisma.prediction.findUnique({ where: { matchId_userId: { matchId, userId } } });
}

export function listPredictions(matchId: string, skip: number, take: number): Promise<{ items: PredictionRow[]; total: number }> {
  const where = { matchId };
  return Promise.all([
    prisma.prediction.findMany({ where, skip, take, orderBy: { createdAt: "asc" } }),
    prisma.prediction.count({ where }),
  ]).then(([items, total]) => ({ items, total }));
}

/** Per-user correct-prediction counts for the leaderboard projection. */
export async function predictionTotalsByUser(): Promise<Map<string, number>> {
  const rows = await prisma.prediction.findMany({
    where: { isCorrect: true },
    select: { userId: true },
  });
  const totals = new Map<string, number>();
  for (const row of rows) totals.set(row.userId, (totals.get(row.userId) ?? 0) + 1);
  return totals;
}

/** All predictions for a match — used when scoring that match. */
export function listUnscoredPredictions(matchId: string): Promise<PredictionRow[]> {
  return prisma.prediction.findMany({ where: { matchId, isCorrect: null } });
}

export function markPredictionScored(id: string, isCorrect: boolean, scoredAt: Date): Promise<PredictionRow> {
  return prisma.prediction.update({ where: { id }, data: { isCorrect, scoredAt } });
}