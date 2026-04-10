import { z } from "zod";
import {
  KICKBACK_TYPES,
  PARTNER_BENEFIT_TYPES,
  PARTNER_COMMISSION_TYPES,
  PARTNER_STATUSES,
  PARTNER_TIER_ACCESS,
} from "@/types";

export const createPartnerSchema = z.object({
  // Existing fields
  name: z.string().min(1, "Name is required"),
  key: z.string().min(1, "Key is required").regex(/^[a-z][a-z0-9_]*$/, "Key must be lowercase snake_case"),
  logoUrl: z.string().url().optional(),
  discountDescription: z.string().optional(),
  websiteUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
  kickbackType: z.enum(KICKBACK_TYPES),
  kickbackValue: z.coerce.number().nonnegative().optional(),
  category: z.string().min(1, "Category is required"),

  // New fields
  heroImageUrl: z.string().url().optional(),
  tagline: z.string().optional(),
  description: z.string().optional(),
  audienceBenefit: z.string().optional(),
  benefitType: z.enum(PARTNER_BENEFIT_TYPES).optional(),
  affiliateSignupUrl: z.string().url().optional(),
  affiliateLinkPlaceholder: z.string().optional(),
  affiliateNetwork: z.string().optional(),
  commissionRate: z.string().optional(),
  commissionType: z.enum(PARTNER_COMMISSION_TYPES).optional(),
  cookieDuration: z.string().optional(),
  status: z.enum(PARTNER_STATUSES).optional(),
  tierAccess: z.enum(PARTNER_TIER_ACCESS).optional(),
  notes: z.string().optional(),
});

export const updatePartnerSchema = createPartnerSchema.partial();

export const tierAssignmentSchema = z.object({
  partnerBrandId: z.string().uuid(),
  subscriptionTierId: z.string().uuid(),
  discountPercent: z.coerce.number().min(0).max(100),
  isActive: z.boolean().optional(),
});

export const batchTierAssignmentsSchema = z.object({
  assignments: z.array(tierAssignmentSchema),
});

export const bulkImportPartnersSchema = z.object({
  partners: z.array(createPartnerSchema),
});

export const statusTransitionSchema = z.object({
  status: z.enum(PARTNER_STATUSES),
});

export type CreatePartnerInput = z.infer<typeof createPartnerSchema>;
export type UpdatePartnerInput = z.infer<typeof updatePartnerSchema>;
export type TierAssignmentInput = z.infer<typeof tierAssignmentSchema>;
export type BulkImportPartnersInput = z.infer<typeof bulkImportPartnersSchema>;
export type StatusTransitionInput = z.infer<typeof statusTransitionSchema>;
