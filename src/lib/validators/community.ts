import { z } from "zod";

export const createCommunityBenefitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  key: z.string().min(1, "Key is required").regex(/^[a-z][a-z0-9_]*$/, "Key must be lowercase snake_case"),
  description: z.string().optional(),
  longDescription: z.string().optional(),
  icon: z.string().optional(),
  status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional(),
  platform: z.string().optional(),
  accessUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCommunityBenefitSchema = createCommunityBenefitSchema.partial();
