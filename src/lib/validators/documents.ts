import { z } from "zod";

export const knowledgeDocumentFileTypes = ["PDF", "DOCX", "TXT", "MD", "CSV"] as const;

export const createKnowledgeDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  fileType: z.enum(knowledgeDocumentFileTypes),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  folderId: z.string().uuid().optional().nullable(),
});

export const updateKnowledgeDocumentSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  folderId: z.string().uuid().optional().nullable(),
});

export type CreateKnowledgeDocumentInput = z.infer<typeof createKnowledgeDocumentSchema>;
export type UpdateKnowledgeDocumentInput = z.infer<typeof updateKnowledgeDocumentSchema>;
