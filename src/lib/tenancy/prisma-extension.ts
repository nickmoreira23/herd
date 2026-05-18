import { Prisma } from "@prisma/client";
import { getTenantId } from "./context";

/**
 * Models cujas queries devem ser auto-filtradas por tenantId quando há contexto ativo.
 * Extension é no-op fora de withTenant, então rotas legadas sem session ainda funcionam
 * pra os 3 modelos cuja coluna tenant_id permanece nullable (X1 — Integration permanece
 * single-tenant; ITM/IWE/ISL ficam nullable até auth de admin API + tenant resolution
 * em webhooks chegarem em sub-etapas posteriores).
 */
export const TENANT_SCOPED_MODELS = [
  "MemberConnection",
  "IntegrationTierMapping",
  "IntegrationWebhookEvent",
  "IntegrationSyncLog",
] as const satisfies readonly string[];

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

/**
 * Applies the tenant filter to operation args based on op kind.
 * Mirrors ORM-level scoping (defense-in-depth layer 1).
 */
function applyTenantFilter(
  operation: string,
  args: unknown,
  tenantId: string,
): unknown {
  if (READ_OPS.has(operation) || WRITE_BATCH_OPS.has(operation)) {
    const a = args as { where?: Record<string, unknown> };
    a.where = { ...a.where, tenantId };
    return a;
  }
  if (operation === "create") {
    const a = args as { data?: Record<string, unknown> };
    a.data = { ...a.data, tenantId };
    return a;
  }
  if (operation === "createMany") {
    const a = args as {
      data?: Record<string, unknown> | Record<string, unknown>[];
    };
    if (Array.isArray(a.data)) {
      a.data = a.data.map((d) => ({ ...d, tenantId }));
    } else if (a.data) {
      a.data = { ...a.data, tenantId };
    }
    return a;
  }
  if (operation === "update" || operation === "delete") {
    const a = args as { where: Record<string, unknown> };
    a.where = { ...a.where, tenantId };
    return a;
  }
  if (operation === "upsert") {
    const a = args as {
      where: Record<string, unknown>;
      create: Record<string, unknown>;
      update: Record<string, unknown>;
    };
    a.where = { ...a.where, tenantId };
    a.create = { ...a.create, tenantId };
    return a;
  }
  return args;
}

export function createTenantScopingExtension(scopedModels: readonly string[]) {
  const scoped = new Set(scopedModels);

  // Function form gives us closure access to `client` so we can open an
  // implicit `$transaction` from inside the query handler. Required to set
  // the `app.tenant_id` GUC scoped to the operation (SET LOCAL persists only
  // for the duration of the transaction — no leak between pooled connections).
  return Prisma.defineExtension((client) =>
    client.$extends({
      name: "tenant-scoping",
      query: {
        $allModels: {
          async $allOperations({ model, operation, args, query }) {
            const tenantId = getTenantId();

            // No-op when outside withTenant or model is not in scope.
            if (!tenantId || !model || !scoped.has(model)) {
              return query(args);
            }

            // Defense-in-depth layer 1: ORM-level filter.
            const filteredArgs = applyTenantFilter(operation, args, tenantId);

            // Defense-in-depth layer 2: emit `SET LOCAL app.tenant_id` so
            // Postgres RLS policies (`current_app_tenant_id()` GUC reader)
            // can enforce isolation. Wrapped in `$transaction` to scope the
            // GUC to this op only — `SET LOCAL` outside a transaction would
            // leak across requests sharing the same pooled connection.
            //
            // Tech debt: 2 round-trips per tenant-scoped op (SET + query).
            // Optimize when p99 latency on these ops exceeds ~50ms in prod
            // (Sub-etapa 4, decisão #7).
            //
            // Caminho B (confirmed correct): the `query(args)` function passed
            // to $allOperations is bound to a client/connection OUTSIDE the
            // implicit $transaction we open here, so calling it directly does
            // NOT run inside the tx (GUC verification test proved this — value
            // returned null). We must dispatch the operation on `tx` directly.
            // Caminho A (relying on AsyncLocalStorage propagation) was tried
            // first per spec and rejected after the GUC test in
            // `guc-set.integration.test.ts` failed.
            return await client.$transaction(
              async (tx) => {
                await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;
                // Dispatch the original operation on the transactional client.
                // Prisma's delegate methods (findMany, create, etc.) live as
                // properties on a per-model object: `tx[modelDelegate][op]`.
                // Model name in $allOperations is PascalCase (e.g. "IntegrationSyncLog"),
                // but the delegate key is camelCase (e.g. "integrationSyncLog").
                const delegateKey = model.charAt(0).toLowerCase() + model.slice(1);
                const txAny = tx as unknown as Record<
                  string,
                  Record<string, (a: unknown) => Promise<unknown>>
                >;
                return await txAny[delegateKey][operation](filteredArgs);
              },
              { timeout: 10000 },
            );
          },
        },
      },
    }),
  );
}

/** Default extension for production singleton. */
export const tenantScopingExtension = createTenantScopingExtension(
  TENANT_SCOPED_MODELS,
);
