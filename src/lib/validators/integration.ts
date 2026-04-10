import { z } from "zod";
import {
  INTEGRATION_CATEGORIES,
  INTEGRATION_STATUSES,
  SYNC_DIRECTIONS,
} from "@/types";

export const createIntegrationSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  logoUrl: z.string().optional(),
  category: z.enum(INTEGRATION_CATEGORIES),
  status: z.enum(INTEGRATION_STATUSES).optional(),
  websiteUrl: z.string().url().optional(),
  docsUrl: z.string().url().optional(),
  configJson: z.string().optional(),
});

export const updateIntegrationSchema = createIntegrationSchema.partial();

export const connectIntegrationSchema = z.object({
  apiToken: z.string().min(1, "API token is required"),
  apiKey: z.string().optional(),
  domain: z.string().optional(),
  email: z.string().email().optional(),
  region: z.string().optional(),
  serviceAccountUser: z.string().optional(),
  serviceAccountSecret: z.string().optional(),
  projectId: z.string().optional(),
});

export const tierMappingSchema = z.object({
  externalPlanId: z.string().min(1, "External plan ID is required"),
  externalPlanName: z.string().optional(),
  subscriptionTierId: z.string().uuid("Invalid tier ID"),
  syncDirection: z.enum(SYNC_DIRECTIONS).optional(),
});

export const deleteTierMappingSchema = z.object({
  mappingId: z.string().uuid("Invalid mapping ID"),
});

export type CreateIntegrationInput = z.infer<typeof createIntegrationSchema>;
export type UpdateIntegrationInput = z.infer<typeof updateIntegrationSchema>;
export type ConnectIntegrationInput = z.infer<typeof connectIntegrationSchema>;
export type TierMappingInput = z.infer<typeof tierMappingSchema>;
