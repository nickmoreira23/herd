import { z } from "zod";

const categoryEnum = z
  .string()
  .transform((v) => v.toUpperCase())
  .pipe(z.enum(["SUPPLEMENT", "APPAREL", "ACCESSORY"]));

export const createProductSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  category: categoryEnum,
  subCategory: z.string().optional(),
  redemptionType: z.enum(["Members Store", "Members Rate"]).optional(),
  retailPrice: z.coerce.number().positive("Retail price must be positive"),
  memberPrice: z.coerce.number().positive().optional(),
  costOfGoods: z.coerce.number().nonnegative("COGS must be non-negative"),
  // Cost components for advanced metrics
  shippingCost: z.coerce.number().nonnegative().optional(),
  handlingCost: z.coerce.number().nonnegative().optional(),
  paymentProcessingPct: z.coerce.number().nonnegative().max(100).optional(),
  paymentProcessingFlat: z.coerce.number().nonnegative().optional(),
  mapPrice: z.coerce.number().positive().optional().nullable(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  weightOz: z.coerce.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  // Extended product fields
  description: z.string().optional(),
  brand: z.string().optional(),
  sourceUrl: z.string().url().optional().or(z.literal("")),
  flavor: z.string().optional(),
  variants: z.any().optional(),
  servingSize: z.string().optional(),
  servingsPerContainer: z.coerce.number().int().positive().optional(),
  ingredients: z.string().optional(),
  supplementFacts: z.any().optional(),
  warnings: z.string().optional(),
  rescrapeInterval: z.enum(["DAILY", "WEEKLY", "MONTHLY"]).nullable().optional(),
});

export const updateProductSchema = createProductSchema.partial();

export const bulkImportRowSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: categoryEnum,
  subCategory: z.string().optional(),
  redemptionType: z.enum(["Members Store", "Members Rate"]).optional(),
  retailPrice: z.coerce.number().positive(),
  memberPrice: z.coerce.number().positive().optional(),
  costOfGoods: z.coerce.number().nonnegative(),
  shippingCost: z.coerce.number().nonnegative().optional(),
  handlingCost: z.coerce.number().nonnegative().optional(),
  paymentProcessingPct: z.coerce.number().nonnegative().max(100).optional(),
  paymentProcessingFlat: z.coerce.number().nonnegative().optional(),
  mapPrice: z.coerce.number().positive().optional().nullable(),
});

export const bulkActionSchema = z.object({
  ids: z.array(z.string().uuid()),
  action: z.enum(["activate", "deactivate", "delete", "adjustPrice"]),
  adjustmentType: z.enum(["percent", "fixed"]).optional(),
  adjustmentValue: z.coerce.number().optional(),
  adjustmentField: z.enum(["retailPrice"]).optional(),
});

export const scrapeProductUrlSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type BulkImportRow = z.infer<typeof bulkImportRowSchema>;
export type BulkActionInput = z.infer<typeof bulkActionSchema>;
export type ScrapeProductUrlInput = z.infer<typeof scrapeProductUrlSchema>;
