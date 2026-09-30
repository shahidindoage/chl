import { Router } from "express";

import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/requireRole.js";
import { validate } from "../../core/middleware/validate.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import { z } from "zod";
import * as liveController from "./live-score.controller.js";
import {
  endMatchControlSchema,
  liveMatchParamsSchema,
  liveScoreSchema,
  publishCommentarySchema,
  startMatchControlSchema,
} from "./live-score.schema.js";

/**
 * Module 5 — Live Score & Commentary routes (Section 8: start/pause/
 * resume/end · update score · add event · publish commentary · get feed ·
 * get status). Writes: Section 7 map — live-score:* (score_manager) and
 * match:* both qualify; super_admin via wildcard.
 */
export const liveRouter = Router();

const canControl = [authMiddleware, requirePermission("live-score:control")] as const;

const feedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
const commentaryParamsSchema = z.object({
  commentaryId: z.string().uuid("Commentary id must be a UUID"),
});

liveRouter.get(
  "/matches/:matchId/live",
  validate({ params: liveMatchParamsSchema, query: feedQuerySchema }),
  asyncHandler(liveController.feed)
);

liveRouter.post(
  "/matches/:matchId/start",
  ...canControl,
  validate({ params: liveMatchParamsSchema, body: startMatchControlSchema }),
  asyncHandler(liveController.start)
);
liveRouter.post(
  "/matches/:matchId/pause",
  ...canControl,
  validate({ params: liveMatchParamsSchema }),
  asyncHandler(liveController.pause)
);
liveRouter.post(
  "/matches/:matchId/resume",
  ...canControl,
  validate({ params: liveMatchParamsSchema }),
  asyncHandler(liveController.resume)
);
liveRouter.post(
  "/matches/:matchId/end",
  ...canControl,
  validate({ params: liveMatchParamsSchema, body: endMatchControlSchema }),
  asyncHandler(liveController.end)
);
liveRouter.put(
  "/matches/:matchId/score",
  ...canControl,
  validate({ params: liveMatchParamsSchema, body: liveScoreSchema }),
  asyncHandler(liveController.updateScore)
);
liveRouter.post(
  "/matches/:matchId/commentary",
  ...canControl,
  validate({ params: liveMatchParamsSchema, body: publishCommentarySchema }),
  asyncHandler(liveController.publish)
);
liveRouter.delete(
  "/commentary/:commentaryId",
  ...canControl,
  validate({ params: commentaryParamsSchema }),
  asyncHandler(liveController.removeCommentary)
);
