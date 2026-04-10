import { z } from "zod";
import type { WizardField } from "./network-profile-type";

export const createNetworkProfileSchema = z.object({
  // Step 1
  networkType: z.enum(["INTERNAL", "EXTERNAL"]),
  profileTypeId: z.string().min(1),
  // Step 2
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  // Step 3
  parentId: z.string().optional(),
  teamIds: z.array(z.string()).default([]),
  // Step 4
  roleIds: z.array(z.string()).default([]),
  // Step 5 (external only)
  compensationPlanId: z.string().optional(),
  // Step 6 — dynamic attributes
  attributes: z.record(z.string(), z.unknown()).default({}),
});

export type CreateNetworkProfileInput = z.infer<
  typeof createNetworkProfileSchema
>;

// ─── Dynamic attribute schema builder ────────────────────────────────────────

export function buildAttributeSchema(fields: WizardField[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    let s: z.ZodTypeAny;
    switch (f.type) {
      case "number":
        s = z.coerce.number();
        break;
      case "multi_select":
        s = z.array(z.string());
        break;
      case "toggle":
        s = z.boolean();
        break;
      default:
        s = z.string();
    }
    if (!f.required) {
      s = s.optional();
    }
    shape[f.key] = s;
  }
  return z.object(shape);
}
