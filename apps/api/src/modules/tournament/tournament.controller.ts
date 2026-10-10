import type { Request, Response } from "express";

import { audit } from "../activity-log/activity-log.service.js";
import * as tournamentService from "./tournament.service.js";
import type {
  CreateTournamentInput,
  CreateVenueInput,
  ListTournamentsQuery,
  ListVenuesQuery,
  UpdateTournamentInput,
  UpdateVenueInput,
} from "./tournament.schema.js";

/** Controller: parses req, calls service, shapes response (Section 6). */

export async function createTournament(req: Request, res: Response): Promise<void> {
  const tournament = await tournamentService.createTournament(req.body as CreateTournamentInput);
  audit(req, {
    action: "tournament.create",
    entity: "tournament",
    entityId: tournament.id,
    metadata: { name: tournament.name, format: tournament.format },
  });
  res.status(201).json({ tournament });
}

export async function updateTournament(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const tournament = await tournamentService.updateTournament(id, req.body as UpdateTournamentInput);
  audit(req, {
    action: "tournament.update",
    entity: "tournament",
    entityId: tournament.id,
    metadata: { fields: Object.keys(req.body as object) },
  });
  res.status(200).json({ tournament });
}

export async function deleteTournament(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await tournamentService.deleteTournament(id);
  audit(req, { action: "tournament.delete", entity: "tournament", entityId: id });
  res.status(200).json(result);
}

export async function getTournament(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const tournament = await tournamentService.getTournament(id);
  res.status(200).json({ tournament });
}

export async function getActive(req: Request, res: Response): Promise<void> {
  const tournament = await tournamentService.getActiveTournament();
  res.status(200).json({ tournament });
}

export async function listTournaments(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListTournamentsQuery;
  const result = await tournamentService.listTournaments(query);
  res.status(200).json(result);
}

export async function getRules(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const tournament = await tournamentService.getTournament(id);
  res.status(200).json({
    id: tournament.id,
    name: tournament.name,
    format: tournament.format,
    rules: tournament.rules,
  });
}

export async function createVenue(req: Request, res: Response): Promise<void> {
  const venue = await tournamentService.createVenue(req.body as CreateVenueInput);
  audit(req, {
    action: "venue.create",
    entity: "venue",
    entityId: venue.id,
    metadata: { name: venue.name, city: venue.city },
  });
  res.status(201).json({ venue });
}

export async function updateVenue(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const venue = await tournamentService.updateVenue(id, req.body as UpdateVenueInput);
  audit(req, {
    action: "venue.update",
    entity: "venue",
    entityId: venue.id,
    metadata: { fields: Object.keys(req.body as object) },
  });
  res.status(200).json({ venue });
}

export async function deleteVenue(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await tournamentService.deleteVenue(id);
  audit(req, { action: "venue.delete", entity: "venue", entityId: id });
  res.status(200).json(result);
}

export async function getVenue(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const venue = await tournamentService.getVenue(id);
  res.status(200).json({ venue });
}

export async function listVenues(req: Request, res: Response): Promise<void> {
  const query = req.query as unknown as ListVenuesQuery;
  const result = await tournamentService.listVenues(query);
  res.status(200).json(result);
}
