import { requireOrgRole } from "@/lib/permissions";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { getDescendants } from "@/lib/org-hierarchy";

/**
 * GET /api/org/hierarchy
 *
 * Sub-etapa 26.1 — retorna os descendentes transitivos da org ativa (host-based).
 * Read-only de estrutura (organizations não é tenant-scoped). Gate: qualquer
 * membro ativo (OWNER/ADMIN/MEMBER) pode ler a árvore da própria org.
 */
export async function GET() {
  const sessionOrResponse = await requireOrgRole(["OWNER", "ADMIN", "MEMBER"]);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const orgId = session.user.activeOrgId;
  if (!orgId) return apiError("No active organization", 400);

  const descendants = await getDescendants(orgId);
  return apiSuccess({ orgId, descendants });
}
