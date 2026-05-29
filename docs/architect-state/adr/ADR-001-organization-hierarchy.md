# ADR-001 — Hierarquia de Organizações: Visibilidade e Operação Vertical (Sub-26, Escopo C)

- **Status:** Accepted. Implementação faseada pendente (26.1 → 26.4). **Não-bloqueante para go-live.**
- **Data:** 2026-05-29
- **Decisores:** chat-architect (Nick).
- **Insumo:** Discovery 1 + Discovery 2 da Sub-26 (read-only, documento de arquitetura). Este ADR destila as DECISÕES desses discoveries num registro durável.
- **Convenção:** este é o **primeiro ADR** do projeto. Estabelece `docs/architect-state/adr/` como o diretório canônico de Architecture Decision Records, nomeados `ADR-NNN-<slug>.md`, no formato Title / Status / Context / Decision / Consequences / Alternatives considered (+ plano de implementação quando aplicável).

---

## Contexto

**Requisito de negócio.** Uma org-pai (holding/matriz), com permissão, deve **ver** e **operar** os dados das orgs descendentes, **transitivamente** (holding → subsidiária → … → loja → gestor → operador). Caso real: a matriz **Bucked Up** precisa ver/operar suas **18 lojas** (franqueadas, que são org-tenants completas).

**Modelo de entidade.** Sub-orgs são `Organization` tenants completas — não há tipo de entidade novo. A matriz enxerga *através* da hierarquia. A fundação estrutural já existe **órfã** no schema: `Organization.parentOrgId` + self-relation `OrganizationHierarchy` (criados na Sub-18), e o ResourceType RBAC `org_hierarchy` (Sub-21). Nenhum dos dois é usado por código hoje; ambas as orgs DEV têm `parent_org_id = NULL`.

**Mecanismo de isolamento atual.** O sistema isola tenants por **igualdade-exata** de `organization_id`:
- `proxy.ts` resolve host → 1 org → header `x-org-id` (1 UUID).
- `requireOrgRole` resolve `activeOrgId` (header primário, JWT fallback) e valida membership por `===` exato.
- `withTenant(orgId)` seta a GUC `app.tenant_id` = **1 UUID** via `set_config(..., true)` (SET LOCAL).
- A Prisma Extension injeta `tenantId` em reads/writes (defense-in-depth layer 1) e dispara o write na transação que setou a GUC.
- As policies RLS (20 tabelas tenant-scoped) usam `USING ("tenant_id" = current_app_tenant_id()::uuid)` — igualdade exata. `current_app_tenant_id()` retorna **um** valor (`NULLIF(current_setting('app.tenant_id', TRUE), '')`).

Toda a cadeia assume **cardinalidade 1** (1 host = 1 org = 1 GUC = 1 UUID na policy). Ver Sub-22 (routing), lição #82 (cross-tenant leak / RLS breach test), Sub-25 (audit RLS).

**Escopo C** habilita visibilidade **VERTICAL descendente** preservando o isolamento **HORIZONTAL**. PG **17.6** em runtime (suporte total a `WITH RECURSIVE`).

---

## Decisão

### D1 — Escopo C (vertical read+write), não A nem B

Adotado o Escopo C: o pai vê **e opera** dados dos descendentes. Os escopos **A (metadata-only — só vínculo parent-child)** e **B (heranças seletivas de config)** foram **rejeitados** por não atenderem o requisito de ver/operar os dados descendentes. C é read+write através da hierarquia.

### D2 — Isolamento horizontal inegociável

O conjunto visível de um tenant é **sempre** `{self} ∪ {descendentes(self)}`. Consequências cravadas:
- Irmãs (sem relação de ancestralidade) **NUNCA** se veem.
- Filho **NÃO** vê o pai — a visibilidade é **estritamente descendente**, jamais ascendente.

