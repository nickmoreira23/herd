import { z } from "zod/v4";

// L2b.1 — Listing write validation. Shape only: blockName-known + sourceId-
// exists are runtime checks (blockRegistry + getArtifactMeta) done in the route.
// priceOverrideCents is the Money cents value (wire = positive int → BigInt in
// the handler). Guard-rail #32 is the OWNER/ADMIN route guard for now; a
// relative price cap is a tracked pending decision (no dynamic-cap precedent).

const overrideFields = {
  titleOverride: z.string().min(1).optional(),
  descriptionOverride: z.string().optional(),
  imageUrlOverride: z.string().url().optional().or(z.literal("")),
  priceOverrideCents: z.coerce.number().int().positive().optional(),
  priceOverrideCurrency: z.enum(["BRL", "USD"]).optional(),
  featured: z.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
};

export const createListingSchema = z.object({
  // L2b.2 — a listing belongs to a section; the route validates the section
  // exists in the org. (blockName, sourceId) are the soft block-record ref.
  sectionId: z.string().min(1),
  blockName: z.string().min(1),
  sourceId: z.string().min(1),
  ...overrideFields,
});

// PATCH: the (blockName, sourceId) reference is immutable — only own-data is editable.
export const updateListingSchema = z.object(overrideFields);
