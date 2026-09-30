import http from "node:http";

import { createApp } from "./app.js";
import { env, isProduction } from "./core/config/env.js";
import { logger } from "./core/lib/logger.js";
import { mailerConfigured } from "./core/lib/mailer.js";
import { redis } from "./core/lib/redis.js";
import { initSocket } from "./core/lib/socket.js";

async function main(): Promise<void> {
  if (isProduction && !mailerConfigured()) {
    throw new Error("SMTP_HOST must be configured in production — OTP emails cannot be delivered otherwise");
  }

  // The lazy client may already be connecting (rate-limit store touched it
  // at import time) — only explicitly connect when idle.
  if (redis.status === "wait" || redis.status === "end") {
    await redis.connect().catch(() => {
      logger.warn("redis initial connect deferred — retrying in background");
    });
  }

  const app = createApp();
  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.PORT, () => {
    logger.info(`API listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = (signal: string) => {
    logger.info(`${signal} received — shutting down`);
    server.close(() => {
      void redis.quit().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

main().catch((error: unknown) => {
  logger.error("fatal startup error", { message: (error as Error)?.message, stack: (error as Error)?.stack });
  process.exit(1);
});
