import { z } from "zod";

export const CAMPAIGN_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "COMPLETED",
  "ARCHIVED",
] as const;

export const CAMPAIGN_CHANNELS = [
  "EMAIL",
  "SOCIAL",
  "ADS",
  "EVENT",
  "CONTENT",
  "WEBINAR",
  "REFERRAL",
  "DIRECT_MAIL",
  "SMS",
  "PARTNER",
  "OTHER",
] as const;

export const CAMPAIGN_OBJECTIVES = [
  "AWARENESS",
  "ACQUISITION",
  "ACTIVATION",
  "RETENTION",
  "REVENUE",
  "REFERRAL",
  "OTHER",
] as const;

export const createCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  status: z.enum(CAMPAIGN_STATUSES).optional(),
  channels: z.array(z.enum(CAMPAIGN_CHANNELS)).optional(),
  objective: z.enum(CAMPAIGN_OBJECTIVES).nullable().optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  budget: z.coerce.number().nonnegative().nullable().optional(),
  spent: z.coerce.number().nonnegative().nullable().optional(),
  currency: z.string().optional(),
  audience: z.string().nullable().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  metrics: z.unknown().optional(),
  contentJson: z.unknown().optional(),
  contentText: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCampaignSchema = createCampaignSchema.partial();

export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;
