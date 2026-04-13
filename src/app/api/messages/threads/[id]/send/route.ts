import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { sendMessageSchema } from "@/lib/validators/messages";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: threadId } = await params;
  const result = await parseAndValidate(request, sendMessageSchema);
  if ("error" in result) return result.error;

  const thread = await prisma.messageThread.findUnique({
    where: { id: threadId },
    include: { channel: true },
  });
  if (!thread) return apiError("Thread not found", 404);

  const now = new Date();

  const message = await prisma.message.create({
    data: {
      threadId,
      direction: "OUTBOUND",
      status: "SENT",
      content: result.data.content,
      contentType: result.data.contentType,
      sentAt: now,
    },
  });

  // Update thread's last message timestamp and re-open if closed
  await prisma.messageThread.update({
    where: { id: threadId },
    data: {
      lastMessageAt: now,
      ...(thread.status === "CLOSED" && { status: "OPEN", closedAt: null }),
    },
  });

  return apiSuccess(message, 201);
}
