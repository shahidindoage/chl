import { Router } from "express";

import { authMiddleware, optionalAuthMiddleware } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/requireRole.js";
import { validate } from "../../core/middleware/validate.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as controller from "./fan-engagement.controller.js";
import {
  createQuizSchema,
  leaderboardQuerySchema,
  listPredictionsQuerySchema,
  listQuizzesQuerySchema,
  quizIdParamsSchema,
  quizMatchIdParamsSchema,
  quizStatusBodySchema,
  submitAttemptSchema,
  submitPredictionSchema,
  updateQuizSchema,
} from "./fan-engagement.schema.js";

/**
 * Module 8 — Fan Engagement routes (Section 8: CRUD quiz (quiz_manager) ·
 * get active quizzes · submit answers · submit prediction · get leaderboard).
 *
 * Quiz writes require "fan-engagement:*" (quiz_manager, plus super_admin via
 * the wildcard). Attempting and predicting require a signed-in fan.
 */
export const fanEngagementRouter = Router();

const canManage = [authMiddleware, requirePermission("fan-engagement:manage")] as const;
const asFan = [authMiddleware, requirePermission("fan-engagement:participate")] as const;

/* ---------------- Quiz ---------------- */

fanEngagementRouter.get(
  "/quizzes",
  optionalAuthMiddleware,
  validate({ query: listQuizzesQuerySchema }),
  asyncHandler(controller.listQuizzes)
);
fanEngagementRouter.get(
  "/quizzes/:id",
  optionalAuthMiddleware,
  validate({ params: quizIdParamsSchema }),
  asyncHandler(controller.getQuiz)
);

// My attempt is per-user, so this route precedes the manager attempt list.
fanEngagementRouter.get(
  "/quizzes/:id/attempts/me",
  ...asFan,  validate({ params: quizIdParamsSchema }),
  asyncHandler(controller.getMyAttempt)
);
fanEngagementRouter.post(
  "/quizzes/:id/attempts",
  ...asFan,  validate({ params: quizIdParamsSchema, body: submitAttemptSchema }),
  asyncHandler(controller.submitAttempt)
);

fanEngagementRouter.post("/quizzes", ...canManage, validate({ body: createQuizSchema }), asyncHandler(controller.createQuiz));
fanEngagementRouter.put("/quizzes/:id", ...canManage, validate({ params: quizIdParamsSchema, body: updateQuizSchema }), asyncHandler(controller.updateQuiz));
fanEngagementRouter.post(
  "/quizzes/:id/status",
  ...canManage,
  validate({ params: quizIdParamsSchema, body: quizStatusBodySchema }),
  asyncHandler(controller.setQuizStatus)
);
fanEngagementRouter.delete("/quizzes/:id", ...canManage, validate({ params: quizIdParamsSchema }), asyncHandler(controller.deleteQuiz));
fanEngagementRouter.get(
  "/quizzes/:id/attempts",
  ...canManage,
  validate({ params: quizIdParamsSchema }),
  asyncHandler(controller.listQuizAttempts)
);

/* ---------------- Predictions ---------------- */

fanEngagementRouter.get(
  "/matches/:matchId/predictions/me",
  ...asFan,  validate({ params: quizMatchIdParamsSchema }),
  asyncHandler(controller.getMyPrediction)
);
fanEngagementRouter.post(
  "/matches/:matchId/predictions",
  ...asFan,  validate({ params: quizMatchIdParamsSchema, body: submitPredictionSchema }),
  asyncHandler(controller.submitPrediction)
);
fanEngagementRouter.get(
  "/matches/:matchId/predictions",
  ...canManage,
  validate({ params: quizMatchIdParamsSchema, query: listPredictionsQuerySchema }),
  asyncHandler(controller.listPredictions)
);

/* ---------------- Leaderboard ---------------- */

fanEngagementRouter.get(
  "/leaderboard",
  optionalAuthMiddleware,
  validate({ query: leaderboardQuerySchema }),
  asyncHandler(controller.getLeaderboard)
);