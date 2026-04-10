import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient {
  if (!globalForPrisma.prisma) {
    const connectionString = process.env.DATABASE_URL || process.env.DIRECT_URL;
    if (!connectionString) {
      // During Next.js build, env vars aren't available.
      // Return a dummy client that throws clear errors at runtime if actually called.
      return new Proxy({} as PrismaClient, {
        get(_t, p) {
          if (typeof p === "symbol" || p === "then") return undefined;
          return () => {
            throw new Error(`Database not configured: missing DATABASE_URL (tried to call prisma.${String(p)})`);
          };
        },
      });
    }
    const adapter = new PrismaPg(connectionString);
    globalForPrisma.prisma = new PrismaClient({ adapter });
  }
  return globalForPrisma.prisma;
}

// Lazy initialization — only create the client when first accessed at runtime,
// not at build time when environment variables aren't available.
export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getClient();
    const value = Reflect.get(client, prop, receiver);
    return typeof value === "function" ? value.bind(client) : value;
  },
});
