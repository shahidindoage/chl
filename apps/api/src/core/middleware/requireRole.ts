import type { Role } from "@tournament/shared";
import type { NextFunction, Request, RequestHandler, Response } from "express";

import { roleHasPermission } from "../config/permissions.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Gate a route on roles directly: requireRole("super_admin", "team_owner").
 * Must run after authMiddleware.
 */
export function requireRole(...roles: Role[]): RequestHandler {
  const allowed = new Set<string>(roles);
  return function requireRoleMiddleware(req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    if (!allowed.has(req.user.role)) {
      next(ApiError.forbidden(`Requires role: ${roles.join(" | ")}`));
      return;
    }
    next();
  };
}

/**
 * Gate a route on a permission string from the central map (Section 7),
 * e.g. requirePermission("match:result:update"). Must run after authMiddleware.
 */
export function requirePermission(...permissions: string[]): RequestHandler {
  return function requirePermissionMiddleware(req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) {
      next(ApiError.unauthorized());
      return;
    }
    const role: Role = req.user.role;
    const ok = permissions.some((permission) => roleHasPermission(role, permission));
    if (!ok) {
      next(ApiError.forbidden(`Requires permission: ${permissions.join(" | ")}`));
      return;
    }
    next();
  };
}
