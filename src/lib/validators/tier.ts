import { z } from "zod";

export const createTierSchema = z.object({
  // Identity
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  tagline: z.string().max(80).optional().nullable(),
  colorAccent: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  iconUrl: z.string().optional().or(z.literal("")).nullable(),
  description: z.string().optional().nullable(),
  highlightFeatures: z.array(z.string()).optional(),
  sortOrder: z.coerce.number().int().optional(),

  // Status & visibility
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  visibility: z.enum(["PUBLIC", "REP_ONLY", "HIDDEN"]).optional(),
  isActive: z.boolean().optional(), // DEPRECATED — kept for backward compat
  isFeatured: z.boolean().optional(),

  // Pricing
  monthlyPrice: z.coerce.number().positive(),
  quarterlyPrice: z.coerce.number().positive(),
  annualPrice: z.coerce.number().positive(),
  quarterlyDisplay: z.coerce.number().nonnegative().optional().nullable(),
  annualDisplay: z.coerce.number().nonnegative().optional().nullable(),
  setupFee: z.coerce.number().nonnegative().optional(),
  trialDays: z.coerce.number().int().nonnegative().optional(),
  billingAnchor: z.enum(["SIGNUP_DATE", "FIRST_OF_MONTH"]).optional(),

  // Credits
  monthlyCredits: z.coerce.number().nonnegative(),
  creditExpirationDays: z.coerce.number().int().positive().optional(),
  creditIssuing: z.enum(["ON_PAYMENT", "FIXED_DATE"]).optional(),
  rolloverMonths: z.coerce.number().int().nonnegative().optional(),
  rolloverCap: z.coerce.number().nonnegative().optional().nullable(),
  creditExpiry: z.enum(["FORFEIT", "CONVERT", "DONATE"]).optional(),
  annualBonusCredits: z.coerce.number().nonnegative().optional(),
  referralCreditAmt: z.coerce.number().nonnegative().optional(),

  // Partner & apparel (existing)
  partnerDiscountPercent: z.coerce.number().nonnegative(),
  includedAIFeatures: z.array(z.string()).optional(),
  apparelCadence: z.enum(["NONE", "QUARTERLY", "MONTHLY"]),
  apparelBudget: z.coerce.number().nonnegative().optional().nullable(),

  // Access controls
  maxMembers: z.coerce.number().int().positive().optional().nullable(),
  geoRestriction: z.array(z.string()).optional(),
  minimumAge: z.coerce.number().int().positive().optional().nullable(),
  inviteOnly: z.boolean().optional(),
  repChannelOnly: z.boolean().optional(),

  // Tier movement
  upgradeToTierIds: z.array(z.string()).optional(),
  downgradeToTierIds: z.array(z.string()).optional(),
  upgradeTiming: z.enum(["IMMEDIATE", "NEXT_CYCLE"]).optional(),
  downgradeTiming: z.enum(["IMMEDIATE", "NEXT_CYCLE"]).optional(),
  creditOnUpgrade: z.enum(["CARRY_OVER", "RESET", "FORFEIT_EXCESS"]).optional(),
  creditOnDowngrade: z.enum(["CARRY_OVER", "RESET", "FORFEIT_EXCESS"]).optional(),

  // Cancellation & retention
  minimumCommitMonths: z.coerce.number().int().nonnegative().optional(),
  pauseAllowed: z.boolean().optional(),
  pauseMaxMonths: z.coerce.number().int().nonnegative().optional(),
  pauseCreditBehavior: z.enum(["FROZEN", "FORFEIT"]).optional(),
  cancelCreditBehavior: z.enum(["FORFEIT", "GRACE_PERIOD", "KEEP_FOREVER"]).optional(),
  cancelCreditGraceDays: z.coerce.number().int().nonnegative().optional(),
  winbackDays: z.coerce.number().int().nonnegative().optional(),
  winbackBonusCredits: z.coerce.number().nonnegative().optional(),
  exitSurveyRequired: z.boolean().optional(),

  // Value pillar JSON configs
  agentConfig: z.any().optional().nullable(),
  communityConfig: z.any().optional().nullable(),
  perksConfig: z.any().optional().nullable(),
});

export const updateTierSchema = createTierSchema.partial();

export const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().uuid(),
      sortOrder: z.coerce.number().int(),
    })
  ),
});

export type CreateTierInput = z.infer<typeof createTierSchema>;
export type UpdateTierInput = z.infer<typeof updateTierSchema>;
