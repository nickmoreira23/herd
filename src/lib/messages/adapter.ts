import type { MessageChannelType } from "@prisma/client";

export interface SyncResult {
  threadsCreated: number;
  threadsUpdated: number;
  messagesCreated: number;
  errors: string[];
}

export interface SendResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface WebhookResult {
  threadId?: string;
  messageId?: string;
  action: "created" | "updated" | "ignored";
}

export interface MessageChannelAdapter {
  channelType: MessageChannelType;

  /** Pull messages from the external source into the messages block. */
  sync(
    channel: { id: string; configJson: unknown },
    since?: Date
  ): Promise<SyncResult>;

  /** Send an outbound message through the external channel. */
  send(
    channel: { id: string; configJson: unknown },
    threadExternalId: string | null,
    content: string,
    contentType: string
  ): Promise<SendResult>;

  /** Process an inbound webhook payload from the external source. */
  handleWebhook(
    channel: { id: string; configJson: unknown; webhookSecret: string | null },
    payload: unknown,
    headers: Record<string, string>
  ): Promise<WebhookResult>;
}
