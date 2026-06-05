import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { requireOrgRole } from "@/lib/permissions";
import { upsertGrant, removeGrant, type GrantSlot } from "@/lib/permissions/grant-repository";
import { isOwnerFloor } from "@/lib/permissions/admin-floor";
import { withTenant } from "@/lib/tenancy/context";
import { writeAuditLog } from "@/lib/audit/write-audit-log";
import type { ActionType, ResourceType } from "@/lib/permissions/types";

// Editable surface for per-org overrides: the routed resources × actions, ORG scope.
const RESOURCES = ["org", "org_hierarchy", "members", "invitations", "roles", "departments", "locations"] as const;
const ACTIONS = ["read", "create", "update", "delete", "invite", "restore"] as const;

const bodySchema = z
  .object({
    role: z.enum(["OWNER", "ADMIN", "MEMBER"]).optional(),
    roleId: z.string().uuid().optional(),
    resource: z.enum(RESOURCES),
    action: z.enum(ACTIONS),
    // grant | deny set a per-org override; inherit removes it (falls back to global).
    effect: z.enum(["grant", "deny", "inherit"]),
  })
  .refine((b) => (b.role ? !b.roleId : !!b.roleId), {
    message: "Exactly one of role | roleId is required",
  });

/**
 * PATCH /api/org/roles/matrix — set/clear a PER-ORG override (grant|deny) on the
 * role×permission matrix for the caller's active org.
 *
 * OWNER-only, guarded SOLELY by `requireOrgRole(["OWNER"])` — the membership-role
 * gate, which a per-org deny cannot touch. Deliberately NOT in the ENFORCEMENT_MAP
 * / not behind can(): this is OWNER governance (like the platform requireSuperAdmin
 * routes), so it never collides with the can() oracle and can never self-lock.
 *
 * Floor (defense-in-depth, mirrors the loader): denying an OWNER × OWNER_FLOOR
 * (resource, action) is rejected 422 — the loader already ignores such a deny.
 * All writes go through the grant choke point; every change is audited.
 */
export async function PATCH(request: Request) {
  const sessionOrResponse = await requireOrgRole(["OWNER"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;
  const orgId = session.user.activeOrgId;
  if (!orgId) return apiError("No active organization", 400);

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Invalid override", 400, parsed.error.flatten());
  const { role, roleId, resource, action, effect } = parsed.data;

  // Floor: never deny an OWNER's essential permissions (anti-self-lockout).
  if (role === "OWNER" && effect === "deny" && isOwnerFloor(resource as ResourceType, action as ActionType)) {
    return apiError("An owner's essential permissions cannot be denied", 422);
  }

  const actorProfileId = (session.user as { id?: string }).id ?? null;

  return withTenant(orgId, async () => {
    // Custom-role overrides must target a role of THIS org (tenant-scoped read).
    if (roleId) {
      const r = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true } });
      if (!r) return apiError("Role not found", 404);
    }

    const slot: GrantSlot = {
      tenantId: orgId, role: role ?? null, roleId: roleId ?? null,
      resource, action, scopeType: "ORG",
    };

    if (effect === "inherit") {
      await removeGrant(slot);
    } else {
      await upsertGrant(slot, effect);
    }

    await writeAuditLog({
      tenantId: orgId, actorProfileId,
      action: effect === "inherit" ? "role_permission.override.removed" : "role_permission.override.set",
      resourceType: "roles",
      resourceId: `${role ?? roleId}:${resource}:${action}`,
      metadata: { role: role ?? null, roleId: roleId ?? null, resource, action, effect },
    });

    return apiSuccess({ role: role ?? null, roleId: roleId ?? null, resource, action, effect });
  });
}
