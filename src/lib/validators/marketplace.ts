import { z } from "zod";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes only");

export const sectionScopeSchema = z.object({
  blockName: z.string().min(1),
  scopeType: z.enum(["ALL", "CATEGORY", "SUB_CATEGORY", "ITEM"]),
  scopeValue: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
  allowedProfileTypeIds: z.array(z.string().uuid()).optional(),
  allowedRoleIds: z.array(z.string().uuid()).optional(),
});

export const createSectionSchema = z.object({
  slug: slugSchema,
  name: z.string().min(1, "Name is required"),
  description: z.string().nullish(),
  iconKey: z.string().nullish(),
  imageUrl: z.string().nullish(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).default("DRAFT"),
  creationPath: z.enum(["MANUAL", "COPILOT", "AUTONOMOUS"]).default("MANUAL"),
  blockNames: z.array(z.string()).default([]),
  components: z.array(z.unknown()).default([]),
  layout: z.record(z.string(), z.unknown()).nullish(),
  scopes: z.array(sectionScopeSchema).default([]),
});

export const updateSectionSchema = createSectionSchema.partial();
