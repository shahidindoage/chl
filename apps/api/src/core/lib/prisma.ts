import { PrismaClient } from "@prisma/client";

import { env, isProduction } from "../config/env.js";

/**
 * Prisma client singleton (Section 2 rule 3: shared infrastructure,
 * owned by no module). Repositories are the only consumers.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: isProduction ? ["warn", "error"] : ["query", "warn", "error"],
    datasources: {
      db: { url: env.DATABASE_URL },
    },
  });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!isProduction) {
  globalForPrisma.prisma = prisma;
}
