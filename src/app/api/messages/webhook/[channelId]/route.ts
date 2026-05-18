import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ channelId: string }> }
) {
  const { channelId } = await params;

  const channel = await prisma.messageChannel.findUnique({
    where: { id: channelId },
  });
  if (!channel) return apiError("Channel not found", 404);
  if (!channel.isActive) return apiError("Channel is disabled", 400);

  // Log the raw webhook event
  const payload = await request.json();

  if (channel.integrationId) {
    // TODO(camada-1 follow-up): this route does not yet resolve a tenant
    // from the channel/payload. After Sub-etapa 6 promoted IWE.tenant_id
    // to NOT NULL, this INSERT will fail at runtime (RLS strict + NOT NULL
    // both reject NULL tenant). The route is fully gated by the unfinished
    // TODOs below — it should not be wired to a live provider until those
    // are addressed. The cast satisfies TypeScript; the runtime failure
    // is intentional surfacing of the incomplete state.
    await prisma.integrationWebhookEvent.create({
      data: {
        integrationId: channel.integrationId,
        eventType: `message.${channel.channelType.toLowerCase()}`,
        payload,
      } as unknown as Parameters<
        typeof prisma.integrationWebhookEvent.create
      >[0]["data"],
    });
  }

  // TODO: Validate webhook signature using channel.webhookSecret
  // TODO: Look up channel adapter and call adapter.handleWebhook(channel, payload)
  // TODO: Contact resolution via contact-resolver.ts
  // TODO: Resolve tenantId before the IWE INSERT above (post Sub-etapa 6).

  return apiSuccess({ received: true });
}
