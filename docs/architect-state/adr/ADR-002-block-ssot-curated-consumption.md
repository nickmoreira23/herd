# ADR-002 — Bloco como Single Source of Truth: Consumo Curado por Superfície + Proveniência de Registros

- **Status:** Accepted. Implementação **faseada pendente** (Fatias 1 → 4). **Não-bloqueante** para a operação atual (PROD sem cliente real).
- **Data:** 2026-06-01
- **Decisores:** chat-architect (Nick).
- **Insumo:** Discovery "Proveniência + consumo curado" (read-only). Este ADR destila as DECISÕES desse discovery num registro durável, para que a implementação parta de registro e não de memória de sessão.
- **Convenção:** segue o `docs/architect-state/adr/` estabelecido pelo ADR-001 (Title / Status / Context / Decision / Consequences / Alternatives + plano faseado).

---

## Contexto

**Princípio de produto (fundador).** O **Bloco** é o catálogo-mestre / **single source of truth**. **Não existe tabela `Block`** — "bloco" é a abstração de **manifesto** (`src/lib/blocks/manifest.ts`) + **registry** (`src/lib/blocks/registry.ts`) + **DataProvider** em volta de um **modelo Prisma**; o modelo Prisma de cada bloco **É a fonte única** (ex.: `Location` é o SSOT do bloco `locations`; `KnowledgeDocument` do bloco de documentos).

**Consumo curado.** Superfícies do produto (Organization, Knowledge Base, e futuras) consomem um **subconjunto curado** do bloco — não necessariamente todos os registros. Formalmente: `Organization.locations ⊆ Bloco.locations`. Da superfície, o usuário pode:
- **(a) vincular** um registro que já existe no bloco, ou
- **(b) criar** um novo, que passa a existir no bloco.

**Integridade:** tudo que está na superfície **TEM** que existir no bloco; o bloco **pode** ter registros que a superfície não usa.

**Proveniência.** Todo registro de bloco rastreia **de onde veio**: criado no próprio bloco (manual), via uma superfície (ex.: organization), via integração (qual), ou pelo sistema.

**Estado atual mapeado pela discovery (read-only):**
- **Locations:** **flat-mas-scoped** — `Location.tenantId` direto, está em `TENANT_SCOPED_MODELS` + RLS. "As locations da Organization" = **todos** os `Location` do tenant; **não há recorte curado** (o subconjunto não existe — precisa ser **criado**). Sem campo de proveniência. Criado só via `POST /api/locations` (nenhuma integração cria Location).
- **Knowledge:** **flat E global** — `KnowledgeDocument`/`KnowledgeFolder`/etc. **sem `tenantId`**, **fora** de `TENANT_SCOPED_MODELS`; folders globais. Precisa de **tenancy antes** de qualquer consumo curado.
- **Proveniência hoje:** ad-hoc e inconsistente — `sourceFeature` (em doc/image/link/table, **nunca escrito**, inerte), `sourceType`/`sourceId`/`sourceImportedAt` (KnowledgeTable, import Airtable), `sourceIntegration`/`sourceId` (KnowledgeAudio), `source` free-text (Contact/Feedback). Sem enum nem padrão único. Location: nada.

---

## Decisão

### D1 — Bloco = SSOT; superfície = consumidora (nunca duplica)
Superfícies **nunca duplicam** o dado do bloco; consomem **via vínculo**. Foi exatamente isto que **invalidou o "Item B / dedup de Locations"**: deletar `/profile/locations` destruía o conceito de **recorte curado** (a Organization deixaria de poder ter um subconjunto próprio). O dado vive uma vez, no bloco.

### D2 — Consumo curado via tabela de junção, molde `*TierAssignment`
**Precedente real no codebase** (3 lugares): `PerkTierAssignment`, `AgentTierAccess`, `CommunityBenefitTierAssignment` — todos `FK-mestre + FK-consumidor + isEnabled + config? + @@unique`. O padrão de **junção curada já existe** — **generaliza, não inventa.**

Para Locations (Fatia 1):
```
OrganizationLocation {
  organizationId  FK → organizations
  locationId      FK → Location
  isEnabled       Boolean @default(true)
  @@unique([organizationId, locationId])
}
```
Racional: o vínculo carrega a curadoria (presença no recorte + flags), o dado fica no `Location`.

### D3 — Anti-precedente explícito: `AgentKnowledgeItem` (o que NÃO fazer)
`AgentKnowledgeItem` tem **conteúdo próprio** (`title`/`content`/`sourceUrl`/`fileKey`) e **NENHUMA FK** a `KnowledgeDocument` — é **cópia paralela**, não vínculo ao SSOT. **NÃO espelhar.** Registrado aqui como o anti-padrão (duplicar dado em vez de vincular ao catálogo-mestre).

