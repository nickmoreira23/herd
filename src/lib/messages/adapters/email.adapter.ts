import type { MessageChannelAdapter, SyncResult, SendResult, WebhookResult } from "../adapter";

/**
 * Email adapter — wraps email sending/receiving.
 * Placeholder implementation; will be connected to Gmail/SMTP services.
 */
export class EmailAdapter implements MessageChannelAdapter {
  channelType = "EMAIL" as const;

  async sync(
    _channel: { id: string; configJson: unknown },
    _since?: Date
  ): Promise<SyncResult> {
    // TODO: Connect to Gmail service (src/lib/services/gmail.ts)
    // - Fetch emails since `since` date
    // - Map Gmail threads → MessageThreads
    // - Map Gmail messages → Messages
    // - Resolve contacts via email address
    return {
      threadsCreated: 0,
      threadsUpdated: 0,
      messagesCreated: 0,
      errors: ["Email sync not yet implemented"],
    };
  }

  async send(
    _channel: { id: string; configJson: unknown },
    _threadExternalId: string | null,
    _content: string,
    _contentType: string
  ): Promise<SendResult> {
    // TODO: Connect to Gmail/SMTP service for sending
    // - Use configJson for SMTP settings or Gmail OAuth credentials
    // - Send email and return external message ID
    return {
      success: false,
      error: "Email sending not yet implemented",
    };
  }

  async handleWebhook(
    _channel: { id: string; configJson: unknown; webhookSecret: string | null },
    _payload: unknown,
    _headers: Record<string, string>
  ): Promise<WebhookResult> {
    // TODO: Process inbound email webhook (e.g., Gmail push notification or SendGrid)
    // - Validate webhook signature
    // - Parse email payload
    // - Create/update thread and message
    return { action: "ignored" };
  }
}
