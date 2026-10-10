import { Router } from "express";

import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import { validate } from "../../core/middleware/validate.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as controller from "./admin.controller.js";
import { dashboardQuerySchema } from "./admin.schema.js";

/**
 * Module 10 — admin dashboard route.
 *
 * Read-only aggregate view. Every admin role may open it; the numbers are
 * league-wide, not per-role, so there is nothing here to scope down.
 */
export const adminRouter = Router();

adminRouter.get(
  "/dashboard",
  authMiddleware,
  requireRole(
    "super_admin",
    "team_owner",
    "content_manager",
    "score_manager",
    "quiz_manager"
  ),
  validate({ query: dashboardQuerySchema }),
  asyncHandler(controller.getDashboard)
);