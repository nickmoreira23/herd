import { z } from "zod";

export const knowledgeTableFieldTypes = [
  "singleLineText",
  "multilineText",
  "number",
  "singleSelect",
  "multiSelect",
  "checkbox",
  "date",
  "url",
  "email",
  "currency",
  "percent",
  "attachment",
  "media",
  "linkedRecord",
  "formula",
  "rollup",
  "lookup",
  "count",
  "createdTime",
  "lastModifiedTime",
  "autoNumber",
] as const;

export type KnowledgeTableFieldType = (typeof knowledgeTableFieldTypes)[number];

// --- Table CRUD ---

export const createKnowledgeTableSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
});

export const updateKnowledgeTableSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

// --- Field CRUD ---

export const createKnowledgeTableFieldSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(knowledgeTableFieldTypes),
  description: z.string().max(500).optional(),
  options: z.record(z.unknown()).optional(),
  isPrimary: z.boolean().optional(),
  isRequired: z.boolean().optional(),
});

export const updateKnowledgeTableFieldSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  options: z.record(z.unknown()).optional(),
  isRequired: z.boolean().optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const reorderFieldsSchema = z.object({
  fieldIds: z.array(z.string().uuid()),
});

// --- Record CRUD ---

export const createKnowledgeTableRecordSchema = z.object({
  data: z.record(z.unknown()),
});

export const updateKnowledgeTableRecordSchema = z.object({
  data: z.record(z.unknown()),
});

export const batchCreateRecordsSchema = z.object({
  records: z.array(z.object({ data: z.record(z.unknown()) })).min(1).max(100),
});

// Inferred types
export type CreateKnowledgeTableInput = z.infer<typeof createKnowledgeTableSchema>;
export type UpdateKnowledgeTableInput = z.infer<typeof updateKnowledgeTableSchema>;
export type CreateKnowledgeTableFieldInput = z.infer<typeof createKnowledgeTableFieldSchema>;
export type UpdateKnowledgeTableFieldInput = z.infer<typeof updateKnowledgeTableFieldSchema>;
export type CreateKnowledgeTableRecordInput = z.infer<typeof createKnowledgeTableRecordSchema>;
export type UpdateKnowledgeTableRecordInput = z.infer<typeof updateKnowledgeTableRecordSchema>;
