import type {
  MessageChannelType,
  MessageThreadStatus,
  MessageDirection,
  MessageStatus,
} from "@prisma/client";

export interface ChannelRow {
  id: string;
  name: string;
  channelType: MessageChannelType;
  integrationId: string | null;
  isActive: boolean;
  configJson: string | null;
  createdAt: string;
  updatedAt: string;
  integration: {
    id: string;
    name: string;
    slug: string;
    logoUrl: string | null;
  } | null;
  _count: { threads: number };
}

export interface MessageRow {
  id: string;
  threadId: string;
  direction: MessageDirection;
  status: MessageStatus;
  senderName: string | null;
  senderEmail: string | null;
  senderExternalId: string | null;
  content: string;
  contentType: string;
  attachments: unknown;
  externalId: string | null;
  metadata: unknown;
  sentAt: string;
  createdAt: string;
}

export interface ThreadRow {
  id: string;
  channelId: string;
  contactId: string | null;
  externalThreadId: string | null;
  subject: string | null;
  status: MessageThreadStatus;
  priority: number;
  tags: string[];
  assigneeId: string | null;
  lastMessageAt: string | null;
  closedAt: string | null;
  metadata: unknown;
  createdAt: string;
  updatedAt: string;
  channel: {
    id: string;
    name: string;
    channelType: MessageChannelType;
  };
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  assignee: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  } | null;
  messages: {
    id: string;
    content: string;
    direction: MessageDirection;
    senderName: string | null;
    sentAt: string;
  }[];
  _count: { messages: number };
}
