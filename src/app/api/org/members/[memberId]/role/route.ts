import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import {
  requireOrgRole,
  enforceRoute,
  getActor,
  assertMemberBelongsToOrg,
  countActiveOwners,
  getOrgRole,
} from "@/lib/permissions";
import { withTenant } from "@/lib/tenancy/context";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

// V1: ORG-scoped role is singular per member (OWNER xor ADMIN xor MEMBER).
// Department-scoped roles are out of scope for this endpoint.
const bodySchema = z.object({
  role: z.enum(["OWNER", "ADMIN", "MEMBER"]),
});

/**
 * PATCH /api/org/members/[memberId]/role — set/replace a member's ORG role.
 *
 * Guard: requireOrgRole(["OWNER","ADMIN"]). Fine checks in-handler:
 * - Any change involving OWNER (promote-to or alter-an OWNER) is OWNER-only;
 *   super_admin bypasses the permission check (support mode).
 * - The ≥1-active-OWNER invariant blocks everyone (incl. super_admin) → 409.
 * - Cross-org member id → 404 (manual isolation; models aren't tenant-scoped).
 * - No-op (same role) → 200 without writing or auditing.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ memberId: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const orgId = session.user.activeOrgId;
  if (!orgId) return apiError("No active organization", 400);

  const enforced = await enforceRoute(
    session,
    { resource: "members", action: "update" },
    { current: session, organizationId: orgId, routeId: "PATCH /api/org/members/[memberId]/role" }
  );
  if (enforced instanceof Response) return enforced;

  const actorProfileId = (session.user as { id?: string }).id ?? null;
  const isSuperAdmin =
    (session.user as { isSuperAdmin?: boolean }).isSuperAdmin === true;

  const { memberId } = await params;

  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Invalid role", 400, parsed.error.flatten());
  }
  const newRole = parsed.data.role;

  const member = await assertMemberBelongsToOrg(memberId, orgId);
  if (!member) return apiError("Member not found", 404);

  const currentOrgRoleRow = getOrgRole(member);
  const currentRole = currentOrgRoleRow?.role ?? null;

  // No-op — same role: no write, no audit.
  if (currentRole === newRole) {
    return apiSuccess({ memberId, role: newRole });
  }

  // Fine permission: changes involving OWNER are OWNER-only (super_admin bypass).
  const actor = await getActor(session);
  const actorOrgRole = actor?.memberships
    .find((m) => m.organizationId === orgId)
    ?.roles.find((r) => r.scopeType === "ORG")?.role;

  const involvesOwner = currentRole === "OWNER" || newRole === "OWNER";
  if (involvesOwner && !isSuperAdmin && actorOrgRole !== "OWNER") {
    return apiError("Only an owner can change owner roles", 403);
  }

  // Invariant: demoting an OWNER must never drop the org below one active OWNER.
  // Applies to everyone, including super_admin. (Admin-initiated, low
  // concurrency — the count-then-update gap is an accepted V1 race.)
  if (currentRole === "OWNER" && newRole !== "OWNER") {
    const owners = await countActiveOwners(orgId);
    if (owners <= 1) {
      return apiError("Organization must keep at least one owner", 409);
    }
  }

  return withTenant(orgId, async () => {
    if (currentOrgRoleRow) {
      await prisma.membershipRole.update({
        where: { id: currentOrgRoleRow.id },
        data: { role: newRole },
      });
    } else {
      await prisma.membershipRole.create({
        data: { memberId, role: newRole, scopeType: "ORG" },
      });
    }

    await writeAuditLog({
      tenantId: orgId,
      actorProfileId,
      action: "membership_role.assigned",
      resourceType: "members",
      resourceId: memberId,
      metadata: {
        from: currentRole,
        to: newRole,
        targetProfileId: member.networkProfileId,
        actorKind: isSuperAdmin ? "super_admin" : actorOrgRole ?? null,
      },
    });

    return apiSuccess({ memberId, role: newRole });
  });
}
