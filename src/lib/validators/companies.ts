import { z } from "zod/v4";

export const COMPANY_SIZES = ["SMALL", "MEDIUM", "LARGE", "ENTERPRISE"] as const;

export const createCompanySchema = z.object({
  name: z.string().min(1),
  legalName: z.string().nullable().optional(),
  taxId: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  domain: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  size: z.enum(COMPANY_SIZES).nullable().optional(),
  email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  linkedinUrl: z.string().nullable().optional(),
  twitterHandle: z.string().nullable().optional(),
  street: z.string().nullable().optional(),
  street2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  contentJson: z.unknown().optional(),
  contentText: z.string().optional(),
  ownerId: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
