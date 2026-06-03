import { requireOrgRole, enforceRoute } from "@/lib/permissions";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/org/[id]/restore
 *
 * Sub-etapa 26.1 — reverte a dissolução soft (ADR-001 D6): ARCHIVED → ACTIVE.
 * **Só muda status — NÃO toca parentOrgId de ninguém.** Como o dissolve nunca
 * mexeu na árvore, o restore é trivial e seguro. Gate: OWNER apenas.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  const enforced = await enforceRoute(
    sessionOrResponse,
    { resource: "org", action: "restore" },
    { current: sessionOrResponse, organizationId: sessionOrResponse.user.activeOrgId ?? "", routeId: "POST /api/org/[id]/restore" }
  );
  if (enforced instanceof Response) return enforced;

  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!org) return apiError("Organization not found", 404);

  if (org.status !== "ARCHIVED") {
    return apiError(
      `Organization cannot be restored from status ${org.status} (must be ARCHIVED)`,
      409
    );
  }

  const restored = await prisma.organization.update({
    where: { id },
    data: { status: "ACTIVE" },
    select: { id: true, slug: true, name: true, status: true },
  });

  return apiSuccess({ organization: restored });
}
