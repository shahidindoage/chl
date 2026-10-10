import { Router } from "express";

import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import { validate } from "../../core/middleware/validate.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as controller from "./activity-log.controller.js";
import { listActivityLogsQuerySchema } from "./activity-log.schema.js";

/**
 * Module 10 — Activity log viewer routes.
 *
 * Any admin role can read the audit trail; it is read-only and contains no
 * secrets (metadata is limited to ids and counts). super_admin is allowed
 * through the wildcard in requireRole.
 */
export const activityLogRouter = Router();

activityLogRouter.get(
  "/activity",
  authMiddleware,
  requireRole(
    "super_admin",
    "team_owner",
    "content_manager",
    "score_manager",
    "quiz_manager"
  ),
  validate({ query: listActivityLogsQuerySchema }),
  asyncHandler(controller.listActivityLogs)
);

activityLogRouter.get(
  "/activity/facets",
  authMiddleware,
  requireRole(
    "super_admin",
    "team_owner",
    "content_manager",
    "score_manager",
    "quiz_manager"
  ),
  asyncHandler(controller.getActivityFacets)
);