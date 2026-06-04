import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { requireOrgRole, enforceRoute, assertMemberBelongsToOrg } from "@/lib/permissions";
import { withTenant } from "@/lib/tenancy/context";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

/**
 * DELETE /api/org/members/[memberId]/roles/[roleId] — unassign a custom role from a
 * member. Only removes the custom-role row (role_id set); the member's system ORG role
 * is untouched, so this cannot drop the org below one active owner.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ memberId: string; roleId: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;
  const orgId = session.user.activeOrgId;
  if (!orgId) return apiError("No active organization", 400);

  const enforced = await enforceRoute(session, { resource: "members", action: "update" }, {
    current: session, organizationId: orgId,
    routeId: "DELETE /api/org/members/[memberId]/roles/[roleId]",
  });
  if (enforced instanceof Response) return enforced;

  const { memberId, roleId } = await params;
  const member = await assertMemberBelongsToOrg(memberId, orgId);
  if (!member) return apiError("Member not found", 404);

  const actorProfileId = (session.user as { id?: string }).id ?? null;

  return withTenant(orgId, async () => {
    const res = await prisma.membershipRole.deleteMany({
      where: { memberId, roleId, scopeType: "ORG" },
    });
    if (res.count === 0) return apiError("Assignment not found", 404);

    await writeAuditLog({
      tenantId: orgId, actorProfileId, action: "membership_role.unassigned",
      resourceType: "members", resourceId: memberId,
      metadata: { roleId, kind: "custom", targetProfileId: member.networkProfileId },
    });
    return apiSuccess({ memberId, roleId, assigned: false });
  });
}
