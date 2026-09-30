import { createAdapter } from "@socket.io/redis-adapter";
import type { Server as HttpServer } from "http";
import jwt from "jsonwebtoken";
import { Server, type Socket } from "socket.io";

import { env } from "../config/env.js";
import { createLiveSubscriber, createRedisPubSub, LIVE_CHANNEL_PATTERN } from "./redis.js";
import { logger } from "./logger.js";

export interface AuthenticatedSocketData {
  userId?: string;
  role?: string;
}

declare module "socket.io" {
  interface Socket {
    userId?: string;
    role?: string;
  }
}

let io: Server | null = null;

/**
 * Socket.io singleton, Redis-adapter-backed so it survives PM2 cluster
 * mode (Section 2 rule 6, Section 9). Created once from server.ts.
 */
export function initSocket(httpServer: HttpServer): Server {
  if (io) return io;

  io = new Server(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()),
      credentials: true,
    },
  });

  const [pub, sub] = createRedisPubSub();
  pub.connect().catch(() => logger.warn("redis pub connect deferred"));
  sub.connect().catch(() => logger.warn("redis sub connect deferred"));
  io.adapter(createAdapter(pub, sub, { key: "tournament-socket.io" }));

  io.use((socket, next) => {
    // Live-score rooms are public read-only; auth claims are optional.
    const token = socket.handshake.auth?.token as string | undefined;
    if (token) {
      try {
        const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; role: string };
        socket.userId = payload.sub;
        socket.role = payload.role;
      } catch {
        /* proceed as anonymous */
      }
    }
    next();
  });

  io.on("connection", (socket: Socket) => {
    logger.info("socket connected", { socketId: socket.id, userId: socket.userId });

    socket.on("match:subscribe", (matchId: string | number) => {
      socket.join(`match:${matchId}`);
    });
    socket.on("match:unsubscribe", (matchId: string | number) => {
      socket.leave(`match:${matchId}`);
    });

    socket.on("disconnect", () => {
      logger.debug("socket disconnected", { socketId: socket.id });
    });
  });

  // Live bridge: API writes publish to Redis; we fan out to the match room.
  // Decoupled from the HTTP process, so PM2 multi-instance stays correct.
  const live = createLiveSubscriber();
  live.connect().catch(() => logger.warn("live subscriber connect deferred"));
  live.on("ready", () => {
    void live.psubscribe(LIVE_CHANNEL_PATTERN).catch((err: Error) =>
      logger.error("live psubscribe failed", { message: err.message })
    );
    logger.info("live bridge psubscribed to tournament:live:*");
  });
  live.on("error", (err: Error) => logger.error(`redis:live-sub error`, { message: err.message }));
  live.on("pmessage", (pattern: string, channel: string, message: string) => {
    void pattern;
    const matchId = channel.split(":").pop();
    if (!matchId || !io) return;
    try {
      const { event, payload } = JSON.parse(message) as { event: string; payload: unknown };
      io.to(`match:${matchId}`).emit(event, payload);
    } catch (err) {
      logger.error("live bridge bad message", { channel, message: (err as Error).message });
    }
  });

  return io;
}

export function getIo(): Server | null {
  return io;
}

/** Publish helper the API layer uses — never touches sockets directly. */
export function emitToMatchRoom(matchId: string | number, event: string, payload: unknown): void {
  io?.to(`match:${matchId}`).emit(event, payload);
}
