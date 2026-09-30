import type { NextFunction, Request, RequestHandler, Response } from "express";
import { ZodError, type ZodTypeAny, type z } from "zod";

import { ApiError } from "../utils/ApiError.js";

export interface ValidationSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function flattenIssues(error: ZodError): Record<string, string[]> {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (details[key] ??= []).push(issue.message);
  }
  return details;
}

/**
 * Shared validation wrapper (Section 2 rule 4): all Zod validation happens
 * at the route boundary via validate(), never manually inside controllers.
 * Parsed values replace req.body/query/params so controllers receive
 * coerced, trimmed input.
 */
export function validate(schemas: ValidationSchemas): RequestHandler {
  return function validateMiddleware(req: Request, _res: Response, next: NextFunction): void {
    try {
      if (schemas.params) {
        req.params = schemas.params.parse(req.params) as Request["params"];
      }
      if (schemas.query) {
        // Express 5 makes req.query a getter; defineProperty rewrites it safely.
        const parsed = schemas.query.parse(req.query);
        Object.defineProperty(req, "query", {
          value: parsed,
          writable: true,
          configurable: true,
          enumerable: true,
        });
      }
      if (schemas.body) {
        req.body = schemas.body.parse(req.body) as z.infer<typeof schemas.body>;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(ApiError.badRequest("Validation failed", flattenIssues(error)));
        return;
      }
      next(error);
    }
  };
}
