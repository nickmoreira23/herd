import { requireOrgRole } from "@/lib/permissions";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { withVerticalTenant, OrgVerticalForbiddenError } from "@/lib/org-hierarchy";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

/**
 * DELETE /api/org/[id]/departments/[deptId] — deleção VERTICAL (Sub-26.3).
 *
 * `id` = org-alvo (descendente do org ativo); `deptId` = department a apagar.
 * Re-entrada via withVerticalTenant — a Extension injeta `where.tenantId = childId`
 * (exato) no delete, então só apaga se o department pertence ao filho. O `id`
 * vem do PATH → SEMPRE via withVerticalTenant, nunca withTenant cru.
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; deptId: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const { id: childId, deptId } = await params;
  const activeOrgId = session.user.activeOrgId;
  if (!activeOrgId) return apiError("No active organization", 400);
  if (childId === activeOrgId) {
    return apiError("Use the normal departments route for your own organization", 403);
  }

  try {
    await withVerticalTenant(activeOrgId, childId, () =>
      prisma.department.delete({ where: { id: deptId } })
    );

    await writeAuditLog({
      tenantId: childId,
      actorProfileId: session.user.id,
      action: "department.deleted",
      resourceType: "department",
      resourceId: deptId,
      metadata: { via_parent_org: activeOrgId },
    });

    return apiSuccess({ deleted: true });
  } catch (e) {
    if (e instanceof OrgVerticalForbiddenError) return apiError(e.message, 403);
    return apiError("Failed to delete department", 500);
  }
}
