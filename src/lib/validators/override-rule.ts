import { z } from "zod";

export const overrideRuleSchema = z.object({
  roleType: z.enum(["REGIONAL_LEADER", "TEAM_LEAD", "REP"]),
  overrideType: z.enum(["FLAT", "PERCENT_OF_BONUS", "PERCENT_OF_REVENUE"]),
  overrideValue: z.coerce.number().nonnegative(),
  notes: z.string().optional(),
});

export const batchOverrideRulesSchema = z.object({
  rules: z.array(overrideRuleSchema),
});

export type OverrideRuleInput = z.infer<typeof overrideRuleSchema>;
