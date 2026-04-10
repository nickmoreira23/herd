import { z } from "zod";

const FITNESS_GOALS = [
  "WEIGHT_LOSS",
  "MUSCLE_GAIN",
  "PERFORMANCE",
  "ENDURANCE",
  "GENERAL_WELLNESS",
  "RECOVERY",
  "STRENGTH",
  "BODY_RECOMP",
  "CUSTOM",
] as const;

const PACKAGE_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const createPackageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  fitnessGoal: z.enum(FITNESS_GOALS),
  customGoalDescription: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  imageUrl: z.string().min(1).optional().or(z.literal("")).nullable(),
  status: z.enum(PACKAGE_STATUSES).optional(),
  sortOrder: z.coerce.number().int().nonnegative().optional(),
});

export const updatePackageSchema = createPackageSchema.partial();

export const upsertVariantProductsSchema = z.object({
  products: z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.coerce.number().int().positive().default(1),
      creditCost: z.coerce.number().nonnegative().optional(),
    })
  ),
  notes: z.string().optional().nullable(),
});

export const addVariantProductSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.coerce.number().int().positive().default(1),
  creditCost: z.coerce.number().nonnegative().optional(),
});

export const aiSuggestSchema = z.object({
  subscriptionTierId: z.string().uuid().optional(),
  fitnessGoal: z.enum(FITNESS_GOALS),
  customGoalDescription: z.string().optional(),
  mode: z.enum(["analysis", "products"]).default("products"),
  preferences: z
    .object({
      supplements: z.number().min(0).max(100),
      apparel: z.number().min(0).max(100),
      accessories: z.number().min(0).max(100),
    })
    .optional(),
  recommendations: z
    .array(
      z.object({
        type: z.string(),
        category: z.string(),
        priority: z.string(),
        budgetPercent: z.number(),
        reasoning: z.string(),
      })
    )
    .optional(),
  feedback: z.string().optional(),
  previousRecommendations: z
    .array(
      z.object({
        type: z.string(),
        category: z.string(),
        priority: z.string(),
        budgetPercent: z.number(),
        reasoning: z.string(),
      })
    )
    .optional(),
});

export type CreatePackageInput = z.infer<typeof createPackageSchema>;
export type UpdatePackageInput = z.infer<typeof updatePackageSchema>;
export type UpsertVariantProductsInput = z.infer<typeof upsertVariantProductsSchema>;
export type AddVariantProductInput = z.infer<typeof addVariantProductSchema>;
export type AiSuggestInput = z.infer<typeof aiSuggestSchema>;
