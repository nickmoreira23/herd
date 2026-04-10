import { z } from "zod";

export const performanceTierSchema = z.object({
  label: z.string().min(1, "Label is required"),
  minSales: z.coerce.number().int().nonnegative(),
  maxSales: z.coerce.number().int().positive().optional().nullable(),
  bonusMultiplier: z.coerce.number().positive(),
  bonusFlat: z.coerce.number().nonnegative().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

export const batchPerformanceTiersSchema = z.object({
  tiers: z.array(performanceTierSchema),
});

export type PerformanceTierInput = z.infer<typeof performanceTierSchema>;
