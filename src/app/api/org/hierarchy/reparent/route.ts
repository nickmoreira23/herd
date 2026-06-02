import { requireOrgRole, enforceRoute } from "@/lib/permissions";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { assertNoCycle, OrgCycleError } from "@/lib/org-hierarchy";

/**
 * PATCH /api/org/hierarchy/reparent
 *
 * Sub-etapa 26.1 — move uma org para outro pai (ou promove a raiz).
 * Body: { orgId: string, newParentId: string | null }.
 *
 * Gate: OWNER/ADMIN. `assertNoCycle` roda ANTES de gravar — rejeita self-ref,
 * ciclo (A→B→A) e mover-para-debaixo-de-descendente com 400 claro.
 * Não toca RLS (organizations não é tenant-scoped).
 */
export async function PATCH(request: Request) {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  const enforced = await enforceRoute(
    sessionOrResponse,
    { resource: "org_hierarchy", action: "update" },
    { current: sessionOrResponse, organizationId: sessionOrResponse.user.activeOrgId ?? "", routeId: "PATCH /api/org/hierarchy/reparent" }
  );
  if (enforced instanceof Response) return enforced;

  const body = (await request.json().catch(() => null)) as {
    orgId?: unknown;
    newParentId?: unknown;
  } | null;

  if (!body || typeof body.orgId !== "string") {
    return apiError("orgId is required", 400);
  }
  const orgId = body.orgId;
  const newParentId =
    body.newParentId === undefined ? null : body.newParentId;
  if (newParentId !== null && typeof newParentId !== "string") {
    return apiError("newParentId must be a string or null", 400);
  }

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true },
  });
  if (!org) return apiError("Organization not found", 404);

  if (newParentId) {
    const parent = await prisma.organization.findUnique({
      where: { id: newParentId },
      select: { id: true },
    });
    if (!parent) return apiError("Parent organization not found", 400);
  }

  // Anti-cycle BEFORE writing.
  try {
    await assertNoCycle(orgId, newParentId);
  } catch (e) {
    if (e instanceof OrgCycleError) return apiError(e.message, 400);
    throw e;
  }

  const updated = await prisma.organization.update({
    where: { id: orgId },
    data: { parentOrgId: newParentId },
    select: { id: true, slug: true, name: true, parentOrgId: true },
  });

  return apiSuccess(updated);
}
