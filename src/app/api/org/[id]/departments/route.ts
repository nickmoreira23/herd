import { requireOrgRole } from "@/lib/permissions";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { withVerticalTenant, OrgVerticalForbiddenError } from "@/lib/org-hierarchy";
import { writeAuditLog } from "@/lib/audit/write-audit-log";

/**
 * POST /api/org/[id]/departments  — escrita VERTICAL (Sub-26.3, ADR-001 D4).
 *
 * `id` = org-alvo (um DESCENDENTE do org ativo do ator). O pai cria um
 * department no tenant do filho via re-entrada de contexto. Reusa o slug `[id]`
 * (mesmo segmento do /api/org/[id]/dissolve da 26.1) — Next.js exige nome de
 * slug consistente por nível.
 *
 * Autorização = role no org ativo (requireOrgRole OWNER/ADMIN) E ancestralidade
 * (withVerticalTenant). O `id` vem do PATH (input) → SEMPRE via withVerticalTenant,
 * NUNCA withTenant cru. A RLS não barra a escrita vertical — o portão é a
 * fronteira de segurança.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const { id: childId } = await params;
  const activeOrgId = session.user.activeOrgId;
  if (!activeOrgId) return apiError("No active organization", 400);
  if (childId === activeOrgId) {
    return apiError("Use the normal departments route for your own organization", 403);
  }

  try {
    const body = await request.json();
    const { name, description, parentId, headId, networkType, color, icon, sortOrder } = body;
    if (!name) return apiError("Name is required");

    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const department = await withVerticalTenant(activeOrgId, childId, async () => {
      const existing = await prisma.department.findFirst({ where: { slug } });
      if (existing) return null;
      return prisma.department.create({
        data: {
          tenantId: childId,
          name,
          slug,
          description: description || null,
          parentId: parentId || null,
          headId: headId || null,
          networkType: networkType || "INTERNAL",
          color: color || null,
          icon: icon || null,
          sortOrder: sortOrder ?? 0,
        },
        include: {
          parent: { select: { id: true, name: true } },
          head: { select: { id: true, firstName: true, lastName: true } },
        },
      });
    });

    if (department === null) {
      return apiError("A department with this name already exists");
    }

    await writeAuditLog({
      tenantId: childId,
      actorProfileId: session.user.id,
      action: "department.created",
      resourceType: "department",
      resourceId: department.id,
      metadata: { name: department.name, slug: department.slug, via_parent_org: activeOrgId },
    });

    return apiSuccess(department, 201);
  } catch (e) {
    if (e instanceof OrgVerticalForbiddenError) return apiError(e.message, 403);
    return apiError("Failed to create department", 500, e instanceof Error ? e.message : undefined);
  }
}
