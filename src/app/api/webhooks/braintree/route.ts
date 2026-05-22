import { apiError, apiSuccess } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { emitDomainEvent } from "@/lib/domain-events";
import { resolveTenantFromPayload } from "@/lib/webhooks";
import { BraintreeService } from "@/lib/services/braintree";
import { withTenant } from "@/lib/tenancy/context";

/**
 * Sub-etapa 14, Camada 2 — Braintree webhook ingress.
 *
 * Pipeline (paridade Recharge Sub-etapa 10 inicial, adaptado às
 * convenções Braintree):
 *
 *   1. Parse `application/x-www-form-urlencoded` body via `request.formData()`.
 *      Extract `bt_signature` + `bt_payload`. (Divergente de Recharge:
 *      Braintree usa form-encoded, não JSON.)
 *   2. SDK verify + parse — `gateway.webhookNotification.parse()` faz tudo
 *      em uma chamada. Não há verifier file dedicado (divergente de
 *      Gorgias/Intercom/Recharge).
 *   3. Compute dedup composite key: `${kind}:${subjectId}:${timestamp}`.
 *      Braintree não emite event_id estável; composite é resistente a
 *      retries provider-side (24h prod, 3h sandbox).
 *   4. `resolveTenantFromPayload("braintree", notification)` — extractor
 *      por kind (subscription/transaction/dispute) + V1 1-tenant fallback.
 *   5. Fast-path dedup via `webhook_dedup.findUnique`.
 *   6. Atomic transaction: `webhook_dedup.create` + raw
 *      `IntegrationWebhookEvent` (V1 raw-only, paridade Recharge Sub-etapa
 *      10 inicial) + `emitDomainEvent("webhook.braintree")`.
 *      P2002 race → 200 `{status: "duplicate"}`.
 *   7. 200 `{status: "accepted"}`.
 *
 * Mapper dispatch + BillingEvent audit ficam para Sub-etapa 15.
 */

const PROVIDER = "braintree" as const;
const EVENT_TYPE = "webhook.braintree" as const;

interface BraintreeNotificationLike {
  kind: string;
  // Runtime returns ISO-8601 string (e.g. "2026-05-21T21:12:08Z").
  // @types/braintree v3.4 typing diverges from runtime; coerce defensively.
  timestamp: string | Date;
  subject: Record<string, unknown>;
}

/**
 * Extracts the stable subject id from a Braintree WebhookNotification
 * for the dedup composite key. Switch mirrors `extractExternalId` in
 * tenant-resolver.ts but reads the subject id (subscription/transaction/
 * dispute id) rather than the customer id.
 */
function extractSubjectId(notification: BraintreeNotificationLike): string | null {
  const kind = notification.kind;
  const subject = notification.subject;

  if (kind.startsWith("subscription_")) {
    const sub = subject["subscription"] as Record<string, unknown> | undefined;
    const id = sub?.["id"];
    return typeof id === "string" ? id : null;
  }
  if (kind.startsWith("transaction_")) {
    const txn = subject["transaction"] as Record<string, unknown> | undefined;
    const id = txn?.["id"];
    return typeof id === "string" ? id : null;
  }
  if (kind.startsWith("dispute_")) {
    const disp = subject["dispute"] as Record<string, unknown> | undefined;
    const id = disp?.["id"];
    return typeof id === "string" ? id : null;
  }
  return null;
}

function isPrismaUniqueViolation(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; meta?: { target?: unknown } };
  return e.code === "P2002";
}

