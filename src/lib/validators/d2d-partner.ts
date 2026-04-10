import { z } from "zod";

export const createD2DPartnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
});

export const updateD2DPartnerSchema = createD2DPartnerSchema.partial();

export type CreateD2DPartnerInput = z.infer<typeof createD2DPartnerSchema>;
