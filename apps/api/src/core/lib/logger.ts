import winston from "winston";

import { isProduction } from "../config/env.js";

/**
 * Structured JSON logger with request-id support (Section 9:
 * "Structured logging — not bare console.log — with request IDs").
 */
export const logger = winston.createLogger({
  level: isProduction ? "info" : "debug",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "tournament-api" },
  transports: [
    new winston.transports.Console({
      format: isProduction
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
          ),
    }),
  ],
  silent: process.env.NODE_ENV === "test",
});

export function childLogger(context: Record<string, unknown>) {
  return logger.child(context);
}
