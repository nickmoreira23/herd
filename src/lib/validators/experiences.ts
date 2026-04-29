import { z } from "zod";

export const EXPERIENCE_FORMATS = [
  "IN_PERSON",
  "ONLINE",
  "HYBRID",
  "SELF_PACED",
] as const;

export const EXPERIENCE_STATUSES = [
  "DRAFT",
  "SCHEDULED",
  "OPEN",
  "SOLD_OUT",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
] as const;

export const createExperienceSchema = z.object({
  name: z.string().min(1),
  headline: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  format: z.enum(EXPERIENCE_FORMATS).optional(),
  status: z.enum(EXPERIENCE_STATUSES).optional(),
  startDate: z.coerce.date().nullable().optional(),
  endDate: z.coerce.date().nullable().optional(),
  durationMin: z.coerce.number().int().nonnegative().nullable().optional(),
  locationName: z.string().nullable().optional(),
  locationUrl: z.string().nullable().optional(),
  capacity: z.coerce.number().int().nonnegative().nullable().optional(),
  price: z.coerce.number().nonnegative().nullable().optional(),
  currency: z.string().optional(),
  coverImageUrl: z.string().nullable().optional(),
  hostId: z.string().uuid().nullable().optional(),
  contentJson: z.unknown().optional(),
  contentText: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateExperienceSchema = createExperienceSchema.partial();

export type CreateExperienceInput = z.infer<typeof createExperienceSchema>;
export type UpdateExperienceInput = z.infer<typeof updateExperienceSchema>;
