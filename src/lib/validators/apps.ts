import { z } from "zod";

export const KNOWLEDGE_APP_CATEGORIES = ["FITNESS", "HEALTH", "NUTRITION", "OTHER"] as const;
export const KNOWLEDGE_APP_DATA_CATEGORIES = [
  "SLEEP", "ACTIVITY", "RECOVERY", "HEART_RATE", "WORKOUT", "READINESS", "BODY", "APP_NUTRITION", "APP_OTHER",
] as const;

export const createKnowledgeAppSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, "Slug must be lowercase alphanumeric with hyphens"),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  logoUrl: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  category: z.enum(KNOWLEDGE_APP_CATEGORIES).optional(),
  authType: z.enum(["oauth2", "api_key"]).optional(),
  syncFrequencyMin: z.number().int().min(15).max(10080).optional(),
  dataCategories: z.array(z.enum(KNOWLEDGE_APP_DATA_CATEGORIES)).optional(),
});

export const updateKnowledgeAppSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  syncFrequencyMin: z.number().int().min(15).max(10080).optional(),
  dataCategories: z.array(z.enum(KNOWLEDGE_APP_DATA_CATEGORIES)).optional(),
});

export const connectKnowledgeAppSchema = z.object({
  accessToken: z.string().min(1).optional(),
  refreshToken: z.string().optional(),
  expiresAt: z.string().optional(),
  apiKey: z.string().min(1).optional(),
}).refine(data => data.accessToken || data.apiKey, {
  message: "Either accessToken or apiKey is required",
});

export type CreateKnowledgeAppInput = z.infer<typeof createKnowledgeAppSchema>;
export type UpdateKnowledgeAppInput = z.infer<typeof updateKnowledgeAppSchema>;
export type ConnectKnowledgeAppInput = z.infer<typeof connectKnowledgeAppSchema>;
