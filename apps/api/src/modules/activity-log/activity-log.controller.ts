import type { Request, Response } from "express";

import { ApiError } from "../../core/utils/ApiError.js";
import * as service from "./activity-log.service.js";
import type { ListActivityLogsQuery } from "./activity-log.schema.js";

/** Controller: parses req, calls service, shapes response (Section 6). */

function requireActor(req: Request): service.ActorSnapshot {
  if (!req.user) throw ApiError.unauthorized();
  return service.actorFromRequest(req.user) as service.ActorSnapshot;
}

export async function listActivityLogs(req: Request, res: Response): Promise<void> {
  requireActor(req);
  const query = req.query as unknown as ListActivityLogsQuery;
  const result = await service.listActivityLogs(query);
  res.status(200).json(result);
}

export async function getActivityFacets(req: Request, res: Response): Promise<void> {
  requireActor(req);
  const facets = await service.getActivityFacets();
  res.status(200).json(facets);
}