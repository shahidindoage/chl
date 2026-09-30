import { Router } from "express";

import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import { validate } from "../../core/middleware/validate.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as playerController from "./player.controller.js";
import {
  createPlayerSchema,
  listPlayersQuerySchema,
  playerIdParamsSchema,
  reassignPlayerSchema,
  updatePlayerSchema,
} from "./player.schema.js";

/**
 * Module 3 — Player routes (Section 8: CRUD player · list with filters ·
 * get profile · reassign team).
 * Reads public; writes super_admin + team_owner (own-team rule enforced
 * in the service layer).
 */
export const playerRouter = Router();

const canWrite = [authMiddleware, requireRole("super_admin", "team_owner")] as const;

playerRouter.get("/", validate({ query: listPlayersQuerySchema }), asyncHandler(playerController.listPlayers));
playerRouter.get("/:id", validate({ params: playerIdParamsSchema }), asyncHandler(playerController.getPlayer));

playerRouter.post("/", ...canWrite, validate({ body: createPlayerSchema }), asyncHandler(playerController.createPlayer));
playerRouter.put("/:id", ...canWrite, validate({ params: playerIdParamsSchema, body: updatePlayerSchema }), asyncHandler(playerController.updatePlayer));
playerRouter.post("/:id/reassign", ...canWrite, validate({ params: playerIdParamsSchema, body: reassignPlayerSchema }), asyncHandler(playerController.reassignPlayer));
playerRouter.delete("/:id", ...canWrite, validate({ params: playerIdParamsSchema }), asyncHandler(playerController.deletePlayer));
