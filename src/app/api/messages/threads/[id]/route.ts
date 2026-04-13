import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateMessageThreadSchema } from "@/lib/validators/messages";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const thread = await prisma.messageThread.findUnique({
    where: { id },
    include: {
      channel: { select: { id: true, name: true, channelType: true } },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
        },
      },
      assignee: {
        select: { id: true, firstName: true, lastName: true, avatarUrl: true },
      },
      messages: {
        orderBy: { sentAt: "asc" },
      },
      _count: { select: { messages: true } },
    },
  });

  if (!thread) return apiError("Thread not found", 404);
  return apiSuccess(thread);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateMessageThreadSchema);
  if ("error" in result) return result.error;

  const existing = await prisma.messageThread.findUnique({ where: { id } });
  if (!existing) return apiError("Thread not found", 404);

  const updateData: Record<string, unknown> = { ...result.data };
  if (result.data.status === "CLOSED") {
    updateData.closedAt = new Date();
  }

  const thread = await prisma.messageThread.update({
    where: { id },
    data: updateData,
    include: {
      channel: { select: { id: true, name: true, channelType: true } },
      contact: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      assignee: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  return apiSuccess(thread);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const existing = await prisma.messageThread.findUnique({ where: { id } });
  if (!existing) return apiError("Thread not found", 404);

  await prisma.messageThread.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
