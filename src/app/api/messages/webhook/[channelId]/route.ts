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
    await prisma.integrationWebhookEvent.create({
      data: {
        integrationId: channel.integrationId,
        eventType: `message.${channel.channelType.toLowerCase()}`,
        payload,
      },
    });
  }

  // TODO: Validate webhook signature using channel.webhookSecret
  // TODO: Look up channel adapter and call adapter.handleWebhook(channel, payload)
  // TODO: Contact resolution via contact-resolver.ts

  return apiSuccess({ received: true });
}
