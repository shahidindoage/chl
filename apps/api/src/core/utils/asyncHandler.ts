import type { NextFunction, Request, RequestHandler, Response } from "express";

type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/** Wraps async controllers so rejections reach the global errorHandler. */
export function asyncHandler(handler: AsyncHandler): RequestHandler {
  return function wrapped(req: Request, res: Response, next: NextFunction): void {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
