import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { tenantScopingExtension } from "./tenancy/prisma-extension";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function getClient(): PrismaClient | null {
  if (!globalForPrisma.prisma) {
    // PrismaPg manages its own pool — use a session-mode connection (port 5432)
    // to avoid double-pooling through PgBouncer transaction mode.
    //
    // Sub-etapa 4: 3-URL split for RLS rollout. Precedence:
    //  1. RUNTIME_DATABASE_URL — `herd_app` (NOBYPASSRLS). Production runtime
    //     singleton; Postgres RLS enforces tenant isolation as defense-in-depth
    //     behind the Prisma Extension's ORM-level filter.
    //  2. DIRECT_URL — `postgres` (table owner, bypasses RLS). Used by Prisma
    //     migrations DDL (`prisma.config.ts`). Falling back here at runtime
    //     bypasses RLS — only acceptable in environments where RUNTIME_DATABASE_URL
    //     was intentionally not set (local DDL scripts, build-time prerender).
    //  3. DATABASE_URL — pooler. Final fallback for environments that only
    //     wire the pooler URL.
    const connectionString =
      process.env.RUNTIME_DATABASE_URL ??
      process.env.DIRECT_URL ??
      process.env.DATABASE_URL;
    if (!connectionString) return null; // Build time — no DB available
    const adapter = new PrismaPg(connectionString);
    globalForPrisma.prisma = new PrismaClient({ adapter }).$extends(
      tenantScopingExtension,
    ) as unknown as PrismaClient;
  }
  return globalForPrisma.prisma;
}

// A deeply-chainable safe value for build-time prerendering.
// Any property access returns another safe value, iteration yields nothing,
// and any function call resolves to another safe value.
// Handles: prisma.model.findMany() → iterable, prisma.model.findUnique() → obj with properties
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function safeValue(): any {
  const arr: never[] = [];
  return new Proxy(arr, {
    get(target, prop) {
      // Array built-ins (map, filter, length, Symbol.iterator, etc.) work natively
      if (prop in target || typeof prop === "symbol") {
        const v = (target as unknown as Record<string | symbol, unknown>)[prop];
        return typeof v === "function" ? v.bind(target) : v;
      }
      if (prop === "then") return undefined;
      // Unknown properties (e.g. .tierRates, .profileType) → another safe value
      return safeValue();
    },
    apply() {
      return Promise.resolve(safeValue());
    },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function noOp(): any {
  return new Proxy(() => {}, {
    get(_target, prop) {
      if (prop === "then" || typeof prop === "symbol") return undefined;
      return noOp();
    },
    apply() {
      return Promise.resolve(safeValue());
    },
  });
}

// Lazy-initialized Prisma client. At runtime, delegates to the real PrismaClient.
// During Next.js build (no env vars), returns chainable no-ops so prerendering
// doesn't crash.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: PrismaClient = new Proxy({} as any, {
  get(_target, prop) {
    if (prop === "then" || typeof prop === "symbol") return undefined;
    const client = getClient();
    if (!client) return noOp();
    const value = (client as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? (value as Function).bind(client) : value;
  },
});
