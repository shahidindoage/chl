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
import { newsRouter } from "./modules/news/news.routes.js";
import { mediaRouter } from "./modules/media/media.routes.js";
import { fanEngagementRouter } from "./modules/fan-engagement/fan-engagement.routes.js";
import { adminRouter } from "./modules/admin/admin.routes.js";
import { activityLogRouter } from "./modules/activity-log/activity-log.routes.js";
import { notificationsRouter } from "./modules/notifications/notifications.routes.js";

/**
 * Express app — mounts module routers, one line per module (Section 6).
 * All modules are built; Module 11 adds /api/notifications (web push).
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
  app.use("/api/news", newsRouter);
app.use("/api/media", mediaRouter);
  app.use("/api/fans", fanEngagementRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/admin", activityLogRouter);
  app.use("/api/notifications", notificationsRouter);
  // ... one line per module

  // Uploaded media is served from /uploads (Module 7, Section 1 storage).
  //
  // setHeaders disables Cross-Origin-Resource-Policy for these files only.
  // The global helmet() sets CORP same-origin, which stops the web app on a
  // different origin (localhost:5173 in dev, the site domain in production)
  // from rendering an <img> that points at this origin — the browser blocks it
  // and every thumbnail shows broken. Uploaded media is public and is meant to
  // be embedded, so CORP is relaxed here and nowhere else.
  app.use(
    "/uploads",
    express.static(env.UPLOAD_DIR, {
      maxAge: "7d",
      index: false,
      dotfiles: "deny",
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    })
  );

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
