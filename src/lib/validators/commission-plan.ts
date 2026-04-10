import { z } from "zod";

export const createCommissionPlanSchema = z.object({
  name: z.string().min(1, "Name is required"),
  isActive: z.boolean().optional(),
  effectiveFrom: z.coerce.date().optional().nullable(),
  effectiveTo: z.coerce.date().optional().nullable(),
  residualPercent: z.coerce.number().nonnegative(),
  notes: z.string().optional(),
});

export const updateCommissionPlanSchema = createCommissionPlanSchema.partial();

export const planRateSchema = z.object({
  subscriptionTierId: z.string().uuid(),
  roleType: z.enum(["REGIONAL_LEADER", "TEAM_LEAD", "REP"]),
  upfrontBonus: z.coerce.number().nonnegative(),
  residualPercent: z.coerce.number().nonnegative(),
});

export const batchPlanRatesSchema = z.object({
  rates: z.array(planRateSchema),
});

export type CreateCommissionPlanInput = z.infer<typeof createCommissionPlanSchema>;
export type PlanRateInput = z.infer<typeof planRateSchema>;
