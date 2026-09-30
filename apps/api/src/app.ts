import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";

import { env } from "./core/config/env.js";
import { errorHandler, notFoundHandler } from "./core/middleware/errorHandler.js";
import { requestLogger } from "./core/middleware/requestLogger.js";
import { apiRateLimit } from "./core/middleware/rateLimit.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { tournamentRouter, venueRouter } from "./modules/tournament/tournament.routes.js";
import { teamRouter } from "./modules/team/team.routes.js";
import { playerRouter } from "./modules/player/player.routes.js";
import { matchRouter } from "./modules/match/match.routes.js";
import { standingsRouter } from "./modules/standings/standings.routes.js";
import { liveRouter } from "./modules/live-score/live-score.routes.js";

/**
 * Express app — mounts module routers, one line per module (Section 6).
 * Later modules: tournament, team, player, match, standings,
 * live-score, news, fan-engagement, admin.
 */
export function createApp(): Express {
  const app = express();

  app.set("trust proxy", 1); // behind Nginx on the VPS (Section 9)
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true,
    })
  );
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.use(requestLogger);

  // Health-check endpoint for uptime monitoring / PM2 (Section 9).
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  app.use("/api", apiRateLimit);

  app.use("/api/auth", authRouter);
  app.use("/api/tournaments", tournamentRouter);
  app.use("/api/venues", venueRouter);
  app.use("/api/teams", teamRouter);
  app.use("/api/players", playerRouter);
  app.use("/api/matches", matchRouter);
  app.use("/api/standings", standingsRouter);
  app.use("/api/live", liveRouter);
  // ... one line per module

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
