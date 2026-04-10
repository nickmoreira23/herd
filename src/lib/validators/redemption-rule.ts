import { z } from "zod";

export const createRedemptionRuleSchema = z.object({
  redemptionType: z.enum(["MEMBERS_STORE", "MEMBERS_RATE"]),
  discountPercent: z.coerce.number().int().min(0).max(100),
  scopeType: z.enum(["CATEGORY", "SUB_CATEGORY", "SKU"]),
  scopeValue: z.string().min(1, "Scope value is required"),
});

export const updateRedemptionRuleSchema = z.object({
  discountPercent: z.coerce.number().int().min(0).max(100),
});

export type CreateRedemptionRuleInput = z.infer<typeof createRedemptionRuleSchema>;
export type UpdateRedemptionRuleInput = z.infer<typeof updateRedemptionRuleSchema>;
