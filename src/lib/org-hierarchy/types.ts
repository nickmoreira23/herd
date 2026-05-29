/**
 * Sub-etapa 26.1 — estrutura da árvore de organizações (ADR-001).
 *
 * Estes tipos descrevem a ESTRUTURA da hierarquia (relação parent-child entre
 * `Organization`s), não dados tenant-scoped. `Organization` não está em
 * TENANT_SCOPED_MODELS — os helpers leem a tabela `organizations` diretamente,
 * sem RLS/withTenant. A visibilidade vertical de DADOS (Escopo C) é trabalho
 * das fatias 26.2/26.3.
 */

export type OrgTreeNode = {
  id: string;
  slug: string;
  name: string;
  parentOrgId: string | null;
  /** Distância em arestas a partir da org de origem (1 = filho direto). */
  depth: number;
};

/**
 * Lançado quando um reparent criaria um ciclo: mover uma org para debaixo de
 * si mesma (self-ref) ou de um de seus próprios descendentes.
 */
export class OrgCycleError extends Error {
  readonly code = "ORG_CYCLE";
  constructor(message: string) {
    super(message);
    this.name = "OrgCycleError";
  }
}
