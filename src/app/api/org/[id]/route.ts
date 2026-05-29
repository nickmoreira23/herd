import { requireOrgRole } from "@/lib/permissions";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/org/[id]
 *
 * Sub-etapa 26.1 — passo 2 da dissolução (ADR-001 D6): hard-delete físico.
 * Dispara o CASCADE recursivo: apaga o subtree inteiro + todos os dados
 * tenant-scoped de cada org do subtree (todas as FKs filhas são onDelete:
 * Cascade, e parent_org_id virou Cascade na migration 26.1).
 *
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ PORTA ÚNICA DE DELEÇÃO DE Organization.                              │
 * │ Este é o ÚNICO lugar do código que chama prisma.organization.delete. │
 * │ NUNCA chamar organization.delete() fora daqui — toda dissolução      │
 * │ passa OBRIGATORIAMENTE pelo fluxo de 2 passos (dissolve → delete).    │
 * │ Teardowns de teste usam adminClient (bypass) — fora desta regra.     │
 * └─────────────────────────────────────────────────────────────────────┘
 *
 * As 3 guardas (ADR-001 D6) são verificadas ANTES do delete, sem atalho:
 *   1. OWNER apenas         → gate requireOrgRole (Response 401/403/404).
 *   2. status === ARCHIVED  → 409 caso contrário (exige dissolve antes).
 *   3. confirmName === name → 400 caso contrário (type-to-confirm).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Guarda 1 — OWNER apenas.
  const sessionOrResponse = await requireOrgRole(["OWNER"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;

  const { id } = await params;

  const org = await prisma.organization.findUnique({
    where: { id },
    select: { id: true, name: true, status: true },
  });
  if (!org) return apiError("Organization not found", 404);

  // Guarda 2 — só apaga org já arquivada (passo 1 obrigatório antes).
  if (org.status !== "ARCHIVED") {
    return apiError(
      "Organization must be archived before hard-delete. Dissolve it first.",
      409
    );
  }

  // Guarda 3 — type-to-confirm pelo nome exato da org.
  const body = (await request.json().catch(() => null)) as {
    confirmName?: unknown;
  } | null;
  if (!body || body.confirmName !== org.name) {
    return apiError(
      "confirmName must exactly match the organization name to confirm deletion",
      400
    );
  }

  // As 3 guardas passaram — esta é a única chamada de delete de Organization.
  await prisma.organization.delete({ where: { id } });

  return apiSuccess({ deleted: true, id });
}
