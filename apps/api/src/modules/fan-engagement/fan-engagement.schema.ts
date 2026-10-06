/**
 * Module 8 — Fan Engagement input schemas.
 * Shapes live in @tournament/shared (Section 6 reuse pattern).
 */
export {
  createQuizSchema,
  updateQuizSchema,
  submitAttemptSchema,
  submitPredictionSchema,
  listQuizzesQuerySchema,
  listPredictionsQuerySchema,
  leaderboardQuerySchema,
  quizIdParamsSchema,
  quizMatchIdParamsSchema,
  quizStatusBodySchema,
  QUIZ_STATUSES,
  QUIZ_QUESTION_TYPES,
  type SubmitAttemptInput,
  type SubmitPredictionInput,
  type ListQuizzesQuery,
  type ListPredictionsQuery,
  type QuizDto,
  type QuizQuestionDto,
  type QuizOption,
  type QuizAttemptDto,
  type PredictionDto,
  type LeaderboardEntryDto,
  type QuizStatusName,
  type QuizQuestionTypeName,
} from "@tournament/shared";