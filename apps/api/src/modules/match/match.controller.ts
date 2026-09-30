import type { Request, Response } from "express";

import * as matchService from "./match.service.js";
import type {
  AddMatchEventInput,
  CreateMatchInput,
  ListMatchesQuery,
  UpdateMatchInput,
  UpdateResultInput,
} from "./match.schema.js";

/** Controller: parses req, calls service, shapes response (Section 6). */

export async function createMatch(req: Request, res: Response): Promise<void> {
  const match = await matchService.createMatch(req.body as CreateMatchInput);
  res.status(201).json({ match });
}

export async function updateMatch(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const match = await matchService.updateMatch(id, req.body as UpdateMatchInput);
  res.status(200).json({ match });
}

export async function deleteMatch(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await matchService.deleteMatch(id);
  res.status(200).json(result);
}

export async function getMatch(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const match = await matchService.getMatch(id);
  res.status(200).json({ match });
}

export async function listMatches(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListMatchesQuery;
  const result = await matchService.listMatches(query);
  res.status(200).json(result);
}

export async function updateResult(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const match = await matchService.updateResult(id, req.body as UpdateResultInput);
  res.status(200).json({ match });
}

export async function addEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const event = await matchService.addEvent(id, req.body as AddMatchEventInput);
  res.status(201).json({ event });
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  const { eventId } = req.params as { eventId: string };
  const result = await matchService.deleteEvent(eventId);
  res.status(200).json(result);
}
