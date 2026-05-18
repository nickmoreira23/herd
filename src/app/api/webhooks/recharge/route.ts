import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenancy/context";
import {
  RechargeWebhookVerifier,
  resolveTenantFromPayload,
} from "@/lib/webhooks";

// Recharge signing is `sha256(client_secret + body)` literal concat — NOT HMAC.
// See verifier doc + the explicit test `recharge.verifier.test.ts` for the
// load-bearing assertion guarding against accidental createHmac "fixes".
const verifier = new RechargeWebhookVerifier(
  process.env.RECHARGE_WEBHOOK_SECRET ?? "",
);

function headersToRecord(req: Request): Record<string, string> {
  const out: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    out[key.toLowerCase()] = value;
  });
  return out;
}

export async function POST(request: Request) {
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

  const tenant = await resolveTenantFromPayload("recharge", parsed);
  if (!tenant.ok) {
    return apiError(tenant.reason, 400);
  }

  const topic = headers["x-recharge-topic"] ?? "unknown";

  try {
    return await withTenant(tenant.tenantId, async () => {
      const integration = await prisma.integration.findUnique({
        where: { slug: "recharge" },
      });
      if (!integration) return apiError("Recharge integration not found", 404);

      // tenantId is injected by the Prisma tenant-scoping extension from
      // the active withTenant context. Cast required after Sub-etapa 6
      // promoted IWE.tenant_id to NOT NULL.
      await prisma.integrationWebhookEvent.create({
        data: {
          integrationId: integration.id,
          eventType: topic,
          payload: rawBody.toString("utf8"),
        } as unknown as Parameters<
          typeof prisma.integrationWebhookEvent.create
        >[0]["data"],
      });

      return apiSuccess({ received: true });
    });
  } catch (e) {
    console.error("POST /api/webhooks/recharge error:", e);
    return apiError("Failed to process webhook", 500);
  }
}
