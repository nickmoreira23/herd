import type { BlockManifest } from "../manifest";

export const messagesBlock: BlockManifest = {
  name: "messages",
  displayName: "Messages",
  description:
    "Centralized messaging hub — aggregates conversations from WhatsApp, email, SMS, Instagram, Slack, Intercom, and internal agent chats into unified threads. Supports inbound/outbound messaging, contact resolution, thread assignment, and priority management. Message history is searchable for AI retrieval.",
  domain: "operations",
  types: ["message_thread", "message"],
  capabilities: ["read", "create", "update", "delete", "sync", "send"],
  models: ["MessageChannel", "MessageThread", "Message"],
  dependencies: [],
  paths: {
    components: "src/components/messages/",
    pages: "src/app/admin/blocks/messages/",
    api: "src/app/api/messages/",
    lib: "src/lib/messages/",
    validators: "src/lib/validators/messages.ts",
    provider: "src/lib/chat/providers/message.provider.ts",
  },
  actions: [
    {
      name: "list_message_threads",
      description:
        "List message threads with optional filters by channel, status, contact, assignee, or tag",
      method: "GET",
      endpoint: "/api/messages/threads",
      parametersSchema: {
        type: "object",
        properties: {
          channelId: { type: "string", description: "Filter by channel UUID" },
          channelType: {
            type: "string",
            enum: [
              "INTERNAL",
              "EMAIL",
              "SMS",
              "WHATSAPP",
              "INSTAGRAM",
              "FACEBOOK",
              "SLACK",
              "INTERCOM",
              "LINKEDIN",
              "X_TWITTER",
              "CUSTOM",
            ],
          },
          status: {
            type: "string",
            enum: ["OPEN", "CLOSED", "ARCHIVED", "SNOOZED"],
          },
          contactId: {
            type: "string",
            description: "Filter by contact profile UUID",
          },
          assigneeId: {
            type: "string",
            description: "Filter by assignee profile UUID",
          },
          tag: { type: "string", description: "Filter by tag" },
        },
      },
      responseDescription:
        "Array of message threads with latest message preview and contact info",
    },
    {
      name: "get_message_thread",
      description: "Get a single thread by ID with all messages",
      method: "GET",
      endpoint: "/api/messages/threads/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Thread UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription:
        "Thread with full message history, contact, and channel info",
    },
    {
      name: "create_message_thread",
      description: "Start a new outbound conversation thread",
      method: "POST",
      endpoint: "/api/messages/threads",
      parametersSchema: {
        type: "object",
        properties: {
          channelId: {
            type: "string",
            description: "Channel UUID to send via",
          },
          contactId: {
            type: "string",
            description: "Contact profile UUID",
          },
          subject: { type: "string" },
          content: {
            type: "string",
            description: "Initial message content",
          },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["channelId", "content"],
      },
      requiredFields: ["channelId", "content"],
      responseDescription: "Created thread with initial message",
    },
    {
      name: "update_message_thread",
      description: "Update thread status, assignment, priority, or tags",
      method: "PATCH",
      endpoint: "/api/messages/threads/{id}",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Thread UUID" },
          status: {
            type: "string",
            enum: ["OPEN", "CLOSED", "ARCHIVED", "SNOOZED"],
          },
          assigneeId: {
            type: "string",
            description: "Assignee profile UUID",
          },
          priority: { type: "number", enum: [0, 1, 2] },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Updated thread object",
    },
    {
      name: "send_message",
      description: "Send an outbound message in an existing thread",
      method: "POST",
      endpoint: "/api/messages/threads/{threadId}/send",
      parametersSchema: {
        type: "object",
        properties: {
          threadId: { type: "string", description: "Thread UUID" },
          content: { type: "string", description: "Message content" },
          contentType: {
            type: "string",
            enum: ["text", "html"],
            description: "Default: text",
          },
        },
        required: ["threadId", "content"],
      },
      requiredFields: ["threadId", "content"],
      responseDescription: "Sent message object with delivery status",
    },
    {
      name: "search_messages",
      description: "Search across all message content with keyword",
      method: "GET",
      endpoint: "/api/messages/search",
      parametersSchema: {
        type: "object",
        properties: {
          keyword: { type: "string" },
          channelType: { type: "string" },
          take: {
            type: "number",
            description: "Max results, default 20",
          },
        },
        required: ["keyword"],
      },
      requiredFields: ["keyword"],
      responseDescription:
        "Array of matching messages with thread context",
    },
    {
      name: "list_message_channels",
      description: "List all configured message channels with thread counts",
      method: "GET",
      endpoint: "/api/messages/channels",
      parametersSchema: { type: "object", properties: {} },
      responseDescription: "Array of message channels with stats",
    },
    {
      name: "sync_channel",
      description:
        "Manually trigger sync for a channel to pull latest messages from external source",
      method: "POST",
      endpoint: "/api/messages/channels/{id}/sync",
      parametersSchema: {
        type: "object",
        properties: {
          id: { type: "string", description: "Channel UUID" },
        },
        required: ["id"],
      },
      requiredFields: ["id"],
      responseDescription: "Sync results with new threads/messages count",
    },
  ],
};
