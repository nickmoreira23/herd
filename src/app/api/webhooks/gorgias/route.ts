import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenancy/context";
import {
  GorgiasWebhookVerifier,
  resolveTenantFromPayload,
} from "@/lib/webhooks";

// Verifier constructed once at module load. A missing secret yields a
// fail-closed verifier that rejects every request with 401 — see
// `GorgiasWebhookVerifier`.
const verifier = new GorgiasWebhookVerifier(
  process.env.GORGIAS_WEBHOOK_SECRET ?? "",
);

function headersToRecord(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

export async function POST(request: Request) {
  // Read raw bytes BEFORE parsing JSON — the HMAC is computed over the exact
  // wire payload. arrayBuffer() returns the original bytes without any
  // string decoding round-trip.
  const rawBody = Buffer.from(await request.arrayBuffer());
  const headers = headersToRecord(request);

  const verification = await verifier.verify(rawBody, headers);
  if (!verification.ok) {
    return apiError(verification.reason, verification.statusCode);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody.toString("utf8"));
  } catch {
    return apiError("invalid JSON body", 400);
  }

  const tenant = await resolveTenantFromPayload("gorgias", parsed);
  if (!tenant.ok) {
    return apiError(tenant.reason, 400);
  }

  const eventType =
    (parsed as { event?: string; type?: string }).event ??
    (parsed as { type?: string }).type ??
    "unknown";

  try {
    return await withTenant(tenant.tenantId, async () => {
      const integration = await prisma.integration.findUnique({
        where: { slug: "gorgias" },
      });
      if (!integration) return apiError("Gorgias integration not found", 404);

      await prisma.integrationWebhookEvent.create({
        data: {
          integrationId: integration.id,
          eventType,
          payload: rawBody.toString("utf8"),
        },
      });

      return apiSuccess({ received: true });
    });
  } catch (e) {
    console.error("POST /api/webhooks/gorgias error:", e);
    return apiError("Failed to process webhook", 500);
  }
}
