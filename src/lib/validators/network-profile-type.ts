import { z } from "zod";

// ─── Wizard Field Schema ──────────────────────────────────────────────────────

export const wizardFieldSchema = z.object({
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
});

export type WizardField = z.infer<typeof wizardFieldSchema>;

// ─── Profile Type Schemas ─────────────────────────────────────────────────────

export const createProfileTypeSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-z0-9_-]+$/,
      "Slug must be lowercase letters, numbers, hyphens or underscores"
    ),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  networkType: z.enum(["INTERNAL", "EXTERNAL"]),
  icon: z.string().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color")
    .optional(),
  wizardFields: z.array(wizardFieldSchema).default([]),
  defaultRoleIds: z.array(z.string()).default([]),
  defaultCompPlanId: z.string().optional(),
  defaultRankId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
});

export const updateProfileTypeSchema = createProfileTypeSchema
  .partial()
  .omit({ slug: true });

export type CreateProfileTypeInput = z.infer<typeof createProfileTypeSchema>;
export type UpdateProfileTypeInput = z.infer<typeof updateProfileTypeSchema>;
