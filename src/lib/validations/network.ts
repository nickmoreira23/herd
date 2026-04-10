import { z } from "zod"

// These will be replaced by @prisma/client imports after `prisma generate`
const NetworkType = { INTERNAL: "INTERNAL" as const, EXTERNAL: "EXTERNAL" as const }
const ProfileStatus = {
  PENDING: "PENDING" as const,
  ACTIVE: "ACTIVE" as const,
  SUSPENDED: "SUSPENDED" as const,
  TERMINATED: "TERMINATED" as const,
}

// ─── Wizard Field Schema ──────────────────────────────────────────────────────

export const WizardFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum([
    "text",
    "email",
    "phone",
    "select",
    "multi_select",
    "number",
    "date",
    "url",
    "textarea",
    "toggle",
  ]),
  required: z.boolean().default(false),
  placeholder: z.string().optional(),
  options: z.array(z.string()).optional(),
  step: z.number().int().min(1).max(7),
  target: z.enum(["profile", "attribute"]),
  helpText: z.string().optional(),
  validation: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      pattern: z.string().optional(),
      message: z.string().optional(),
    })
    .optional(),
})

export type WizardField = z.infer<typeof WizardFieldSchema>

// ─── Profile Type Schemas ─────────────────────────────────────────────────────

export const CreateProfileTypeSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "Slug must be lowercase letters, numbers, hyphens or underscores"),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  networkType: z.nativeEnum(NetworkType),
  icon: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").optional(),
  wizardFields: z.array(WizardFieldSchema).default([]),
  defaultRoleIds: z.array(z.string()).default([]),
  defaultCompPlanId: z.string().optional(),
  defaultRankId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export const UpdateProfileTypeSchema = CreateProfileTypeSchema.partial().omit({ slug: true })

export type CreateProfileTypeInput = z.infer<typeof CreateProfileTypeSchema>
export type UpdateProfileTypeInput = z.infer<typeof UpdateProfileTypeSchema>

// ─── Role Schemas ─────────────────────────────────────────────────────────────

export const CreateRoleSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "Slug must be lowercase letters, numbers, hyphens or underscores"),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  networkType: z.nativeEnum(NetworkType).optional(),
  parentRoleId: z.string().optional(),
})

export const UpdateRoleSchema = CreateRoleSchema.partial().omit({ slug: true })

export type CreateRoleInput = z.infer<typeof CreateRoleSchema>
export type UpdateRoleInput = z.infer<typeof UpdateRoleSchema>

// ─── Profile / Wizard Schemas ─────────────────────────────────────────────────

export const CreateProfileSchema = z.object({
  // Step 1
  networkType: z.nativeEnum(NetworkType),
  profileTypeId: z.string().min(1),
  // Step 2
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  // Step 3
  parentId: z.string().optional(),
  teamIds: z.array(z.string()).default([]),
  // Step 4
  roleIds: z.array(z.string()).default([]),
  // Step 5 (external only)
  compensationPlanId: z.string().optional(),
  // Step 6 — dynamic attributes
  attributes: z.record(z.string(), z.unknown()).default({}),
})

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>

// ─── Dynamic attribute schema builder ────────────────────────────────────────

export function buildAttributeSchema(fields: WizardField[]) {
  const shape: Record<string, z.ZodTypeAny> = {}
  for (const f of fields) {
    let s: z.ZodTypeAny
    switch (f.type) {
      case "number":
        s = z.coerce.number()
        break
      case "multi_select":
        s = z.array(z.string())
        break
      case "toggle":
        s = z.boolean()
        break
      default:
        s = z.string()
    }
    if (!f.required) {
      s = s.optional()
    }
    shape[f.key] = s
  }
  return z.object(shape)
}

// ─── API Response type ────────────────────────────────────────────────────────

export type ApiResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: string; issues?: unknown[] } }

export function ok<T>(data: T): ApiResponse<T> {
  return { data, error: null }
}

export function err(message: string, code: string, issues?: unknown[]): ApiResponse<never> {
  return { data: null, error: { message, code, issues } }
}
