import type { Request, Response } from "express";

import * as standingsService from "./standings.service.js";

/** Controller: parses req, calls service, shapes response (Section 6). */

export async function getStandings(req: Request, res: Response): Promise<void> {
  const { tournamentId } = req.params as { tournamentId: string };
  const standings = await standingsService.getStandings(tournamentId);
  res.status(200).json({ standings });
}

export async function getActiveStandings(_req: Request, res: Response): Promise<void> {
  const standings = await standingsService.getActiveTournamentStandings();
  res.status(200).json({ standings });
}
