import { Router } from "express";

import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import { validate } from "../../core/middleware/validate.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as tournamentController from "./tournament.controller.js";
import {
  createTournamentSchema,
  createVenueSchema,
  listTournamentsQuerySchema,
  listVenuesQuerySchema,
  tournamentIdParamsSchema,
  updateTournamentSchema,
  updateVenueSchema,
  venueIdParamsSchema,
} from "./tournament.schema.js";

/**
 * Module 1 — Tournament routes (Section 8: CRUD tournament · CRUD venue ·
 * get active tournament · get rules/format).
 * Reads are public; writes are super_admin only.
 */

const superWrite = [authMiddleware, requireRole("super_admin")] as const;

export const tournamentRouter = Router();

tournamentRouter.get("/", validate({ query: listTournamentsQuerySchema }), asyncHandler(tournamentController.listTournaments));
tournamentRouter.get("/active", asyncHandler(tournamentController.getActive));
tournamentRouter.get("/:id", validate({ params: tournamentIdParamsSchema }), asyncHandler(tournamentController.getTournament));
tournamentRouter.get("/:id/rules", validate({ params: tournamentIdParamsSchema }), asyncHandler(tournamentController.getRules));

tournamentRouter.post("/", ...superWrite, validate({ body: createTournamentSchema }), asyncHandler(tournamentController.createTournament));
tournamentRouter.put("/:id", ...superWrite, validate({ params: tournamentIdParamsSchema, body: updateTournamentSchema }), asyncHandler(tournamentController.updateTournament));
tournamentRouter.delete("/:id", ...superWrite, validate({ params: tournamentIdParamsSchema }), asyncHandler(tournamentController.deleteTournament));

export const venueRouter = Router();

venueRouter.get("/", validate({ query: listVenuesQuerySchema }), asyncHandler(tournamentController.listVenues));
venueRouter.get("/:id", validate({ params: venueIdParamsSchema }), asyncHandler(tournamentController.getVenue));

venueRouter.post("/", ...superWrite, validate({ body: createVenueSchema }), asyncHandler(tournamentController.createVenue));
venueRouter.put("/:id", ...superWrite, validate({ params: venueIdParamsSchema, body: updateVenueSchema }), asyncHandler(tournamentController.updateVenue));
venueRouter.delete("/:id", ...superWrite, validate({ params: venueIdParamsSchema }), asyncHandler(tournamentController.deleteVenue));
