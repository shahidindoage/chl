import type { Request, Response } from "express";

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
  res.status(201).json({ tournament });
}

export async function updateTournament(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const tournament = await tournamentService.updateTournament(id, req.body as UpdateTournamentInput);
  res.status(200).json({ tournament });
}

export async function deleteTournament(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await tournamentService.deleteTournament(id);
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
  res.status(201).json({ venue });
}

export async function updateVenue(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const venue = await tournamentService.updateVenue(id, req.body as UpdateVenueInput);
  res.status(200).json({ venue });
}

export async function deleteVenue(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await tournamentService.deleteVenue(id);
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
