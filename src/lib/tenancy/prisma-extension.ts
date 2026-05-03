import { Prisma } from "@prisma/client";
import { getTenantId } from "./context";

/**
 * Models cujas queries devem ser auto-filtradas por tenantId quando há contexto ativo.
 * Vazia em produção até Sub-etapa 3. Tests passam lista explícita via createTenantScopingExtension.
 */
export const TENANT_SCOPED_MODELS = [] as const satisfies readonly string[];

const READ_OPS = new Set([
  "findFirst",
  "findFirstOrThrow",
  "findMany",
  "findUnique",
  "findUniqueOrThrow",
  "count",
  "aggregate",
  "groupBy",
]);

const WRITE_BATCH_OPS = new Set(["updateMany", "deleteMany"]);

export function createTenantScopingExtension(scopedModels: readonly string[]) {
  const scoped = new Set(scopedModels);

  return Prisma.defineExtension({
    name: "tenant-scoping",
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const tenantId = getTenantId();

          if (!tenantId || !model || !scoped.has(model)) {
            return query(args);
          }

          if (READ_OPS.has(operation) || WRITE_BATCH_OPS.has(operation)) {
            const a = args as { where?: Record<string, unknown> };
            a.where = { ...a.where, tenantId };
            return query(a as typeof args);
          }

          if (operation === "create") {
            const a = args as { data?: Record<string, unknown> };
            a.data = { ...a.data, tenantId };
            return query(a as typeof args);
          }

          if (operation === "createMany") {
            const a = args as { data?: Record<string, unknown> | Record<string, unknown>[] };
            if (Array.isArray(a.data)) {
              a.data = a.data.map((d) => ({ ...d, tenantId }));
            } else if (a.data) {
              a.data = { ...a.data, tenantId };
            }
            return query(a as typeof args);
          }

          if (operation === "update" || operation === "delete") {
            const a = args as { where: Record<string, unknown> };
            a.where = { ...a.where, tenantId };
            return query(a as typeof args);
          }

          if (operation === "upsert") {
            const a = args as {
              where: Record<string, unknown>;
              create: Record<string, unknown>;
              update: Record<string, unknown>;
            };
            a.where = { ...a.where, tenantId };
            a.create = { ...a.create, tenantId };
            return query(a as typeof args);
          }

          return query(args);
        },
      },
    },
  });
}

/** Default extension for production singleton — no-op until TENANT_SCOPED_MODELS grows. */
export const tenantScopingExtension = createTenantScopingExtension(TENANT_SCOPED_MODELS);
