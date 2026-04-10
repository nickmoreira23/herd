import { z } from "zod";

export const createOrgNodeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  roleType: z.enum(["REGIONAL_LEADER", "TEAM_LEAD", "REP"]),
  parentId: z.string().uuid().nullable().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
  hireDate: z.coerce.date().optional(),
});

export const updateOrgNodeSchema = createOrgNodeSchema.partial();

export type CreateOrgNodeInput = z.infer<typeof createOrgNodeSchema>;
