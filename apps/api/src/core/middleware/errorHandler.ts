import type { NextFunction, Request, RequestHandler, Response } from "express";

import { isProduction } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { ApiError } from "../utils/ApiError.js";

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/**
 * Single error funnel (Section 2 rule 4):
 * every error returns { error: { code, message, details } }.
 * Never leaks stack traces in production (Section 9).
 */
export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  const requestId = req.id;

  if (error instanceof ApiError) {
    const body: ErrorBody = {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details !== undefined ? { details: error.details } : {}),
        ...(requestId ? { requestId } : {}),
      },
    };
    if (error.statusCode >= 500) {
      logger.error(`unhandled ApiError ${error.code}`, { requestId, message: error.message, stack: error.stack });
    }
    res.status(error.statusCode).json(body);
    return;
  }

  // body-parser malformed JSON
  if (error instanceof SyntaxError && "status" in error && (error as { status?: number }).status === 400) {
    res.status(400).json({
      error: { code: "BAD_REQUEST", message: "Malformed JSON body", ...(requestId ? { requestId } : {}) },
    });
    return;
  }

  const unknownError = error as Error;
  logger.error("unhandled error", {
    requestId,
    message: unknownError?.message,
    stack: unknownError?.stack,
  });

  res.status(500).json({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: isProduction ? "Internal server error" : unknownError?.message ?? "Internal server error",
      ...(requestId ? { requestId } : {}),
    },
  } satisfies ErrorBody);
}

/** 404 handler — mount after all routers. */
export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
};
