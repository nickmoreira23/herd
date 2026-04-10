import { z } from "zod";

export const createCommissionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().optional(),
  clawbackWindowDays: z.coerce.number().int().positive().optional(),
  residualPercent: z.coerce.number().nonnegative(),
  notes: z.string().optional(),
});

export const updateCommissionSchema = createCommissionSchema.partial();

export const tierRateSchema = z.object({
  subscriptionTierId: z.string().uuid(),
  flatBonusAmount: z.coerce.number().nonnegative(),
  acceleratorThreshold: z.coerce.number().nonnegative().optional(),
  acceleratorMultiplier: z.coerce.number().nonnegative().optional(),
});

export const batchTierRatesSchema = z.object({
  rates: z.array(tierRateSchema),
});

export type CreateCommissionInput = z.infer<typeof createCommissionSchema>;
export type TierRateInput = z.infer<typeof tierRateSchema>;
