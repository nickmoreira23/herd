import { z } from "zod/v4";

const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and dashes only");

// SE5a — internal visibility roles. Org-level MemberRole values only (the
// department-scoped ones are not meaningful for org-level section gating).
// Empty/omitted = unrestricted (any logged member of the org sees the scope).
export const SECTION_SCOPE_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;

// L2b.2 — ITEM removed: a "specific item" is now a curated Listing (below), not
// a scope. Scopes are AUTOMATIC rules only (ALL/CATEGORY/SUB_CATEGORY). The DB
// enum keeps ITEM (deprecated), but the write surface no longer accepts it.
export const sectionScopeSchema = z.object({
  blockName: z.string().min(1),
  scopeType: z.enum(["ALL", "CATEGORY", "SUB_CATEGORY"]),
  scopeValue: z.string().nullable().optional(),
  sortOrder: z.coerce.number().int().optional(),
  allowedRoles: z.array(z.enum(SECTION_SCOPE_ROLES)).optional(),
});

// L2b.2 — a curated Listing within a section (replaces the ITEM-scope). The
// (blockName, sourceId) ref is required; override fields are optional (the L3 UI
// fills them — the write-path accepts them now).
export const sectionListingSchema = z.object({
  blockName: z.string().min(1),
  sourceId: z.string().min(1),
  titleOverride: z.string().min(1).optional(),
  descriptionOverride: z.string().optional(),
  imageUrlOverride: z.string().url().optional().or(z.literal("")),
  priceOverrideCents: z.coerce.number().int().positive().optional(),
  priceOverrideCurrency: z.enum(["BRL", "USD"]).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
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
  listings: z.array(sectionListingSchema).default([]),
});

// PATCH semantics: an omitted field must mean "leave unchanged". `.partial()`
// alone is NOT enough — in Zod 4 it keeps each field's `.default(...)`, so an
// omitted `status`/`blockNames`/`components`/`scopes`/`creationPath` would
// resolve to its create-time default (e.g. status→DRAFT, components→[]) and the
// handler would silently reset/wipe it. Override every defaulted field to be
// optional-without-default so omitting it yields `undefined`.
export const updateSectionSchema = createSectionSchema.partial().extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
  creationPath: z.enum(["MANUAL", "COPILOT", "AUTONOMOUS"]).optional(),
  blockNames: z.array(z.string()).optional(),
  components: z.array(z.unknown()).optional(),
  scopes: z.array(sectionScopeSchema).optional(),
  listings: z.array(sectionListingSchema).optional(),
});
