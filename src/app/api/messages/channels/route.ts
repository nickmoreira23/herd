import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createMessageChannelSchema } from "@/lib/validators/messages";

export async function GET() {
  const channels = await prisma.messageChannel.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      integration: { select: { id: true, name: true, slug: true, logoUrl: true } },
      _count: { select: { threads: true } },
    },
  });

  return apiSuccess(channels);
}

export async function POST(request: NextRequest) {
  const result = await parseAndValidate(request, createMessageChannelSchema);
  if ("error" in result) return result.error;

  const { channelType, integrationId } = result.data;

  // Check for duplicate channel type + integration combo
  const existing = await prisma.messageChannel.findUnique({
    where: {
      channelType_integrationId: { channelType, integrationId: integrationId ?? "" },
    },
  });
  if (existing) {
    return apiError("A channel with this type and integration already exists", 409);
  }

  const channel = await prisma.messageChannel.create({
    data: result.data,
    include: {
      integration: { select: { id: true, name: true, slug: true, logoUrl: true } },
      _count: { select: { threads: true } },
    },
  });

  return apiSuccess(channel, 201);
}
