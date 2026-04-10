import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const parsed = JSON.parse(body);
    const topic = parsed.topic || "unknown";

    const integration = await prisma.integration.findUnique({
      where: { slug: "intercom" },
    });
    if (!integration) return apiError("Intercom integration not found", 404);

    await prisma.integrationWebhookEvent.create({
      data: {
        integrationId: integration.id,
        eventType: topic,
        payload: body,
      },
    });

    return apiSuccess({ received: true });
  } catch (e) {
    console.error("POST /api/webhooks/intercom error:", e);
    return apiError("Failed to process webhook", 500);
  }
}
