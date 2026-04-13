import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateMessageChannelSchema } from "@/lib/validators/messages";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const channel = await prisma.messageChannel.findUnique({
    where: { id },
    include: {
      integration: { select: { id: true, name: true, slug: true, logoUrl: true } },
      _count: { select: { threads: true } },
    },
  });

  if (!channel) return apiError("Channel not found", 404);
  return apiSuccess(channel);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateMessageChannelSchema);
  if ("error" in result) return result.error;

  const existing = await prisma.messageChannel.findUnique({ where: { id } });
  if (!existing) return apiError("Channel not found", 404);

  const channel = await prisma.messageChannel.update({
    where: { id },
    data: result.data,
    include: {
      integration: { select: { id: true, name: true, slug: true, logoUrl: true } },
      _count: { select: { threads: true } },
    },
  });

  return apiSuccess(channel);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.messageChannel.findUnique({ where: { id } });
  if (!existing) return apiError("Channel not found", 404);

  await prisma.messageChannel.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
