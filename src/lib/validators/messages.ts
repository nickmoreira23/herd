import { z } from "zod";

// ─── Thread Schemas ──────────────────────────────────────────────────

export const createMessageThreadSchema = z.object({
  channelId: z.string().uuid(),
  contactId: z.string().uuid().optional(),
  subject: z.string().max(500).optional(),
  content: z.string().min(1).max(50000),
  contentType: z.enum(["text", "html"]).default("text"),
  tags: z.array(z.string().max(100)).max(20).default([]),
});

export const updateMessageThreadSchema = z.object({
  status: z.enum(["OPEN", "CLOSED", "ARCHIVED", "SNOOZED"]).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  priority: z.number().int().min(0).max(2).optional(),
  tags: z.array(z.string().max(100)).max(20).optional(),
  subject: z.string().max(500).optional(),
});

// ─── Message Schemas ─────────────────────────────────────────────────

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(50000),
  contentType: z.enum(["text", "html"]).default("text"),
});

// ─── Channel Schemas ─────────────────────────────────────────────────

export const createMessageChannelSchema = z.object({
  name: z.string().min(1).max(255),
  channelType: z.enum([
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
  ]),
  integrationId: z.string().uuid().optional(),
  configJson: z.string().optional(),
});

export const updateMessageChannelSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
  configJson: z.string().optional(),
});
