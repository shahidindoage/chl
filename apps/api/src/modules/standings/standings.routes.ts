import { Router } from "express";

import { validate } from "../../core/middleware/validate.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as standingsController from "./standings.controller.js";
import { standingsParamsSchema } from "./standings.schema.js";

/**
 * Module 6 — Standings routes (Section 8: get standings for tournament,
 * calculated + cached). Read-only, public — both admin and fan views hit
 * these same endpoints.
 */
export const standingsRouter = Router();

standingsRouter.get("/active", asyncHandler(standingsController.getActiveStandings));
standingsRouter.get(
  "/tournaments/:tournamentId",
  validate({ params: standingsParamsSchema }),
  asyncHandler(standingsController.getStandings)
);
