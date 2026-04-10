import { z } from "zod";

export const createRoleSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(
      /^[a-z0-9_-]+$/,
      "Slug must be lowercase letters, numbers, hyphens or underscores"
    ),
  displayName: z.string().min(1).max(100),
  description: z.string().optional(),
  networkType: z.enum(["INTERNAL", "EXTERNAL"]).optional(),
  parentRoleId: z.string().optional(),
});

export const updateRoleSchema = createRoleSchema.partial().omit({ slug: true });

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
