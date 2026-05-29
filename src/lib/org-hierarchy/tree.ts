import { prisma } from "@/lib/prisma";
import { OrgCycleError, type OrgTreeNode } from "./types";

/**
 * Sub-etapa 26.1 — helpers de leitura da árvore de organizações (ADR-001).
 *
 * Read-only sobre a tabela `organizations` via WITH RECURSIVE (PG 17.6).
 * `Organization` NÃO é tenant-scoped — sem withTenant, sem RLS. Estes helpers
 * lidam com a ESTRUTURA da árvore, nunca com dados tenant-scoped.
 */

/**
 * Todos os descendentes transitivos de `orgId` (exclui a própria org),
 * ordenados por profundidade e depois por nome.
 */
export async function getDescendants(orgId: string): Promise<OrgTreeNode[]> {
  return prisma.$queryRaw<OrgTreeNode[]>`
    WITH RECURSIVE descendants AS (
      SELECT id, slug, name, parent_org_id, 1 AS depth
      FROM organizations
      WHERE parent_org_id = ${orgId}::uuid
      UNION ALL
      SELECT o.id, o.slug, o.name, o.parent_org_id, d.depth + 1
      FROM organizations o
      JOIN descendants d ON o.parent_org_id = d.id
    )
    SELECT id, slug, name, parent_org_id AS "parentOrgId", depth
    FROM descendants
    ORDER BY depth, name
  `;
}

/**
 * Cadeia de ancestrais de `orgId` (exclui a própria org), do pai imediato
 * (depth 1) até a raiz.
 */
export async function getAncestors(orgId: string): Promise<OrgTreeNode[]> {
  return prisma.$queryRaw<OrgTreeNode[]>`
    WITH RECURSIVE ancestors AS (
      SELECT p.id, p.slug, p.name, p.parent_org_id, 1 AS depth
      FROM organizations c
      JOIN organizations p ON c.parent_org_id = p.id
      WHERE c.id = ${orgId}::uuid
      UNION ALL
      SELECT p.id, p.slug, p.name, p.parent_org_id, a.depth + 1
      FROM ancestors a
      JOIN organizations p ON a.parent_org_id = p.id
    )
    SELECT id, slug, name, parent_org_id AS "parentOrgId", depth
    FROM ancestors
    ORDER BY depth
  `;
}

/**
 * Garante que apontar `orgId.parentOrgId = newParentId` não cria ciclo.
 * Lança `OrgCycleError` quando:
 *  - `newParentId === orgId` (org pai de si mesma); ou
 *  - `newParentId` é um descendente de `orgId` (mover para debaixo do próprio
 *    descendente fecharia o ciclo).
 *
 * `newParentId === null` (promover a raiz) é sempre permitido. A existência /
 * validade do pai é responsabilidade do chamador (rota) — este helper só
 * cuida da invariante anti-ciclo.
 */
export async function assertNoCycle(
  orgId: string,
  newParentId: string | null
): Promise<void> {
  if (newParentId === null) return;

  if (newParentId === orgId) {
    throw new OrgCycleError("An organization cannot be its own parent.");
  }

  const hits = await prisma.$queryRaw<{ hit: number }[]>`
    WITH RECURSIVE descendants AS (
      SELECT id FROM organizations WHERE parent_org_id = ${orgId}::uuid
      UNION ALL
      SELECT o.id FROM organizations o
      JOIN descendants d ON o.parent_org_id = d.id
    )
    SELECT 1 AS hit FROM descendants WHERE id = ${newParentId}::uuid LIMIT 1
  `;

  if (hits.length > 0) {
    throw new OrgCycleError(
      "Cannot reparent an organization under one of its own descendants."
    );
  }
}
