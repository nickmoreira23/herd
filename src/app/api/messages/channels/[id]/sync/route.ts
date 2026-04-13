import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const channel = await prisma.messageChannel.findUnique({
    where: { id },
    include: { integration: true },
  });
  if (!channel) return apiError("Channel not found", 404);
  if (!channel.isActive) return apiError("Channel is disabled", 400);

  // TODO: Look up channel adapter from registry and call adapter.sync(channel)
  // For now, return a placeholder response
  return apiSuccess({
    channelId: id,
    channelType: channel.channelType,
    synced: false,
    message: "Channel adapter not yet configured",
  });
}
