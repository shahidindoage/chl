import type { Request, Response } from "express";

import { ApiError } from "../../core/utils/ApiError.js";
import * as playerService from "./player.service.js";
import type {
  CreatePlayerInput,
  ListPlayersQuery,
  ReassignPlayerInput,
  UpdatePlayerInput,
} from "./player.schema.js";

/** Controller: parses req, calls service, shapes response (Section 6). */

function actor(req: Request) {
  if (!req.user) throw ApiError.unauthorized();
  return { id: req.user.id, role: req.user.role };
}

export async function createPlayer(req: Request, res: Response): Promise<void> {
  const player = await playerService.createPlayer(req.body as CreatePlayerInput, actor(req));
  res.status(201).json({ player });
}

export async function updatePlayer(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const player = await playerService.updatePlayer(id, req.body as UpdatePlayerInput, actor(req));
  res.status(200).json({ player });
}

export async function reassignPlayer(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const { teamId } = req.body as ReassignPlayerInput;
  const player = await playerService.reassignPlayer(id, teamId, actor(req));
  res.status(200).json({ player });
}

export async function deletePlayer(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await playerService.deletePlayer(id, actor(req));
  res.status(200).json(result);
}

export async function getPlayer(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const player = await playerService.getPlayerProfile(id);
  res.status(200).json({ player });
}

export async function listPlayers(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListPlayersQuery;
  const result = await playerService.listPlayers(query);
  res.status(200).json(result);
}
