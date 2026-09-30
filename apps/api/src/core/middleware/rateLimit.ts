import rateLimit, { type Options } from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";

import { env, isProduction } from "../config/env.js";
import { redis } from "../lib/redis.js";

function redisStore(prefix: string): RedisStore | undefined {
  try {
    // ioredis exposes every Redis command as a dynamic method
    // (redis.eval, redis.incr, ...) — use that for sendCommand(name, ...args).
    const commands = redis as unknown as Record<
      string,
      ((...args: string[]) => Promise<unknown>) | undefined
    >;
    return new RedisStore({
      prefix: `rl:${prefix}:`,
      sendCommand: ((...args: string[]) => {
        const name = (args[0] ?? "").toLowerCase();
        const run = commands[name];
        if (typeof run !== "function") {
          return Promise.reject(new Error(`Unsupported redis command: ${name}`));
        }
        return run.call(redis, ...args.slice(1));
      }) as import("rate-limit-redis").SendCommandFn,
    });
  } catch {
    return undefined;
  }
}

function buildLimiter(name: string, options: Partial<Options>) {
  const limiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    limit: env.RATE_LIMIT_MAX,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    store: redisStore(name),
    // Redis outage must not take the whole API down (Section 9 readiness).
    passOnStoreError: true,
    message: {
      error: {
        code: "TOO_MANY_REQUESTS",
        message: "Too many requests, please try again later",
      },
    },
    ...options,
  });
  return limiter;
}

/**
 * Global API limiter. In development the budget gets 10x headroom —
 * dashboard polling + dev StrictMode double-mounts burn through the
 * production budget quickly. Production always uses env.RATE_LIMIT_MAX.
 */
export const apiRateLimit = buildLimiter("api", {
  limit: isProduction ? env.RATE_LIMIT_MAX : env.RATE_LIMIT_MAX * 10,
});

/**
 * Auth endpoints are rate-limited harder — OTP send especially
 * (Section 9 security checklist).
 */
export const authRateLimit = buildLimiter("auth", { limit: 20 });
export const otpSendRateLimit = buildLimiter("otp", {
  limit: 5, // 5 OTP requests per window per IP
  skipSuccessfulRequests: false,
});
