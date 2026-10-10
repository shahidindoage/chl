import { Router } from "express";

import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { validate } from "../../core/middleware/validate.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as controller from "./notifications.controller.js";
import { subscribeSchema, teamIdParamsSchema } from "./notifications.schema.js";

/**
 * Module 11 — Web Push routes.
 *
 * Subscription and follow management require a signed-in user but no specific
 * permission: managing your own notification preferences is a personal setting,
 * not fan participation. Gating these on `fan-engagement:participate` wrongly
 * locked out team_owner, content_manager and score_manager, who are all valid
 * recipients. The config endpoint is public because the site shell needs it
 * before sign-in.
 */
export const notificationsRouter = Router();

const asUser = [authMiddleware] as const;

notificationsRouter.get("/config", asyncHandler(controller.getConfig));

notificationsRouter.post("/subscribe", ...asUser, validate({ body: subscribeSchema }), asyncHandler(controller.subscribe));
notificationsRouter.delete("/subscribe", ...asUser, asyncHandler(controller.unsubscribe));

notificationsRouter.get("/follows", ...asUser, asyncHandler(controller.getFollows));
notificationsRouter.post("/test", ...asUser, asyncHandler(controller.sendTest));
notificationsRouter.post("/follows/:teamId", ...asUser, validate({ params: teamIdParamsSchema }), asyncHandler(controller.follow));
notificationsRouter.delete("/follows/:teamId", ...asUser, validate({ params: teamIdParamsSchema }), asyncHandler(controller.unfollow));