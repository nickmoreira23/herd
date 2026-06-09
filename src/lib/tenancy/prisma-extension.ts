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
  // Sub-etapa 9 — Payment Provider Layer (11 tables)
  "PaymentProvider",
  "BillingCustomer",
  "PaymentMethod",
  "Subscription",
  "Charge",
  "ChargeLineItem",
  "Invoice",
  "Refund",
  "DunningAttempt",
  "PortalSession",
  "BillingEvent",
  // Sub-etapa 19 — Org Structure (2 tables)
  "Department",
  "Location",
  // Sub-etapa 25 — Audit Log
  "AuditLog",
  // ADR-002 Fatia 1a — curated-consumption junction (tenantId scalar = organizationId)
  "OrganizationLocation",
  // R&P Fase 3 — custom per-org roles. RolePermission is intentionally NOT here: it
  // carries global rows (tenant_id NULL) that an auto-tenant filter would hide; its
  // tenant scoping is manual in loadRoleMatrix().
  "Role",
  // Fase 0 SE3 — Marketplace per-tenant
  "MarketplaceSection",
  "MarketplaceSectionScope",
  // L1a (Listing) — catalog detenanting: Product becomes tenant-scoped. The
  // L1a.2 withTenant wiring goes live from here (GUC set per op). RLS stays
  // permissive (herd_app_full_access) until L1a.4, so reads remain global for now.
  "Product",
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

            // Defense-in-depth layer 2: emit `SET LOCAL app.tenant_id` (exact,
            // write anchor) so Postgres RLS policies enforce isolation. Wrapped
            // in `$transaction` to scope the GUC to this op only — `SET LOCAL`
            // outside a transaction would leak across pooled connections.
            //
            // Sub-26.2 vertical read: READ ops additionally set `app.tenant_ids`
            // (self + transitive descendants) and widen the ORM filter to
            // `{ tenantId: { in: [...] } }`. Writes (create/update/delete/upsert/
            // updateMany/deleteMany) stay EXACT via applyTenantFilter — vertical
            // write is Sub-26.3, via context re-entry. The descendant closure is
            // computed with an inline WITH RECURSIVE on `organizations` (same SQL
            // as src/lib/org-hierarchy/getDescendants) — inlined rather than
            // imported to avoid the prisma → extension → org-hierarchy import
            // cycle. No cache (V1): sub-ms per the Sub-26.2 benchmark.
            //
            // NOTE: until the T3 policy migration flips USING to
            // `= ANY(current_app_tenant_ids())`, the policies still read the
            // singular `app.tenant_id`, so RLS clamps reads back to the exact
            // tenant — production isolation is UNCHANGED by this Extension alone.
            //
            // Caminho B (confirmed correct): dispatch the op on `tx` directly;
            // the original `query(args)` runs outside this implicit tx.
            const isRead = READ_OPS.has(operation);
            return await client.$transaction(
              async (tx) => {
                await tx.$executeRaw`SELECT set_config('app.tenant_id', ${tenantId}, true)`;

                let finalArgs: unknown;
                if (isRead) {
                  const descendants = await tx.$queryRaw<{ id: string }[]>`
                    WITH RECURSIVE d AS (
                      SELECT id FROM organizations WHERE parent_org_id = ${tenantId}::uuid
                      UNION ALL
                      SELECT o.id FROM organizations o JOIN d ON o.parent_org_id = d.id
                    )
                    SELECT id::text AS id FROM d
                  `;
                  const tenantIds = [tenantId, ...descendants.map((r) => r.id)];
                  await tx.$executeRaw`SELECT set_config('app.tenant_ids', ${tenantIds.join(",")}, true)`;
                  const a = (args ?? {}) as { where?: Record<string, unknown> };
                  finalArgs = { ...a, where: { ...a.where, tenantId: { in: tenantIds } } };
                } else {
                  finalArgs = applyTenantFilter(operation, args, tenantId);
                }

                // Prisma delegate key is camelCase (model is PascalCase).
                const delegateKey = model.charAt(0).toLowerCase() + model.slice(1);
                const txAny = tx as unknown as Record<
                  string,
                  Record<string, (a: unknown) => Promise<unknown>>
                >;
                return await txAny[delegateKey][operation](finalArgs);
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