export async function POST(request: Request) {
  // 1. Parse form-encoded body.
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return apiError("invalid body format (expected form-encoded)", 400);
  }

  const btSignature = formData.get("bt_signature");
  const btPayload = formData.get("bt_payload");

  if (typeof btSignature !== "string" || typeof btPayload !== "string") {
    return apiError("missing bt_signature or bt_payload", 400);
  }

  // 2. Load service (gateway) and SDK-verify+parse.
  let service: BraintreeService;
  try {
    service = await BraintreeService.fromIntegration();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhooks/braintree] failed to load integration:", msg);
    return apiError("integration not configured", 500);
  }

  let notification: BraintreeNotificationLike;
  try {
    notification = (await service.gateway.webhookNotification.parse(
      btSignature,
      btPayload,
    )) as unknown as BraintreeNotificationLike;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[webhooks/braintree] signature verify failed:", msg);
    return apiError("invalid signature", 401);
  }

  const kind = notification.kind;
  if (typeof kind !== "string" || kind.length === 0) {
    return apiError("notification.kind missing or invalid", 400);
  }

  // Runtime: timestamp is an ISO string. Normalize to canonical ISO via Date
  // to guarantee `.toISOString()` shape regardless of provider-side formatting.
  const tsValue = notification.timestamp;
  const tsParsed =
    tsValue instanceof Date ? tsValue : new Date(String(tsValue));
  const timestamp = Number.isNaN(tsParsed.getTime())
    ? new Date().toISOString()
    : tsParsed.toISOString();

  // 3. Compute dedup composite.
  const subjectId = extractSubjectId(notification);
  if (!subjectId) {
    return apiError(`unable to extract subject id for kind=${kind}`, 400);
  }
  const dedupKey = `${kind}:${subjectId}:${timestamp}`;

  // 4. Tenant resolution.
  const tenant = await resolveTenantFromPayload(PROVIDER, notification);
  if (!tenant.ok) {
    console.error("[webhooks/braintree] tenant resolution failed:", tenant.reason);
    return apiError(tenant.reason, 400);
  }

  // 5. Fast-path dedup.
  const seen = await prisma.webhookDedup.findUnique({
    where: { provider_eventId: { provider: PROVIDER, eventId: dedupKey } },
    select: { id: true },
  });
  if (seen) {
    return apiSuccess({ status: "duplicate" });
  }

  // Lookup Integration row for IWE.integrationId (required NOT NULL).
  const integration = await prisma.integration.findUnique({
    where: { slug: PROVIDER },
    select: { id: true },
  });
  if (!integration) {
    console.error("[webhooks/braintree] Integration row missing — seed:braintree not run?");
    return apiError("integration row not seeded", 500);
  }

  // 6. Atomic dedup + IWE raw + outbox emit.
  //
  // Sub-etapa 17.0.4 fix — RLS via `withTenant`:
  //   `IntegrationWebhookEvent` is tenant-scoped + RLS strict. The
  //   runtime singleton (`@/lib/prisma`) connects via
  //   `RUNTIME_DATABASE_URL` (role `herd_app`, NOBYPASSRLS), so the
  //   `tx.integrationWebhookEvent.create` below would fail the
  //   `WITH CHECK` clause (code 42501) unless the `app.tenant_id` GUC
  //   is set. `withTenant(tenant.tenantId, ...)` sets that GUC via
  //   `set_config('app.tenant_id', uuid, true)` for the duration of
  //   the callback (Prisma Extension Caminho B, AGENTS.md "Row Level
  //   Security"). Passing `data.tenantId` on the create is NOT enough
  //   — the GUC is what the policy reads.
  //
  //   `webhookDedup` is platform-wide (no RLS) and `emitDomainEvent`
  //   writes to `domain_events` (also platform-wide), so they don't
  //   need the wrap. But wrapping the entire `$transaction` keeps the
  //   3 writes atomic and the GUC scope clean.
  try {
    await withTenant(tenant.tenantId, async () => {
      await prisma.$transaction(async (tx) => {
        await tx.webhookDedup.create({
          data: { provider: PROVIDER, eventId: dedupKey },
        });

        // Raw IWE audit (V1 paridade Recharge Sub-etapa 10 inicial).
        // tenantId NOT NULL on the schema; we resolved it above.
        await tx.integrationWebhookEvent.create({
          data: {
            tenantId: tenant.tenantId,
            integrationId: integration.id,
            eventType: kind,
            payload: JSON.stringify({
              kind,
              timestamp,
              subject: notification.subject,
            }),
          },
        });

        await emitDomainEvent(
          {
            aggregateType: "webhook",
            aggregateId: tenant.tenantId,
            eventType: EVENT_TYPE,
            payload: {
              tenantId: tenant.tenantId,
              braintree_kind: kind,
              braintree_subject_id: subjectId,
              braintree_timestamp: timestamp,
              body: notification.subject,
            },
          },
          tx,
        );
      });
    });
  } catch (err) {
    if (isPrismaUniqueViolation(err)) {
      return apiSuccess({ status: "duplicate" });
    }
    console.error("[webhooks/braintree] transaction failed:", err);
    return apiError("Failed to record webhook", 500);
  }

  return apiSuccess({ status: "accepted" });
}
