import { z } from "zod"

// ─── Field Types ─────────────────────────────────────────────────────────────

export const FORM_FIELD_TYPES = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "EMAIL",
  "PHONE",
  "DATE",
  "TIME",
  "SELECT",
  "MULTI_SELECT",
  "CHECKBOX",
  "RADIO",
  "FILE_UPLOAD",
  "RATING",
  "YES_NO",
  "SIGNATURE",
] as const

export type FormFieldType = (typeof FORM_FIELD_TYPES)[number]

// ─── Conditional Logic Schema ────────────────────────────────────────────────

export const conditionalLogicSchema = z.object({
  fieldId: z.string().uuid(),
  operator: z.enum(["equals", "not_equals", "contains", "not_empty", "is_empty"]),
  value: z.unknown().optional(),
})

// ─── Field Validation Schema ─────────────────────────────────────────────────

export const fieldValidationSchema = z.object({
  minLength: z.number().int().min(0).optional(),
  maxLength: z.number().int().min(1).optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  pattern: z.string().optional(),
  maxFileSize: z.number().int().min(1).optional(),
  allowedFileTypes: z.array(z.string()).optional(),
  minRating: z.number().int().min(0).optional(),
  maxRating: z.number().int().min(1).optional(),
})

// ─── Form CRUD ───────────────────────────────────────────────────────────────

export const createKnowledgeFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(2000).optional(),
  thankYouMessage: z.string().max(2000).optional(),
  accessMode: z.enum(["PUBLIC", "PRIVATE"]).default("PUBLIC"),
  accessPassword: z.string().min(4).optional(),
  maxResponses: z.number().int().min(1).optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  templateKey: z.string().optional(),
})

export const updateKnowledgeFormSchema = createKnowledgeFormSchema.partial()

// ─── Section CRUD ────────────────────────────────────────────────────────────

export const createFormSectionSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const updateFormSectionSchema = createFormSectionSchema.partial()

// ─── Field CRUD ──────────────────────────────────────────────────────────────

export const createFormFieldSchema = z.object({
  sectionId: z.string().uuid(),
  label: z.string().min(1, "Label is required").max(500),
  type: z.enum(FORM_FIELD_TYPES),
  placeholder: z.string().max(500).optional(),
  helpText: z.string().max(1000).optional(),
  isRequired: z.boolean().default(false),
  options: z.object({ choices: z.array(z.string().min(1)) }).optional(),
  validation: fieldValidationSchema.optional(),
  conditionalLogic: conditionalLogicSchema.optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const updateFormFieldSchema = createFormFieldSchema.partial().omit({ sectionId: true }).extend({
  sectionId: z.string().uuid().optional(),
})

export const reorderFormFieldsSchema = z.object({
  fieldIds: z.array(z.string().uuid()).min(1),
})

export const reorderFormSectionsSchema = z.object({
  sectionIds: z.array(z.string().uuid()).min(1),
})

// ─── Response Submission (public) ────────────────────────────────────────────

export const submitFormResponseSchema = z.object({
  answers: z.record(z.string(), z.unknown()),
  submitterName: z.string().max(200).optional(),
  submitterEmail: z.string().email().optional(),
})

// ─── Access Verification ─────────────────────────────────────────────────────

export const verifyFormAccessSchema = z.object({
  password: z.string().min(1),
})

// ─── Import ──────────────────────────────────────────────────────────────────

export const importFormFormats = ["google_forms", "typeform", "surveymonkey"] as const

export const importFormMetaSchema = z.object({
  format: z.enum(importFormFormats),
  name: z.string().min(1).optional(),
})
