import type { Request, Response } from "express";

import { audit } from "../activity-log/activity-log.service.js";
import * as notifications from "../notifications/notifications.service.js";
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
  audit(req, {
    action: "match.create",
    entity: "match",
    entityId: match.id,
    metadata: { tournamentId: match.tournamentId, teamA: match.teamAId, teamB: match.teamBId },
  });
  res.status(201).json({ match });
}

export async function updateMatch(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const match = await matchService.updateMatch(id, req.body as UpdateMatchInput);
  audit(req, {
    action: "match.update",
    entity: "match",
    entityId: match.id,
    metadata: { fields: Object.keys(req.body as object) },
  });
  res.status(200).json({ match });
}

export async function deleteMatch(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const result = await matchService.deleteMatch(id);
  audit(req, { action: "match.delete", entity: "match", entityId: id });
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
  const before = await matchService.getMatch(id);
  const match = await matchService.updateResult(id, req.body as UpdateResultInput);
  // A result update also settles every prediction for this match, so it is the
  // single most consequential entry in the audit trail.
  audit(req, {
    action: "match.result.update",
    entity: "match",
    entityId: match.id,
    metadata: {
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      status: match.status,
      predictionsScored: true,
    },
  });
  // Same lead-change rule as the live score path, so a manually entered final
  // score notifies followers too.
  void notifications
    .notifyGoalScored(
      {
        id: match.id,
        teamAId: match.teamAId,
        teamBId: match.teamBId,
        teamAName: match.teamA.name,
        teamBName: match.teamB.name,
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
      },
      { a: before.teamAScore, b: before.teamBScore }
    )
    .then(() => notifications.notifyMatchEnded({
      id: match.id,
      teamAId: match.teamAId,
      teamBId: match.teamBId,
      teamAName: match.teamA.name,
      teamBName: match.teamB.name,
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
    }))
    .catch(() => undefined);
  res.status(200).json({ match });
}

export async function addEvent(req: Request, res: Response): Promise<void> {
  const { id } = req.params as { id: string };
  const event = await matchService.addEvent(id, req.body as AddMatchEventInput);
  audit(req, {
    action: "match.event.add",
    entity: "match_event",
    entityId: event.id,
    metadata: { matchId: id, eventType: event.eventType, minute: event.minute },
  });
  res.status(201).json({ event });
}

export async function deleteEvent(req: Request, res: Response): Promise<void> {
  const { eventId } = req.params as { eventId: string };
  const result = await matchService.deleteEvent(eventId);
  audit(req, { action: "match.event.delete", entity: "match_event", entityId: eventId });
  res.status(200).json(result);
}
