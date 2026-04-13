import { z } from "zod";

export const createKnowledgeLinkSchema = z.object({
  url: z.string().url("Must be a valid URL"),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  scrapeMode: z.enum(["SINGLE", "FULL_SITE"]).default("SINGLE"),
  maxPages: z.number().int().min(1).max(1000).default(100),
});

export const updateKnowledgeLinkSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

export type CreateKnowledgeLinkInput = z.infer<typeof createKnowledgeLinkSchema>;
export type UpdateKnowledgeLinkInput = z.infer<typeof updateKnowledgeLinkSchema>;
