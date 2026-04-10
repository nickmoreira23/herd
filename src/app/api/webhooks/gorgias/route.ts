import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const parsed = JSON.parse(body);
    const eventType = parsed.event || parsed.type || "unknown";

    const integration = await prisma.integration.findUnique({
      where: { slug: "gorgias" },
    });
    if (!integration) return apiError("Gorgias integration not found", 404);

    await prisma.integrationWebhookEvent.create({
      data: {
        integrationId: integration.id,
        eventType,
        payload: body,
      },
    });

    return apiSuccess({ received: true });
  } catch (e) {
    console.error("POST /api/webhooks/gorgias error:", e);
    return apiError("Failed to process webhook", 500);
  }
}
