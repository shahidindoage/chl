import { Router } from "express";

import { authMiddleware } from "../../core/middleware/auth.middleware.js";
import { requireRole } from "../../core/middleware/requireRole.js";
import { validate } from "../../core/middleware/validate.js";
import { asyncHandler } from "../../core/utils/asyncHandler.js";
import * as teamController from "./team.controller.js";
import {
  createSponsorSchema,
  createTeamSchema,
  listTeamsQuerySchema,
  sponsorParamsSchema,
  teamIdParamsSchema,
  updateSponsorSchema,
  updateTeamSchema,
} from "./team.schema.js";

/**
 * Module 2 — Team routes (Section 8: CRUD team · list by tournament ·
 * get single team · manage sponsors).
 * Reads public; writes super_admin + team_owner (ownership enforced in
 * the service layer — Section 8 access rule).
 */
export const teamRouter = Router();

const canWrite = [authMiddleware, requireRole("super_admin", "team_owner")] as const;

teamRouter.get("/", validate({ query: listTeamsQuerySchema }), asyncHandler(teamController.listTeams));

// Sponsor routes MUST be declared before the generic /:id routes below,
// otherwise "sponsors" would be matched as a team id.
teamRouter.put("/sponsors/:sponsorId", ...canWrite, validate({ params: sponsorParamsSchema, body: updateSponsorSchema }), asyncHandler(teamController.updateSponsor));
teamRouter.delete("/sponsors/:sponsorId", ...canWrite, validate({ params: sponsorParamsSchema }), asyncHandler(teamController.deleteSponsor));

teamRouter.get("/:id", validate({ params: teamIdParamsSchema }), asyncHandler(teamController.getTeam));

teamRouter.post("/", ...canWrite, validate({ body: createTeamSchema }), asyncHandler(teamController.createTeam));
teamRouter.put("/:id", ...canWrite, validate({ params: teamIdParamsSchema, body: updateTeamSchema }), asyncHandler(teamController.updateTeam));
teamRouter.delete("/:id", ...canWrite, validate({ params: teamIdParamsSchema }), asyncHandler(teamController.deleteTeam));

// Sponsor management (nested under a team)
teamRouter.post("/:id/sponsors", ...canWrite, validate({ params: teamIdParamsSchema, body: createSponsorSchema }), asyncHandler(teamController.addSponsor));
