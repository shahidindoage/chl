// # Clears the API rate-limit counters from Redis so the role matrix script can
// # sign in as all six roles back to back without tripping the auth limiter.
// #
// # Usage:  node scripts/clear-rate-limits.js
// #         (run from the repo root or from apps/api — ioredis resolves either way)

const Redis = require("ioredis");

async function main() {
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  const redis = new Redis(url);
  try {
    const keys = await redis.keys("rl:*");
    if (keys.length > 0) await redis.del(...keys);
    console.log(`cleared ${keys.length} rate-limit key(s)`);
  } finally {
    await redis.quit();
  }
}

main().catch((err) => {
  console.error(`Could not clear rate limits: ${err.message}`);
  process.exit(1);
});