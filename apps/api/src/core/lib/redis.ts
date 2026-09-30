import { Redis } from "ioredis";

import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Redis client singleton — standings cache, Socket.io adapter,
 * rate-limit store (Section 9). `lazyConnect` keeps module import
 * side-effect free; `new Redis(url)` connects eagerly.
 */
function createClient(name: string): Redis {
  const client = new Redis(env.REDIS_URL, {
    lazyConnect: true,
    maxRetriesPerRequest: 2,
    enableReadyCheck: true,
  });
  client.on("connect", () => logger.info(`redis:${name} connected`));
  client.on("ready", () => logger.info(`redis:${name} ready`));
  client.on("error", (err: Error) => logger.error(`redis:${name} error`, { message: err.message }));
  return client;
}

export const redis = createClient("main");

/** For Socket.io pub/sub, which requires dedicated connections. */
export function createRedisPubSub(): [pub: Redis, sub: Redis] {
  return [createClient("pub"), createClient("sub")];
}

/** Dedicated subscriber for the app-level live bridge (API → sockets). */
export function createLiveSubscriber(): Redis {
  return createClient("live-sub");
}

/**
 * Live bridge channel (Section 2 rule 6 / Section 9): the API layer writes
 * then publishes here; the socket layer subscribes and broadcasts to the
 * `match:{id}` room. Survives PM2 cluster mode — every instance receives.
 */
export const LIVE_CHANNEL_PATTERN = "tournament:live:*";
export const liveChannel = (matchId: string): string => `tournament:live:${matchId}`;

export async function publishLiveEvent(
  matchId: string,
  event: string,
  payload: unknown
): Promise<void> {
  try {
    await redis.publish(liveChannel(matchId), JSON.stringify({ event, payload }));
  } catch (err) {
    logger.warn(`live publish failed (${event})`, { message: (err as Error).message });
  }
}

/** Best-effort JSON cache get — never throws through to callers. */
export async function cacheGetJson<T>(key: string): Promise<T | null> {
  try {
    const raw = await redis.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function cacheSetJson(key: string, value: unknown, ttlSeconds: number): Promise<void> {
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch {
    /* cache is best-effort */
  }
}

export async function cacheDel(...keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  try {
    await redis.del(...keys);
  } catch {
    /* cache is best-effort */
  }
}
