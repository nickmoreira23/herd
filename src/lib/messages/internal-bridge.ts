import { prisma } from "@/lib/prisma";

/**
 * Mirrors a ChatMessage into the Messages block.
 * Call this from the chat API route after persisting a chat message.
 */
export async function mirrorChatMessage(
  conversationId: string,
  messageId: string
): Promise<void> {
  // Find the INTERNAL channel
  const channel = await prisma.messageChannel.findFirst({
    where: { channelType: "INTERNAL", isActive: true },
  });

  if (!channel) return; // No internal channel configured

  // Find or create the MessageThread for this conversation
  let thread = await prisma.messageThread.findFirst({
    where: {
      channelId: channel.id,
      externalThreadId: conversationId,
    },
  });

  const chatConversation = await prisma.chatConversation.findUnique({
    where: { id: conversationId },
    select: { title: true },
  });

  if (!thread) {
    thread = await prisma.messageThread.create({
      data: {
        channelId: channel.id,
        externalThreadId: conversationId,
        subject: chatConversation?.title || undefined,
        status: "OPEN",
      },
    });
  }

  // Check if this message is already mirrored
  const existing = await prisma.message.findFirst({
    where: {
      threadId: thread.id,
      externalId: messageId,
    },
  });

  if (existing) return;

  // Fetch the chat message
  const chatMessage = await prisma.chatMessage.findUnique({
    where: { id: messageId },
  });

  if (!chatMessage) return;

  const content =
    typeof chatMessage.content === "string"
      ? chatMessage.content
      : JSON.stringify(chatMessage.content);

  // Create the mirrored message
  await prisma.message.create({
    data: {
      threadId: thread.id,
      direction: chatMessage.role === "user" ? "INBOUND" : "OUTBOUND",
      status: "DELIVERED",
      senderName: chatMessage.role === "user" ? "User" : "Agent",
      content,
      externalId: messageId,
      sentAt: chatMessage.createdAt,
    },
  });

  // Update thread lastMessageAt
  await prisma.messageThread.update({
    where: { id: thread.id },
    data: { lastMessageAt: chatMessage.createdAt },
  });
}
