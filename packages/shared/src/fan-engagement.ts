import { z } from "zod";

export const QUIZ_STATUSES = ["draft", "active", "closed"] as const;
export type QuizStatusName = (typeof QUIZ_STATUSES)[number];

export const QUIZ_QUESTION_TYPES = ["single_choice", "true_false"] as const;
export type QuizQuestionTypeName = (typeof QUIZ_QUESTION_TYPES)[number];

/** One selectable option: a stable key plus the label shown to the fan. */
export const quizOptionSchema = z.object({
  key: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(300),
});
export type QuizOption = z.infer<typeof quizOptionSchema>;

export const quizQuestionSchema = z.object({
  id: z.string().uuid(),
  question: z.string(),
  type: z.enum(QUIZ_QUESTION_TYPES),
  options: z.array(quizOptionSchema),
  position: z.number().int(),
  points: z.number().int().nullable(),
});
export type QuizQuestionDto = z.infer<typeof quizQuestionSchema>;

/** Public quiz: questions without correctKey — never sent to non-managers. */
export const quizSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  status: z.enum(QUIZ_STATUSES),
  pointsPerQuestion: z.number().int(),
  opensAt: z.string().datetime().nullable(),
  closesAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  questions: z.array(quizQuestionSchema),
});
export type QuizDto = z.infer<typeof quizSchema>;

export const quizAttemptSchema = z.object({
  id: z.string().uuid(),
  quizId: z.string().uuid(),
  userId: z.string().uuid(),
  score: z.number().int(),
  maxScore: z.number().int(),
  submittedAt: z.string().datetime(),
});
export type QuizAttemptDto = z.infer<typeof quizAttemptSchema>;

export const predictionSchema = z.object({
  id: z.string().uuid(),
  matchId: z.string().uuid(),
  userId: z.string().uuid(),
  predictedWinnerId: z.string().uuid(),
  predictedScore: z.string().nullable(),
  isCorrect: z.boolean().nullable(),
  scoredAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
});
export type PredictionDto = z.infer<typeof predictionSchema>;

export const leaderboardEntrySchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  quizPoints: z.number().int(),
  predictionPoints: z.number().int(),
  total: z.number().int(),
});
export type LeaderboardEntryDto = z.infer<typeof leaderboardEntrySchema>;

/* ---------------- Inputs ---------------- */

const questionInput = z.object({
  question: z.string().trim().min(3, "Question text is required").max(500),
  type: z.enum(QUIZ_QUESTION_TYPES).default("single_choice"),
  options: z.array(quizOptionSchema).min(2, "At least two options").max(6),
  correctKey: z.string().trim().min(1).max(40),
  points: z.coerce.number().int().min(1).max(100).nullish(),
});

const quizFields = {
  title: z.string().trim().min(3, "Title is required").max(200),
  description: z.string().trim().max(1000).nullish(),
  status: z.enum(QUIZ_STATUSES).default("draft"),
  pointsPerQuestion: z.coerce.number().int().min(1).max(100).default(1),
  opensAt: z.coerce.date().nullish(),
  closesAt: z.coerce.date().nullish(),
  questions: z.array(questionInput).min(1, "A quiz needs at least one question").max(30),
};

/** correctKey must be one of the option keys — caught before any DB write. */
export const createQuizSchema = z
  .object(quizFields)
  .refine((d) => !d.closesAt || !d.opensAt || d.closesAt > d.opensAt, {
    message: "closesAt must be after opensAt",
    path: ["closesAt"],
  })
  .refine(
    (d) =>
      d.questions.every((q) => q.options.some((o) => o.key === q.correctKey)),
    { message: "Each question's correctKey must match one of its option keys" }
  );

export const updateQuizSchema = createQuizSchema;

export const listQuizzesQuerySchema = z.object({
  status: z.enum(QUIZ_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export type ListQuizzesQuery = z.infer<typeof listQuizzesQuerySchema>;

export const submitAttemptSchema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().uuid("Question id must be a UUID"),
        selectedKey: z.string().trim().min(1).max(40),
      })
    )
    .min(1, "Answer at least one question"),
});
export type SubmitAttemptInput = z.infer<typeof submitAttemptSchema>;

export const submitPredictionSchema = z.object({
  predictedWinnerId: z.string().uuid("Pick a team"),
  predictedScore: z.string().trim().max(20).nullish(),
});
export type SubmitPredictionInput = z.infer<typeof submitPredictionSchema>;

export const listPredictionsQuerySchema = z.object({
  matchId: z.string().uuid("Match id must be a UUID").optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
export type ListPredictionsQuery = z.infer<typeof listPredictionsQuerySchema>;

export const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const quizIdParamsSchema = z.object({ id: z.string().uuid("Quiz id must be a UUID") });
export const quizMatchIdParamsSchema = z.object({
  matchId: z.string().uuid("Match id must be a UUID"),
});

export const quizStatusBodySchema = z.object({
  status: z.enum(QUIZ_STATUSES),
});