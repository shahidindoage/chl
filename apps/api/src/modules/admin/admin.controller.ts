import type { Request, Response } from "express";

import { ApiError } from "../../core/utils/ApiError.js";
import { DASHBOARD_ROLES } from "./admin.schema.js";
import * as service from "./admin.service.js";
import type { DashboardQuery } from "./admin.schema.js";

/** Controller: parses req, calls service, shapes response (Section 6). */

function requireDashboardRole(req: Request): void {
  if (!req.user) throw ApiError.unauthorized();
  const allowed = DASHBOARD_ROLES as readonly string[];
  if (!allowed.includes(req.user.role)) {
    throw ApiError.forbidden("Not allowed to view the admin dashboard");
  }
}

export async function getDashboard(req: Request, res: Response): Promise<void> {
  requireDashboardRole(req);
  const query = req.query as unknown as DashboardQuery;
  const dashboard = await service.getDashboard(query);
  res.status(200).json({ dashboard });
}