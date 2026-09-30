import type { Role } from "@tournament/shared";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { ApiError } from "../utils/ApiError.js";

export interface AuthUserClaims {
  id: string;
  role: Role;
  email: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUserClaims;
    }
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    if (token.length > 0) return token;
  }
  return null;
}

export function verifyToken(token: string): AuthUserClaims {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      issuer: "tournament-api",
      audience: "tournament-clients",
    }) as jwt.JwtPayload & { role?: Role };
    if (typeof payload.sub !== "string" || !payload.role) {
      throw ApiError.unauthorized("Invalid token payload");
    }
    return { id: payload.sub, role: payload.role, email: String(payload.email ?? "") };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw ApiError.unauthorized("Invalid or expired token");
  }
}

/** Rejects the request unless a valid Bearer JWT is present (Section 6 routes pattern). */
export const authMiddleware: RequestHandler = (req: Request, _res: Response, next: NextFunction) => {
  const token = extractBearer(req);
  if (!token) {
    next(ApiError.unauthorized("Missing Authorization bearer token"));
    return;
  }
  try {
    req.user = verifyToken(token);
    next();
  } catch (error) {
    next(error);
  }
};

/** Continues when a valid Bearer JWT is present; anonymous otherwise. */
export const optionalAuthMiddleware: RequestHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const token = extractBearer(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      // Optional auth: an invalid token degrades to anonymous.
    }
  }
  next();
};
