import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { RechargeService } from "@/lib/services/recharge";
import { z } from "zod";

const createWebhookSchema = z.object({
  topic: z.string().min(1),
  address: z.string().url(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const integration = await prisma.integration.findUnique({ where: { id } });
    if (!integration) return apiError("Integration not found", 404);
    if (!integration.credentials) return apiError("Integration not connected", 400);

    const creds = JSON.parse(decrypt(integration.credentials)) as { apiToken: string };

    if (integration.slug === "recharge") {
      const svc = new RechargeService(creds.apiToken);
      const webhooks = await svc.listWebhooks();
      return apiSuccess(webhooks);
    }

    return apiSuccess([]);
  } catch (e) {
    console.error("GET /api/integrations/[id]/webhooks error:", e);
    return apiError("Failed to fetch webhooks", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const integration = await prisma.integration.findUnique({ where: { id } });
    if (!integration) return apiError("Integration not found", 404);
    if (!integration.credentials) return apiError("Integration not connected", 400);

    const body = await request.json();
    const parsed = createWebhookSchema.safeParse(body);
    if (!parsed.success) return apiError("Invalid webhook data", 400, parsed.error.issues);

    const creds = JSON.parse(decrypt(integration.credentials)) as { apiToken: string };

    if (integration.slug === "recharge") {
      const svc = new RechargeService(creds.apiToken);
      const webhook = await svc.createWebhook(parsed.data.topic, parsed.data.address);
      return apiSuccess(webhook, 201);
    }

    return apiError("Webhooks not supported for this integration", 400);
  } catch (e) {
    console.error("POST /api/integrations/[id]/webhooks error:", e);
    return apiError("Failed to create webhook", 500);
  }
}
