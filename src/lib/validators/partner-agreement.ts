import { z } from "zod";

export const createAgreementSchema = z.object({
  d2dPartnerId: z.string().uuid(),
  commissionPlanId: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  status: z.enum(["DRAFT", "ACTIVE", "SUSPENDED", "TERMINATED"]).optional(),
  effectiveFrom: z.coerce.date().optional().nullable(),
  effectiveTo: z.coerce.date().optional().nullable(),
  payoutCadence: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]).optional(),
  holdPeriodDays: z.coerce.number().int().nonnegative().optional(),
  notes: z.string().optional(),
});

export const updateAgreementSchema = createAgreementSchema.partial();

export const clawbackRuleSchema = z.object({
  windowDays: z.coerce.number().int().positive(),
  clawbackPercent: z.coerce.number().min(0).max(100),
  notes: z.string().optional(),
});

export const batchClawbackRulesSchema = z.object({
  rules: z.array(clawbackRuleSchema),
});

export type CreateAgreementInput = z.infer<typeof createAgreementSchema>;
export type ClawbackRuleInput = z.infer<typeof clawbackRuleSchema>;
