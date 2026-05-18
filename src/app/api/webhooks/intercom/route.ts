import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { withTenant } from "@/lib/tenancy/context";
import {
  IntercomWebhookVerifier,
  resolveTenantFromPayload,
} from "@/lib/webhooks";

const verifier = new IntercomWebhookVerifier(
  process.env.INTERCOM_WEBHOOK_SECRET ?? "",
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

  const tenant = await resolveTenantFromPayload("intercom", parsed);
  if (!tenant.ok) {
    return apiError(tenant.reason, 400);
  }

  const topic = (parsed as { topic?: string }).topic ?? "unknown";

  try {
    return await withTenant(tenant.tenantId, async () => {
      const integration = await prisma.integration.findUnique({
        where: { slug: "intercom" },
      });
      if (!integration) return apiError("Intercom integration not found", 404);

      await prisma.integrationWebhookEvent.create({
        data: {
          integrationId: integration.id,
          eventType: topic,
          payload: rawBody.toString("utf8"),
        },
      });

      return apiSuccess({ received: true });
    });
  } catch (e) {
    console.error("POST /api/webhooks/intercom error:", e);
    return apiError("Failed to process webhook", 500);
  }
}
