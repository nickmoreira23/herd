import { z } from "zod";

export const DEAL_STAGES = [
  "LEAD",
  "QUALIFIED",
  "PROPOSAL",
  "NEGOTIATION",
  "WON",
  "LOST",
] as const;

export const createDealSchema = z.object({
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  stage: z.enum(DEAL_STAGES).optional(),
  amount: z.coerce.number().nonnegative().nullable().optional(),
  currency: z.string().optional(),
  probability: z.coerce.number().int().min(0).max(100).nullable().optional(),
  expectedCloseDate: z.coerce.date().nullable().optional(),
  closedAt: z.coerce.date().nullable().optional(),
  lostReason: z.string().nullable().optional(),
  contactId: z.string().uuid().nullable().optional(),
  companyId: z.string().uuid().nullable().optional(),
  campaignId: z.string().uuid().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  source: z.string().nullable().optional(),
  contentJson: z.unknown().optional(),
  contentText: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateDealSchema = createDealSchema.partial();

export type CreateDealInput = z.infer<typeof createDealSchema>;
export type UpdateDealInput = z.infer<typeof updateDealSchema>;