Este é o requisito não-negociável (lição #82). Todo mecanismo escolhido deve preservá-lo **por construção**.

### D3 — Leitura vertical: mecanismo a decidir na 26.2 via micro-benchmark

A escolha do mecanismo de leitura vertical fica para a spec da **26.2**, decidida por **medição**. Candidatas:
- **3.1 — GUC tenant-SET:** `current_app_tenant_id()` (1 uuid) → `current_app_tenant_ids()` (uuid[]) com fechamento transitivo dos descendentes; policies viram `tenant_id = ANY(...)`. **Recomendação da discovery.**
- **3.3 — Closure table:** tabela `(ancestor_id, descendant_id, depth)` materializada; policy faz `EXISTS`/join. Leitura mais rápida; escrita na árvore mantém o fechamento. **Inclinação do chat-architect (perfil read-heavy).**
- **3.2 — Subquery recursiva por query:** `WITH RECURSIVE` inline na policy. **Preterida** por custo de runtime (CTE por query, por tabela).
- **3.4 — App-layer (RLS continua exact-match):** **DESCARTADA** — fere a garantia DB-level do #82 (um bug de escopo no app reabriria vazamento vertical sem rede de proteção do banco).

**Decisão final do mecanismo de leitura depende do micro-benchmark 3.1 vs 3.3 na 26.2.** Ambas preservam D2 por construção e mantêm a garantia DB-level.

### D4 — Escrita vertical via re-entrada de contexto

O pai "entra" no tenant do filho via **`withTenant(childId)`**, autorizado por **checagem de ancestralidade na aplicação** (o pai é ancestral de `childId`?). Consequência crítica:

> O `WITH CHECK` das policies permanece **igualdade-EXATA** (`tenant_id = current_app_tenant_id()::uuid`). **NUNCA** é afrouxado para `ANY(descendants)`.

A hierarquia autoriza a **entrada no contexto**, não relaxa o check de escrita. Como o write roda sob `withTenant(childId)`, a GUC já é a do filho e o `WITH CHECK` exato continua válido sem mudança — a linha grava corretamente sob o tenant do filho, e nenhum INSERT consegue mirar um tenant arbitrário.

### D5 — AuditLog (Sub-25) registra a operação cross-tier

Ações verticais gravam:
- `actorProfileId` = profile do **pai** que executou a ação.
- `tenantId` = org do **filho** (consequência natural da re-entrada de contexto D4 — `writeAuditLog` abre o próprio `withTenant(childId)`).
- `metadata.via_parent_org = <parentOrgId>` — trilha explícita de que a ação foi cross-tier, a partir de qual org-pai.

**Sem mudança de schema do audit** — usa o `metadata Json` existente. O padrão "ator ≠ tenant" já é suportado pela Sub-25 (precedente: accept de convite).

### D6 — Dissolução de holding: `onDelete: Cascade` + 3 salvaguardas obrigatórias

O `parentOrgId` adota **`onDelete: Cascade`** (decisão registrada aqui; a alteração de schema é trabalho da 26.1). Como o CASCADE no banco dispara **incondicionalmente**, a segurança depende inteiramente de salvaguardas na aplicação:

- **(a) Soft-delete antes de hard-delete.** A dissolução **arquiva** (reversível por um período); o hard-delete físico é um passo **separado** e posterior.
- **(b) Confirmação type-to-confirm com blast radius.** Exibe a lista de sub-orgs + membros + dados afetados e **exige digitar o nome da org** para confirmar.
- **(c) Gate de permissão OWNER apenas.**

**Requisito de segurança crítico (inegociável):** **nenhum caminho de código pode chamar `organization.delete()` diretamente.** Toda dissolução passa **OBRIGATORIAMENTE** pelo fluxo guiado. O CASCADE dispara sem condição; a segurança vem de o fluxo guiado ser o **único portão de entrada** para deleção de org.

### D7 — Premissa "1 host = 1 tenant" (§5) intacta

Cada org (inclusive sub-orgs) mantém **seu próprio host/subdomain** → `org-resolver` inalterado, 1 host → 1 org. A visibilidade vertical é um **"modo consolidado" opt-in explícito** no host do pai (toggle/scope na UI). A entrada no contexto de um filho específico é uma **ação explícita e auditada** — **não** ambiente, **não** host especial. A §5 do STATE permanece válida.

---

## Consequências

**Positivas:**
- Habilita dashboards consolidados e operação hierárquica (caso Bucked Up + 18 lojas).
- Reusa a fundação órfã (Sub-18 `parentOrgId`/relation + Sub-21 RBAC `org_hierarchy`) — forward-investment realizado.
- Preserva o isolamento horizontal **por construção** (D2).
- Mantém a **garantia DB-level** de isolamento (vs a alternativa app-layer descartada).

**Negativas / custos:**
- **Modifica o mecanismo de isolamento — o coração do #82.** Exige bateria de testes-canário reforçada antes de qualquer write vertical.
- **CASCADE exige disciplina de fluxo único** de deleção (D6) — superfície de risco operacional se violada.
- **Fechamento transitivo tem custo** (recursão/lookup por request) — mitigado por cache ou closure table conforme a decisão da 26.2.

**Riscos de vigilância:**
- **(i)** O cálculo de fechamento deve partir SEMPRE do org ativo **DESCENDO**. Um bug que incluísse **ancestrais** vazaria visibilidade **pra cima** — coberto pelo teste-canário **"filho não vê pai"**.
- **(ii)** O `WITH CHECK` **não** pode ser afrouxado para `ANY(descendants)` — coberto pelo teste de **escrita cross-tier** (a escrita só passa via re-entrada de contexto autorizada).

---

## Alternativas consideradas

- **Escopo A (metadata-only):** apenas vínculo parent-child estrutural, cada sub-org permanece silo isolado. **Rejeitado** — não atende ver/operar dados descendentes.
- **Escopo B (heranças seletivas):** A + propagação de config (branding/locale) do pai. **Rejeitado** — também não atende ver/operar dados.
- **Opção 3.4 (isolamento vertical só em app-layer):** RLS continua exact-match, visibilidade vertical resolvida só no Prisma. **Rejeitado** — fere o defense-in-depth do #82 (perde a garantia DB-level no caso vertical).
- **Opção 3.2 (subquery recursiva por query):** mantém 1 GUC mas resolve a árvore inline na policy. **Preterido** — pior custo de runtime (CTE por query, por tabela). Mantido como referência, não como candidato ativo.

---

## Plano de implementação faseado

Sequência: **26.1 → 26.2 → 26.3 → 26.4.** Cada fatia com discovery → spec → smoke próprio. O gate de breach-test entra **ANTES** de qualquer write vertical.

### 26.1 — Árvore estrutural (risco BAIXO, não toca RLS)
- Popular/gerir `parentOrgId`.
- Validação anti-ciclo (reusar o padrão `checkIsDescendant` de `knowledge/folders/[id]/route.ts`).
- Helpers `getDescendants` / `getAncestors` (`WITH RECURSIVE`, PG 17.6).
- Ativar RBAC `org_hierarchy` em rotas.
- `create-org --parent`.
- Implementar o **fluxo de dissolução** com as 3 salvaguardas (D6) + garantir **caminho único de deleção**.
- Migration: confirmar/aplicar `onDelete: Cascade` no `parentOrgId`.

### 26.2 — Leitura vertical (risco ALTO, coração #82)
- **Micro-benchmark 3.1 vs 3.3** → decidir o mecanismo (D3).
- Implementar fechamento + policies de leitura.
- Reforçar `rls-breach.integration.test.ts`: irmã = **deny**, pai → filho = **allow**, filho → pai = **deny**.
- **Gate:** breach-test verde ANTES de qualquer write.

### 26.3 — Escrita vertical + audit (risco ALTO)
- Re-entrada `withTenant(childId)` autorizada por ancestralidade (D4).
- `WITH CHECK` exato preservado (D4).
- `AuditLog.metadata.via_parent_org` (D5).
- Suíte de regressão de escrita cross-tier.

### 26.4 — UX modo consolidado (risco MÉDIO)
- Toggle de visão hierárquica no host do pai (D7).
- Navegação na árvore.
- Entrada explícita no contexto de filho. §5 intacta.

---

## Referências

- Discovery 1 e Discovery 2 da Sub-26 (sessão chat-architect, 2026-05-29).
- Lição #82 — isolamento cross-tenant + `rls-breach.integration.test.ts`.
- Sub-22 — domain routing / "1 host = 1 tenant".
- Sub-25 — Audit Log (`docs/handbook/tools/infrastructure/audit-log/`).
- Fundação: Sub-18 (`Organization.parentOrgId` + `OrganizationHierarchy`), Sub-21 (RBAC `org_hierarchy`).
