import { z } from "zod/v4";

export const SERVICE_PRICING_TYPES = [
  "FIXED",
  "HOURLY",
  "DAILY",
  "MONTHLY",
  "CUSTOM",
] as const;

export const SERVICE_STATUSES = ["DRAFT", "ACTIVE", "ARCHIVED"] as const;

export const createServiceSchema = z.object({
  name: z.string().min(1),
  key: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  contentJson: z.unknown().optional(),
  contentText: z.string().optional(),
  category: z.string().nullable().optional(),
  duration: z.string().nullable().optional(),
  price: z.number().nullable().optional(),
  pricingType: z.enum(SERVICE_PRICING_TYPES).optional(),
  imageUrl: z.string().nullable().optional(),
  icon: z.string().optional(),
  status: z.enum(SERVICE_STATUSES).optional(),
  sortOrder: z.number().int().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
