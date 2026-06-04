import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { requireOrgRole, enforceRoute, assertMemberBelongsToOrg } from "@/lib/permissions";
import { withTenant } from "@/lib/tenancy/context";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

const bodySchema = z.object({ roleId: z.string().uuid() });

/**
 * POST /api/org/members/[memberId]/roles — assign a custom role to a member (ADDITIVE).
 *
 * SOMA model: this ADDS a custom-role MembershipRole row; it never touches the member's
 * system ORG role, so the ≥1-active-OWNER invariant is structurally safe (no system row
 * is removed here). Idempotent: re-assigning the same role is a 200 no-op.
 */
export async function POST(request: Request, { params }: { params: Promise<{ memberId: string }> }) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;
  const orgId = session.user.activeOrgId;
  if (!orgId) return apiError("No active organization", 400);

  const enforced = await enforceRoute(session, { resource: "members", action: "update" }, {
    current: session, organizationId: orgId, routeId: "POST /api/org/members/[memberId]/roles",
  });
  if (enforced instanceof Response) return enforced;

  const { memberId } = await params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Invalid roleId", 400, parsed.error.flatten());
  const { roleId } = parsed.data;

  const member = await assertMemberBelongsToOrg(memberId, orgId);
  if (!member) return apiError("Member not found", 404);

  const actorProfileId = (session.user as { id?: string }).id ?? null;

  return withTenant(orgId, async () => {
    // Tenant-scoped read: the role must belong to this org (else 404, no cross-org leak).
    const role = await prisma.role.findUnique({ where: { id: roleId }, select: { id: true } });
    if (!role) return apiError("Role not found", 404);

    const existing = await prisma.membershipRole.findFirst({
      where: { memberId, roleId, scopeType: "ORG" },
      select: { id: true },
    });
    if (existing) return apiSuccess({ memberId, roleId, assigned: true });

    await prisma.membershipRole.create({
      data: { memberId, roleId, scopeType: "ORG" },
    });
    await writeAuditLog({
      tenantId: orgId, actorProfileId, action: "membership_role.assigned",
      resourceType: "members", resourceId: memberId,
      metadata: { roleId, kind: "custom", targetProfileId: member.networkProfileId },
    });
    return apiSuccess({ memberId, roleId, assigned: true }, 201);
  });
}
