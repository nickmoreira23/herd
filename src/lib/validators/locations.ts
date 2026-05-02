import { z } from "zod/v4";

export const LOCATION_TYPES = [
  "headquarters",
  "office",
  "store",
  "warehouse",
  "other",
] as const;

export const createLocationSchema = z.object({
  name: z.string().min(1),
  type: z.enum(LOCATION_TYPES).optional(),
  street: z.string().nullable().optional(),
  street2: z.string().nullable().optional(),
  city: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  zip: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  isHeadquarters: z.boolean().optional(),
  notes: z.string().nullable().optional(),
});

export const updateLocationSchema = createLocationSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export type CreateLocationInput = z.infer<typeof createLocationSchema>;
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>;
