import { prisma } from "@/lib/prisma";
import type { MessageChannelAdapter, SyncResult, SendResult, WebhookResult } from "../adapter";

/**
 * Internal adapter — mirrors ChatConversation/ChatMessage into the messages block.
 * Read-only sync: messages originate in the chat system, this adapter imports them.
 */
export class InternalAdapter implements MessageChannelAdapter {
  channelType = "INTERNAL" as const;

  async sync(
    channel: { id: string; configJson: unknown },
    since?: Date
  ): Promise<SyncResult> {
    const result: SyncResult = {
      threadsCreated: 0,
      threadsUpdated: 0,
      messagesCreated: 0,
      errors: [],
    };

    try {
      // Find chat conversations that haven't been mirrored yet
      const conversations = await prisma.chatConversation.findMany({
        where: since ? { updatedAt: { gte: since } } : {},
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
            where: since ? { createdAt: { gte: since } } : {},
          },
        },
        take: 100,
      });

      for (const conv of conversations) {
        // Check if thread already exists
        let thread = await prisma.messageThread.findFirst({
          where: {
            channelId: channel.id,
            externalThreadId: conv.id,
          },
        });

        if (!thread) {
          thread = await prisma.messageThread.create({
            data: {
              channelId: channel.id,
              externalThreadId: conv.id,
              subject: conv.title || undefined,
              status: "OPEN",
              lastMessageAt: conv.updatedAt,
            },
          });
          result.threadsCreated++;
        } else {
          result.threadsUpdated++;
        }

        // Mirror messages that don't already exist
        for (const msg of conv.messages) {
          const exists = await prisma.message.findFirst({
            where: {
              threadId: thread.id,
              externalId: msg.id,
            },
          });

          if (!exists) {
            const content =
              typeof msg.content === "string"
                ? msg.content
                : JSON.stringify(msg.content);

            await prisma.message.create({
              data: {
                threadId: thread.id,
                direction: msg.role === "user" ? "INBOUND" : "OUTBOUND",
                status: "DELIVERED",
                senderName: msg.role === "user" ? "User" : "Agent",
                content,
                externalId: msg.id,
                sentAt: msg.createdAt,
              },
            });
            result.messagesCreated++;
          }
        }

        // Update thread lastMessageAt
        if (conv.messages.length > 0) {
          const lastMsg = conv.messages[conv.messages.length - 1];
          await prisma.messageThread.update({
            where: { id: thread.id },
            data: { lastMessageAt: lastMsg.createdAt },
          });
        }
      }
    } catch (err) {
      result.errors.push(
        err instanceof Error ? err.message : "Unknown sync error"
      );
    }

    return result;
  }

  async send(): Promise<SendResult> {
    // Internal channel is read-only — messages are created through the chat system
    return {
      success: false,
      error: "Internal channel is read-only. Use the chat system to send messages.",
    };
  }

  async handleWebhook(): Promise<WebhookResult> {
    return { action: "ignored" };
  }
}
