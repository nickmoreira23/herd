import { z } from "zod";

export const knowledgeVideoFileTypes = ["MP4", "MOV", "WEBM", "AVI"] as const;

export const createKnowledgeVideoSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  fileType: z.enum(knowledgeVideoFileTypes),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  duration: z.number().positive().optional().nullable(),
  thumbnailUrl: z.string().optional().nullable(),
  folderId: z.string().uuid().optional().nullable(),
});

export const updateKnowledgeVideoSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  folderId: z.string().uuid().optional().nullable(),
});

export type CreateKnowledgeVideoInput = z.infer<typeof createKnowledgeVideoSchema>;
export type UpdateKnowledgeVideoInput = z.infer<typeof updateKnowledgeVideoSchema>;
