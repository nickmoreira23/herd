import { z } from "zod";

export const CLAUDE_MODELS = [
  { id: "claude-opus-4-20250514", label: "Opus", description: "Most capable" },
  { id: "claude-sonnet-4-20250514", label: "Sonnet", description: "Balanced" },
  { id: "claude-haiku-3-5-20241022", label: "Haiku", description: "Fastest" },
] as const;

const modelIds = CLAUDE_MODELS.map((m) => m.id);

export const createConversationSchema = z.object({
  model: z
    .string()
    .refine((v) => modelIds.includes(v as (typeof modelIds)[number]), { message: "Invalid model" })
    .optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(50000, "Message too long"),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  model: z
    .string()
    .refine((v) => modelIds.includes(v as (typeof modelIds)[number]), { message: "Invalid model" })
    .optional(),
});
