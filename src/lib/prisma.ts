import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL or DIRECT_URL environment variable is required");
  }
  const adapter = new PrismaPg(connectionString);
  return new PrismaClient({ adapter });
}

// Lazy initialization — only create the client when first accessed at runtime,
// not at build time when environment variables aren't available.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    return (globalForPrisma.prisma as Record<string | symbol, unknown>)[prop];
  },
});
