import type { Request, Response } from "express";

import { ApiError } from "../../core/utils/ApiError.js";
import * as teamService from "./team.service.js";
import type {
  CreateSponsorInput,
  CreateTeamInput,
  ListTeamsQuery,
  UpdateTeamInput,
} from "./team.schema.js";

/** Controller: parses req, calls service, shapes response (Section 6). */

function actor(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return { id: req.user.id, role: req.user.role };
}

export async function createTeam(req: Request, res: Response): Promise<void> {
  const team = await teamService.createTeam(req.body as CreateTeamInput, actor(req));
  res.status(201).json({ team });
}

export async function updateTeam(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const team = await teamService.updateTeam(id, req.body as UpdateTeamInput, actor(req));
  res.status(200).json({ team });
}

export async function deleteTeam(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await teamService.deleteTeam(id, actor(req));
  res.status(200).json(result);
}

export async function getTeam(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const team = await teamService.getTeam(id);
  res.status(200).json({ team });
}

export async function listTeams(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListTeamsQuery;
  const result = await teamService.listTeams(query);
  res.status(200).json(result);
}

export async function addSponsor(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const sponsor = await teamService.addSponsor(id, req.body as CreateSponsorInput, actor(req));
  res.status(201).json({ sponsor });
}

export async function updateSponsor(req: Request, res: Response): Promise<void> {
  const { sponsorId } = req.params as { sponsorId: string };
  const sponsor = await teamService.updateSponsor(sponsorId, req.body as CreateSponsorInput, actor(req));
  res.status(200).json({ sponsor });
}

export async function deleteSponsor(req: Request, res: Response): Promise<void> {
  const { sponsorId } = req.params as { sponsorId: string };
  const result = await teamService.deleteSponsor(sponsorId, actor(req));
  res.status(200).json(result);
}
