import { Router } from "express";

import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/requireRole.js";
import { validate } from "../../core/middleware/validate.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as matchController from "./match.controller.js";
import {
  addMatchEventSchema,
  createMatchSchema,
  listMatchesQuerySchema,
  matchEventParamsSchema,
  matchIdParamsSchema,
  updateMatchSchema,
  updateResultSchema,
} from "./match.schema.js";

/**
 * Module 4 — Match Center routes (Section 8: CRUD match · get by status ·
 * get single match · update result · get by team · get by date range).
 * Reads public; writes via Section 7 permission map — "match:*" grants
 * super_admin (wildcard) and score_manager.
 */
export const matchRouter = Router();

const canWrite = [authMiddleware, requirePermission("match:schedule")] as const;

matchRouter.get("/", validate({ query: listMatchesQuerySchema }), asyncHandler(matchController.listMatches));

matchRouter.post("/", ...canWrite, validate({ body: createMatchSchema }), asyncHandler(matchController.createMatch));
matchRouter.put("/:id/result", ...canWrite, validate({ params: matchIdParamsSchema, body: updateResultSchema }), asyncHandler(matchController.updateResult));
matchRouter.post("/:id/events", ...canWrite, validate({ params: matchIdParamsSchema, body: addMatchEventSchema }), asyncHandler(matchController.addEvent));
matchRouter.delete("/events/:eventId", ...canWrite, validate({ params: matchEventParamsSchema }), asyncHandler(matchController.deleteEvent));

matchRouter.get("/:id", validate({ params: matchIdParamsSchema }), asyncHandler(matchController.getMatch));
matchRouter.put("/:id", ...canWrite, validate({ params: matchIdParamsSchema, body: updateMatchSchema }), asyncHandler(matchController.updateMatch));
matchRouter.delete("/:id", ...canWrite, validate({ params: matchIdParamsSchema }), asyncHandler(matchController.deleteMatch));
