import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Sub-etapa 5, Tarefa 6 — tenant resolution from webhook payload.
 *
 * Resolves which Organization owns the incoming webhook by looking up the
 * `MemberConnection` row whose `(integration.slug, externalUserId)` pair
 * matches the provider and the external identifier extracted from the payload.
 *
 * RLS bypass — documented exception. `MemberConnection` is RLS-strict post
 * Sub-etapa 4: queries via the runtime singleton (`herd_app`) only see rows
 * matching the active GUC. Webhook handlers don't have a tenant context yet
 * (they're discovering it), so they must read MemberConnection ACROSS tenants.
 * This file uses its own PrismaClient bound to `DATABASE_URL` (postgres role,
 * `rolbypassrls=true`) — the same admin role used by migrations and by
 * integration tests' `adminClient`. The client is NOT exported; only the
 * `resolveTenantFromPayload` function is. That keeps the RLS bypass
 * surface as small as possible.
 *
 * Why not the runtime singleton wrapped in `withTenant(SYSTEM_TENANT)`?
 * Because there is no system tenant. The query must read all tenants'
 * MemberConnections, find the one that owns the external user/shop, and
 * return its tenantId. RLS would correctly block this for a non-bypass role.
 *
 * Why not run it inside an explicit `$transaction` that sets the GUC to NULL?
 * `set_config(..., NULL, true)` would still leave the RLS policy evaluating
 * `tenant_id = NULL` → false → 0 rows. The bypass role is the only way.
 */

type Provider = "gorgias" | "intercom" | "recharge" | "braintree";

export type TenantResolution =
  | { ok: true; tenantId: string }
  | { ok: false; reason: string };

// Module-local admin client. Mirrors the singleton pattern of `prisma.ts`
// (pinned to globalThis to survive duplicate module loads), but uses the
// admin URL — postgres, bypass RLS. Deliberately NOT exported.
const STORAGE_KEY = Symbol.for("herd.webhooks.tenantResolverAdminClient");
type GlobalWithAdmin = typeof globalThis & {
  [STORAGE_KEY]?: PrismaClient;
};
const g = globalThis as GlobalWithAdmin;

function getAdminClient(): PrismaClient {
  if (!g[STORAGE_KEY]) {
    const url = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
    if (!url) {
      throw new Error(
        "tenant-resolver: DATABASE_URL or DIRECT_URL must be set (admin/bypass connection required for cross-tenant MemberConnection lookup)",
      );
    }
    g[STORAGE_KEY] = new PrismaClient({ adapter: new PrismaPg(url) });
  }
  return g[STORAGE_KEY]!;
}

/**
 * Extracts the provider-specific external identifier that links the webhook
 * payload back to a `MemberConnection.externalUserId`. Each provider sends a
 * different field shape:
 *
 *  - Gorgias: top-level `account_id` (numeric) or nested `account.id`.
 *  - Intercom: `app_id` at top level, or `app.id_code` for newer payloads.
 *  - Recharge: `customer.id` (per-shop customer), or `merchant_id` for some
 *    event types.
 *  - Braintree: the payload is an SDK-parsed `WebhookNotification`. Customer
 *    id lives under different paths per kind — `subscription.customerId`,
 *    `transaction.customer.id` or `transaction.customerId`,
 *    `dispute.transaction.customerId`. The SDK's sample fixtures
 *    intentionally omit customerId, so the resolver applies a 1-tenant
 *    fallback (see `resolveTenantFromPayload`).
 *
 * Returns null if no recognizable identifier is present — the caller treats
 * that as "no tenant resolvable" and returns 400.
 */
function extractExternalId(provider: Provider, payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  const p = payload as Record<string, unknown>;

  const stringify = (v: unknown): string | null => {
    if (typeof v === "string") return v;
    if (typeof v === "number" || typeof v === "bigint") return String(v);
    return null;
  };

  switch (provider) {
    case "gorgias": {
      const direct = stringify(p["account_id"]);
      if (direct) return direct;
      const account = p["account"] as Record<string, unknown> | undefined;
      return stringify(account?.["id"]);
    }
    case "intercom": {
      const direct = stringify(p["app_id"]);
      if (direct) return direct;
      const app = p["app"] as Record<string, unknown> | undefined;
      return stringify(app?.["id_code"]) ?? stringify(app?.["id"]);
    }
    case "recharge": {
      const customer = p["customer"] as Record<string, unknown> | undefined;
      const customerId = stringify(customer?.["id"]);
      if (customerId) return customerId;
      return stringify(p["merchant_id"]) ?? stringify(p["shop_id"]);
    }
    case "braintree": {
      // The Braintree webhook payload is a parsed `WebhookNotification`
      // (subject + kind + timestamp). Customer id location varies by kind.
      const kind = stringify(p["kind"]);
      const subject = p["subject"] as Record<string, unknown> | undefined;
      if (!kind || !subject) return null;

      if (kind.startsWith("subscription_")) {
        const sub = subject["subscription"] as
          | Record<string, unknown>
          | undefined;
        return stringify(sub?.["customerId"]);
      }
      if (kind.startsWith("transaction_")) {
        const txn = subject["transaction"] as
          | Record<string, unknown>
          | undefined;
        if (!txn) return null;
        const customerObj = txn["customer"] as
          | Record<string, unknown>
          | undefined;
        return (
          stringify(customerObj?.["id"]) ?? stringify(txn["customerId"])
        );
      }
      if (kind.startsWith("dispute_")) {
        const disp = subject["dispute"] as
          | Record<string, unknown>
          | undefined;
        const txn = disp?.["transaction"] as
          | Record<string, unknown>
          | undefined;
        return stringify(txn?.["customerId"]);
      }
      return null;
    }
  }
}

export async function resolveTenantFromPayload(
  provider: Provider,
  payload: unknown,
): Promise<TenantResolution> {
  const externalId = extractExternalId(provider, payload);
  const admin = getAdminClient();

  // V1 1-tenant fallback for billing providers (braintree + recharge).
  // Applies in two cases:
  //   (a) externalId could not be extracted from the payload (SDK sample
  //       fixtures or minimal payloads omit customer id), OR
  //   (b) externalId was extracted but no MemberConnection matches it
  //       (e.g. seed used `merchant_id` but payload sent `customer.id`,
  //       or first webhook arrived before any per-customer seed existed).
  //
  // In both cases, if there is exactly ONE MemberConnection for the
  // provider, resolve to its tenant. Trigger to remove: multi-tenant
  // Recharge/Braintree (tech debt em AGENTS.md "Tenant activation flow").
  const FALLBACK_PROVIDERS = ["braintree", "recharge"] as const;
  const supportsFallback = (FALLBACK_PROVIDERS as readonly string[]).includes(
    provider,
  );

  // Case (a): no externalId.
  if (!externalId) {
    if (!supportsFallback) {
      return {
        ok: false,
        reason: `cannot extract external id from ${provider} payload`,
      };
    }
    return await resolveSingleConnectionFallback(admin, provider);
  }

  // Normal path — try external id match first.
  const connection = await admin.memberConnection.findFirst({
    where: {
      externalUserId: externalId,
      integration: { slug: provider },
    },
    select: { tenantId: true },
  });

  if (connection) {
    return { ok: true, tenantId: connection.tenantId };
  }

  // Case (b): externalId present but no match. Fallback if supported.
  if (supportsFallback) {
    return await resolveSingleConnectionFallback(admin, provider);
  }

  return {
    ok: false,
    reason: `no MemberConnection found for ${provider} external_id=${externalId}`,
  };
}

/**
 * V1 1-tenant fallback: if there is exactly ONE MemberConnection for the
 * provider, use its tenantId. Zero or more than one is a denial reason.
 * Only invoked for providers in `FALLBACK_PROVIDERS` (braintree, recharge).
 */
async function resolveSingleConnectionFallback(
  admin: PrismaClient,
  provider: Provider,
): Promise<TenantResolution> {
  const connections = await admin.memberConnection.findMany({
    where: { integration: { slug: provider } },
    take: 2,
    select: { tenantId: true },
  });
  if (connections.length === 1) {
    return { ok: true, tenantId: connections[0]!.tenantId };
  }
  return {
    ok: false,
    reason:
      connections.length === 0
        ? `no MemberConnection found for ${provider} (V1 1-tenant fallback requires exactly 1)`
        : `multiple MemberConnections found for ${provider} — V1 1-tenant fallback requires exactly 1`,
  };
}

/**
 * Internal hook for tests — exposed only so suites can introspect the
 * extractor without going through the DB. Not intended for production use.
 */
export const __internal = { extractExternalId };
