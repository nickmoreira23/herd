import { z } from "zod";

export const createDocumentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.enum(["CONTRACT", "TERMS", "PRESENTATION", "POLICY", "OTHER"]),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
});

export const updateDocumentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.enum(["CONTRACT", "TERMS", "PRESENTATION", "POLICY", "OTHER"]).optional(),
  isActive: z.boolean().optional(),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
