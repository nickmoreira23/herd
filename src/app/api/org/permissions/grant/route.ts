import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

// Editable surface (V3.3, cravado): the 3 ORG roles × the 5 routed resources,
// ORG scope only. Ghost resources (no route) and department-scoped roles are
// NOT editable — blocked server-side (defense-in-depth) even though the UI
// hides their toggles.
const ORG_ROLES = ["OWNER", "ADMIN", "MEMBER"] as const;
const ROUTED_RESOURCES = [
  "org",
  "org_hierarchy",
  "members",
  "departments",
  "locations",
] as const;
const ACTIONS = ["read", "create", "update", "delete", "invite"] as const;

const bodySchema = z.object({
  role: z.enum(ORG_ROLES),
  resource: z.enum(ROUTED_RESOURCES),
  action: z.enum(ACTIONS),
  scopeType: z.enum(["ORG", "DEPARTMENT"]).default("ORG"),
  granted: z.boolean(),
});

/**
 * PATCH /api/org/permissions/grant — toggle one grant in the global matrix.
 * super_admin-only (the matrix is global = platform-edited). `granted:true`
 * upserts the row; `false` deletes it. Idempotent (no-op → 200, no write/audit).
 * Editing persists to the DB but does NOT change runtime authorization until the
 * flip (CAN_ENFORCEMENT stays off) — requireOrgRole remains the live gate.
 */
export async function PATCH(request: Request) {
  const session = await requireSuperAdmin();
  if (session instanceof Response) return session;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid or non-editable grant", 422, parsed.error.flatten());
  }
  const { role, resource, action, scopeType, granted } = parsed.data;

  // Only ORG-scope grants of the editable set are toggleable.
  if (scopeType !== "ORG") {
    return apiError("Only ORG-scope grants are editable", 422);
  }

  // OWNER guardrail: never strip an OWNER's `members` grants — that is the
  // role-management capability; removing it would orphan org administration.
  // (super_admin always bypasses can(), so this protects non-super OWNERs.)
  if (role === "OWNER" && resource === "members" && !granted) {
    return apiError("An owner's members permissions cannot be removed", 422);
  }

  const where = {
    role_resource_action_scopeType: { role, resource, action, scopeType },
  };
  const existing = await prisma.rolePermission.findUnique({ where });
  const currentlyGranted = existing !== null;

  // No-op — already in the requested state: no write, no audit.
  if (currentlyGranted === granted) {
    return apiSuccess({ role, resource, action, scopeType, granted });
  }

  if (granted) {
    await prisma.rolePermission.create({
      data: { role, resource, action, scopeType },
    });
  } else {
    await prisma.rolePermission.delete({ where });
  }

  // Audit under the super_admin's active org (discovery decision c). Best-effort.
  const orgId = (session.user as { activeOrgId?: string | null }).activeOrgId ?? null;
  const actorProfileId = (session.user as { id?: string }).id ?? null;
  if (orgId) {
    await writeAuditLog({
      tenantId: orgId,
      actorProfileId,
      action: "role_permission.updated",
      resourceType: "role_permission",
      resourceId: `${role}:${resource}:${action}`,
      metadata: { granted, scopeType, actorProfileId },
    });
  }

  return apiSuccess({ role, resource, action, scopeType, granted });
}
