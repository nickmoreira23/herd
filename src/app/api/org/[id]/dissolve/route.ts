import { requireOrgRole } from "@/lib/permissions";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";
import { getDescendants } from "@/lib/org-hierarchy";

/**
 * POST /api/org/[id]/dissolve
 *
 * Sub-etapa 26.1 — passo 1 da dissolução (ADR-001 D6): soft-delete reversível.
 * Transição ACTIVE → ARCHIVED. **NÃO toca parentOrgId de ninguém** — a árvore
 * estrutural permanece intacta; só o hard-delete (DELETE /api/org/[id]) a
 * destrói. Idempotência: rejeita se já ARCHIVED/DELETED.
 *
 * Retorna o blast radius estrutural+membership (orgs do subtree + members +
 * invitations, escopados por FK, sem RLS) para a UI futura exibir antes do
 * type-to-confirm. Contagens tenant-scoped (departments/locations/billing/
 * audit) são deferidas para a 26.2 (leitura vertical) — ver tenantScopedNote.
 *
 * Gate: OWNER apenas (dissolução é exceção ao gate OWNER/ADMIN das demais
 * operações de árvore).
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireOrgRole(["OWNER"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    select: { id: true, slug: true, name: true, status: true },
  });
  if (!org) return apiError("Organization not found", 404);

  if (org.status !== "ACTIVE") {
    return apiError(
      `Organization cannot be dissolved from status ${org.status} (must be ACTIVE)`,
      409
    );
  }

  const descendants = await getDescendants(id);
  const subtreeIds = [id, ...descendants.map((d) => d.id)];

  const [members, invitations] = await Promise.all([
    prisma.organizationMember.count({
      where: { organizationId: { in: subtreeIds } },
    }),
    prisma.organizationInvitation.count({
      where: { organizationId: { in: subtreeIds } },
    }),
  ]);

  const archived = await prisma.organization.update({
    where: { id },
    data: { status: "ARCHIVED" },
    select: { id: true, slug: true, name: true, status: true },
  });

  return apiSuccess({
    organization: archived,
    blastRadius: {
      org: { id: org.id, slug: org.slug, name: org.name },
      descendants,
      counts: {
        organizations: subtreeIds.length,
        members,
        invitations,
      },
      tenantScopedNote:
        "Departments, locations, billing and audit records across the subtree " +
        "will also be deleted on hard-delete (cascade). Detailed counts arrive " +
        "with Sub-26.2 (vertical read).",
    },
  });
}
