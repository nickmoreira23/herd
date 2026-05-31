import { withTenant } from "@/lib/tenancy/context";
import { getDescendants } from "./tree";

/**
 * Lançado quando uma operação vertical mira um tenant que NÃO é descendente
 * estrito do org ativo do ator. Mapeado para 403 nas rotas.
 */
export class OrgVerticalForbiddenError extends Error {
  readonly code = "ORG_VERTICAL_FORBIDDEN";
  constructor(message: string) {
    super(message);
    this.name = "OrgVerticalForbiddenError";
  }
}

/**
 * Sub-etapa 26.3 — autorização de escrita vertical (ADR-001 D4).
 *
 * Garante que `actorOrgId` pode operar no tenant `childId` por ANCESTRALIDADE:
 * `childId` deve ser descendente ESTRITO de `actorOrgId`. Lança
 * `OrgVerticalForbiddenError` caso contrário.
 *
 * - **self NÃO é alvo vertical:** `childId === actorOrgId` lança — escrita no
 *   próprio tenant usa o caminho normal `withTenant`, não o vertical.
 * - **Ancestralidade FRESCA, sem cache:** consulta `getDescendants` ao vivo.
 *   Reparenting (26.1) muda a árvore; uma autorização cacheada poderia
 *   autorizar um ex-descendente.
 *
 * NÃO checa role — isso é responsabilidade do `requireOrgRole` upstream
 * (OWNER/ADMIN no org ativo). Autorização completa = role E ancestralidade.
 */
export async function assertCanOperateOnTenant(
  actorOrgId: string,
  childId: string
): Promise<void> {
  if (childId === actorOrgId) {
    throw new OrgVerticalForbiddenError(
      "Self is not a vertical target — use the normal tenant path."
    );
  }
  const descendants = await getDescendants(actorOrgId);
  if (!descendants.some((d) => d.id === childId)) {
    throw new OrgVerticalForbiddenError(
      `Organization ${childId} is not a descendant of ${actorOrgId}.`
    );
  }
}

/**
 * Sub-etapa 26.3 — PORTÃO ÚNICO da escrita vertical (ADR-001 D4).
 *
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │ FRONTEIRA DE SEGURANÇA da escrita vertical.                            │
 * │ A RLS NÃO protege a escrita vertical: a re-entrada seta a GUC para o    │
 * │ tenant do FILHO, e o WITH CHECK exato (= current_app_tenant_id())      │
 * │ APROVA a escrita. Logo, `assertCanOperateOnTenant` é a fronteira de    │
 * │ segurança INTEIRA. NUNCA chamar `withTenant(<id vindo do request>)`    │
 * │ cru — toda re-entrada vertical passa por aqui (assert + withTenant     │
 * │ atomicamente). O role do ator é checado upstream (requireOrgRole).     │
 * └──────────────────────────────────────────────────────────────────────┘
 */
export async function withVerticalTenant<T>(
  actorOrgId: string,
  childId: string,
  fn: () => Promise<T> | T
): Promise<T> {
  await assertCanOperateOnTenant(actorOrgId, childId);
  return withTenant(childId, fn);
}
