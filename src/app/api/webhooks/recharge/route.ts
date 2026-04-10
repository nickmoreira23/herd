import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(request: Request) {
  try {
    const body = await request.text();
    const topic = request.headers.get("x-recharge-topic") || "unknown";

    const integration = await prisma.integration.findUnique({
      where: { slug: "recharge" },
    });
    if (!integration) return apiError("Recharge integration not found", 404);

    await prisma.integrationWebhookEvent.create({
      data: {
        integrationId: integration.id,
        eventType: topic,
        payload: body,
      },
    });

    return apiSuccess({ received: true });
  } catch (e) {
    console.error("POST /api/webhooks/recharge error:", e);
    return apiError("Failed to process webhook", 500);
  }
}
