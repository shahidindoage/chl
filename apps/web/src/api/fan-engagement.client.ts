import type {
  LeaderboardEntryDto,
  PredictionDto,
  QuizAttemptDto,
  QuizDto,
  QuizOption,
  SubmitAttemptInput,
  SubmitPredictionInput,
} from "@tournament/shared";

import { http } from "./client.js";
import type { Paginated } from "./tournament.client.js";

/** Module 8 — typed functions 1:1 with apps/api fan-engagement routes. */

export interface QuizQuestionInput {
  question: string;
  type?: "single_choice" | "true_false";
  options: QuizOption[];
  correctKey: string;
  points?: number | null;
}

export interface QuizInput {
  title: string;
  description?: string | null;
  status?: "draft" | "active" | "closed";
  pointsPerQuestion?: number;
  opensAt?: string | null;
  closesAt?: string | null;
  questions: QuizQuestionInput[];
}

/* ---------------- Quiz ---------------- */

export async function listQuizzes(
  params: { status?: "draft" | "active" | "closed"; page?: number; limit?: number } = {}
): Promise<Paginated<QuizDto>> {
  const { data } = await http.get<Paginated<QuizDto>>("/fans/quizzes", { params });
  return data;
}

export async function getQuiz(id: string): Promise<QuizDto> {
  const { data } = await http.get<{ quiz: QuizDto }>(`/fans/quizzes/${id}`);
  return data.quiz;
}

export async function createQuiz(input: QuizInput): Promise<QuizDto> {
  const { data } = await http.post<{ quiz: QuizDto }>("/fans/quizzes", input);
  return data.quiz;
}

export async function updateQuiz(id: string, input: QuizInput): Promise<QuizDto> {
  const { data } = await http.put<{ quiz: QuizDto }>(`/fans/quizzes/${id}`, input);
  return data.quiz;
}

export async function setQuizStatus(id: string, status: "draft" | "active" | "closed"): Promise<QuizDto> {
  const { data } = await http.post<{ quiz: QuizDto }>(`/fans/quizzes/${id}/status`, { status });
  return data.quiz;
}

export async function deleteQuiz(id: string): Promise<void> {
  await http.delete(`/fans/quizzes/${id}`);
}

/* ---------------- Attempting ---------------- */

export async function submitAttempt(quizId: string, input: SubmitAttemptInput): Promise<QuizAttemptDto> {
  const { data } = await http.post<{ attempt: QuizAttemptDto }>(`/fans/quizzes/${quizId}/attempts`, input);
  return data.attempt;
}

export async function getMyAttempt(quizId: string): Promise<QuizAttemptDto | null> {
  const { data } = await http.get<{ attempt: QuizAttemptDto | null }>(`/fans/quizzes/${quizId}/attempts/me`);
  return data.attempt;
}

export async function listQuizAttempts(quizId: string): Promise<{ attempts: QuizAttemptDto[]; total: number }> {
  const { data } = await http.get<{ attempts: QuizAttemptDto[]; total: number }>(`/fans/quizzes/${quizId}/attempts`);
  return data;
}

/* ---------------- Predictions ---------------- */

export async function submitPrediction(matchId: string, input: SubmitPredictionInput): Promise<PredictionDto> {
  const { data } = await http.post<{ prediction: PredictionDto }>(`/fans/matches/${matchId}/predictions`, input);
  return data.prediction;
}

export async function getMyPrediction(matchId: string): Promise<PredictionDto | null> {
  const { data } = await http.get<{ prediction: PredictionDto | null }>(`/fans/matches/${matchId}/predictions/me`);
  return data.prediction;
}

export async function listPredictions(
  matchId: string,
  params: { page?: number; limit?: number } = {}
): Promise<Paginated<PredictionDto>> {
  const { data } = await http.get<Paginated<PredictionDto>>(`/fans/matches/${matchId}/predictions`, { params });
  return data;
}

/* ---------------- Leaderboard ---------------- */

export async function getLeaderboard(limit = 20): Promise<LeaderboardEntryDto[]> {
  const { data } = await http.get<{ entries: LeaderboardEntryDto[] }>("/fans/leaderboard", { params: { limit } });
  return data.entries;
}