### D4 — Proveniência via enum `RecordSource` + campo **por modelo de bloco** (não tabela central)
```
enum RecordSource { MANUAL, ORGANIZATION, INTEGRATION, SYSTEM }
```
Campo `source: RecordSource` (+ refs de integração quando `INTEGRATION`) **em cada modelo de bloco**. **NÃO** uma tabela de proveniência central — uma central **acoplaria todos os blocos** e feriria a arquitetura **manifesto+provider**, onde cada bloco é **autocontido**. Ao longo das fatias, **consolidar** os campos ad-hoc existentes (`sourceFeature` inerte, `sourceType`/`sourceId` do Airtable, `sourceIntegration` do Audio, `source` free-text de Contact/Feedback) nesse padrão único.

### D5 — Criar-da-superfície grava no bloco com a proveniência da superfície
Ex.: criar location no form da Organization → grava **`Location` (SSOT)** com `source = ORGANIZATION` **E** cria o **`OrganizationLocation` (vínculo)**. **Vincular-existente** → cria **só** o vínculo, **não duplica** o `Location`.

### D6 — Integridade referencial pela FK da junção
O vínculo (`OrganizationLocation`) tem **FK pro `Location`** — é **impossível vincular o que não existe** no bloco. Política de `onDelete` a cravar na spec da fatia, com a **direção provável**: deletar o `Location` **cascateia/restringe** o vínculo; deletar o **vínculo NÃO deleta** o `Location` — **o catálogo-mestre sobrevive** ao descadastro por uma superfície.

---

## Consequências

**Positivas:**
- Elimina duplicação de dado entre superfícies; **SSOT única e rastreável**.
- Reusa um padrão **já consolidado** (`*TierAssignment`) — baixo risco conceitual.
- Proveniência (`RecordSource`) habilita **auditoria de origem** por registro.
- Cada superfície ganha um **recorte próprio** sem fork de dados.

**Custos:**
- Tabela de junção + migration + **backfill por bloco**.
- UI de **vincular/criar** em cada superfície.
- Knowledge **bloqueado** pelo pré-requisito de tenancy (Fatia 3).

**Riscos de vigilância:**
- **(i)** O backfill tem que vincular **TODO** registro existente à sua org atual — senão o registro **some** da superfície.
- **(ii)** Criar-da-superfície tem que gravar **bloco E vínculo atomicamente** (mesma transação) — senão gera **órfãos** (Location sem vínculo, ou vínculo apontando pra nada).

---

## Alternativas consideradas

- **Tabela de proveniência central** — **rejeitada**: acopla todos os blocos, fere a autocontenção manifesto+provider.
- **Espelhar `AgentKnowledgeItem`** — **rejeitada**: é cópia, não vínculo ao SSOT (ver D3).
- **Manter flat** (superfície = tudo do tenant) — **rejeitada**: não existe recorte curado; o requisito de produto exige **subconjunto**.

---

## Plano de implementação faseado

Sequência **1 → 2 → 3 → 4**. Cada fatia com **discovery → spec → smoke** próprio.

### Fatia 1 — Locations piloto end-to-end (risco BAIXO)
Sem migração de dados pré-existente complexa. `OrganizationLocation` (junção) + `RecordSource` em `Location` + migration + **backfill** (todo `Location` atual → vínculo da org, `source = MANUAL`) + UI de **vincular/criar** no form da Organization. **Prova o padrão inteiro** num bloco barato.

### Fatia 2 — Proveniência transversal
`RecordSource` nos demais modelos de bloco + **consolidar** os campos ad-hoc + **preencher** nos syncs de integração (Airtable / RSS / Apps → `source = INTEGRATION` + refs).

### Fatia 3 — KB tenancy (gate de segurança pré-go-live do KB)
`KnowledgeDocument`/`KnowledgeFolder`/etc. ganham `tenantId` + entram em `TENANT_SCOPED_MODELS` + RLS + **backfill**. **Auth já coberta pela Camada 1 (#111)** — o gate `/api/*` fechou o vetor anônimo do KB; **resta só tenancy**. Pré-requisito da Fatia 4.

### Fatia 4 — Knowledge consumo curado
Junção curada nos blocos de Knowledge, **espelhando Locations** (após a tenancy da Fatia 3).

---

## Referências
- ADR-001 — Hierarquia de Organizações (mesma convenção).
- `docs/architect-state/STATE.md` — callout do incidente de PROD + pendências (esta etapa).
- Precedentes de junção: `PerkTierAssignment`, `AgentTierAccess`, `CommunityBenefitTierAssignment` (`prisma/schema.prisma`).
- Anti-precedente: `AgentKnowledgeItem` (`prisma/schema.prisma`).
- Camada 1 de segurança: PR #111 (gate `/api/*` no `proxy.ts`).
