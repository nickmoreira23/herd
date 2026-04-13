import { z } from "zod";

export const knowledgeImageFileTypes = ["PNG", "JPG", "WEBP", "GIF", "SVG", "TIFF"] as const;

export const createKnowledgeImageSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  fileType: z.enum(knowledgeImageFileTypes),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  folderId: z.string().uuid().optional().nullable(),
});

export const updateKnowledgeImageSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  folderId: z.string().uuid().optional().nullable(),
});

export type CreateKnowledgeImageInput = z.infer<typeof createKnowledgeImageSchema>;
export type UpdateKnowledgeImageInput = z.infer<typeof updateKnowledgeImageSchema>;
