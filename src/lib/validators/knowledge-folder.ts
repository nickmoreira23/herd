import { z } from "zod";

export const knowledgeFolderTypes = ["DOCUMENT", "IMAGE", "VIDEO", "AUDIO"] as const;

export const createKnowledgeFolderSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  folderType: z.enum(knowledgeFolderTypes).optional().default("DOCUMENT"),
  parentId: z.string().uuid().optional().nullable(),
});

export const updateKnowledgeFolderSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().nullable(),
  parentId: z.string().uuid().optional().nullable(),
});

export type CreateKnowledgeFolderInput = z.infer<typeof createKnowledgeFolderSchema>;
export type UpdateKnowledgeFolderInput = z.infer<typeof updateKnowledgeFolderSchema>;
