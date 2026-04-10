import { z } from "zod";

export const KNOWLEDGE_RSS_FREQUENCIES = ["HOURLY", "DAILY", "WEEKLY"] as const;

export const createKnowledgeRSSFeedSchema = z.object({
  feedUrl: z.string().url("Must be a valid URL"),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  frequency: z.enum(KNOWLEDGE_RSS_FREQUENCIES).default("DAILY"),
  instructions: z.string().max(2000).optional(),
  includeKeywords: z.array(z.string().max(100)).max(20).default([]),
  excludeKeywords: z.array(z.string().max(100)).max(20).default([]),
  maxEntriesPerSync: z.number().int().min(1).max(100).default(20),
});

export const updateKnowledgeRSSFeedSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  frequency: z.enum(KNOWLEDGE_RSS_FREQUENCIES).optional(),
  instructions: z.string().max(2000).optional().nullable(),
  includeKeywords: z.array(z.string().max(100)).max(20).optional(),
  excludeKeywords: z.array(z.string().max(100)).max(20).optional(),
  maxEntriesPerSync: z.number().int().min(1).max(100).optional(),
});

export type CreateKnowledgeRSSFeedInput = z.infer<typeof createKnowledgeRSSFeedSchema>;
export type UpdateKnowledgeRSSFeedInput = z.infer<typeof updateKnowledgeRSSFeedSchema>;
