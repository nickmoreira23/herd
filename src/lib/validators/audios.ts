import { z } from "zod";

export const knowledgeAudioFileTypes = ["MP3", "WAV", "OGG", "FLAC", "AAC", "M4A"] as const;

export const createKnowledgeAudioSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  fileType: z.enum(knowledgeAudioFileTypes),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  fileSize: z.number().int().positive(),
  mimeType: z.string().min(1),
  duration: z.number().positive().optional().nullable(),
  folderId: z.string().uuid().optional().nullable(),
});

export const updateKnowledgeAudioSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
  folderId: z.string().uuid().optional().nullable(),
});

export type CreateKnowledgeAudioInput = z.infer<typeof createKnowledgeAudioSchema>;
export type UpdateKnowledgeAudioInput = z.infer<typeof updateKnowledgeAudioSchema>;
