---
title: Glossário
description: >-
  Glossário global agregado dos termos definidos em todas as entries do
  Handbook.
locale: pt-BR
uid: herd.meta.glossary
---
# Glossário

Glossário global agregado a partir das seções `## Glossary` de todas as entries do Handbook. Gerado automaticamente por `npm run gen:glossary`.

**Última atualização:** 2026-06-02

<!-- BEGIN_GENERATED_GLOSSARY -->

### `CAN_ENFORCEMENT`

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

Flag tri-estado (`off`/`shadow`/`enforce`) que gateia a camada de enforcement do `can()`; default `off`.

### 5-level hierarchy

**From [R2 — Areas Foundation](/admin/handbook/refactor/r2-areas-foundation):**

Networks → Areas → Tools → Blocks → Integrations.

### Action

**From [Log de Auditoria](/admin/handbook/tools/infrastructure/audit-log):**

Uma string `{recurso}.{verbo}` em lowercase identificando o que aconteceu, ex. `location.deleted`.

### Actor

**From [Log de Auditoria](/admin/handbook/tools/infrastructure/audit-log):**

O profile que *executou* a ação. No accept de um convite, a pessoa convidada — não quem convidou. Nullable; um ator deletado seta a coluna para NULL.

### Agent

**From [R7 — Agents as Tool (consolidate dual surface)](/admin/handbook/refactor/r7-agents-tool):**

AI assistant configurável. Top-level feature pós-R7.

### AgentKnowledgeItem

**From [R7 — Agents as Tool (consolidate dual surface)](/admin/handbook/refactor/r7-agents-tool):**

item de conhecimento associado ao agent (rename de KnowledgeApp).

### AgentRole

**From [R7 — Agents as Tool (consolidate dual surface)](/admin/handbook/refactor/r7-agents-tool):**

papel funcional do agent (orchestrator, specialist).

### AgentSkill

**From [R7 — Agents as Tool (consolidate dual surface)](/admin/handbook/refactor/r7-agents-tool):**

capacidade declarada do agent (resolução de problemas específicos).

### AgentStatus

**From [R7 — Agents as Tool (consolidate dual surface)](/admin/handbook/refactor/r7-agents-tool):**

estados (ACTIVE, INACTIVE, ARCHIVED).

### AgentTierAccess

**From [R7 — Agents as Tool (consolidate dual surface)](/admin/handbook/refactor/r7-agents-tool):**

matriz de acesso de agents por tier de subscription.

### AgentTool

**From [R7 — Agents as Tool (consolidate dual surface)](/admin/handbook/refactor/r7-agents-tool):**

ferramenta exposta ao agent (tool da plataforma que o agent pode invocar).

### Aggregate

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Entidade de domínio sobre a qual um evento é. Identificada por `aggregateType` + `aggregateId` (UUID).

### agnostic primitive

**From [Pattern: Plan Orchestrator](/admin/handbook/meta/pattern-plan-orchestrator):**

entidade que se atrela a múltiplos contextos (qualquer profile-type) sem ter lógica acoplada a contexto específico.

### Append-only

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Estratégia de escrita onde registros existentes nunca são modificados ou deletados; correção via novo registro compensatório.

### Area

**From [Áreas](/admin/handbook/areas):**

macro-divisão do produto agrupando tools pela função que exercem (Communication, Transaction, Workflow, Notification, Identity, Infrastructure).

**From [R2 — Areas Foundation](/admin/handbook/refactor/r2-areas-foundation):**

macro-divisão do produto onde tools são posicionadas. 6 valores canônicos.

**From [Pattern: Tool](/admin/handbook/meta/pattern-tool-level):**

macro-divisão estrutural do produto (Organization, Identity, Communication, Transaction, Workflow, Notification). Tools vivem dentro de areas.

### AreaManifest

**From [Áreas](/admin/handbook/areas):**

schema TypeScript em `src/lib/core/manifest.ts` que descreve uma area.

**From [R2 — Areas Foundation](/admin/handbook/refactor/r2-areas-foundation):**

interface de manifest de area com kind: "area".

### areaRegistry

**From [Áreas](/admin/handbook/areas):**

registry estático em `src/lib/core/registry.ts` que enumera as 6 areas canônicas.

**From [R2 — Areas Foundation](/admin/handbook/refactor/r2-areas-foundation):**

lookup `Record<string, AreaManifest>` em `src/lib/core/registry.ts`.

### areas-as-Handbook-layer

**From [Áreas](/admin/handbook/areas):**

convenção R2 — areas viraram a 5ª camada canônica do Handbook (sob `docs/handbook/areas/`).

### Assinatura

**From [Assinaturas](/admin/handbook/blocks/financial/subscriptions):**

relação de cobrança ativa no provider espelhada localmente.

### Audit Log

**From [Log de Auditoria](/admin/handbook/tools/infrastructure/audit-log):**

Um registro tenant-scoped e imutável de que um ator específico executou uma ação específica em um recurso específico em um momento específico.

### Audit trail

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Histórico cronológico imutável de todas as mudanças, usado para auditoria e reconstrução de estado.

### audit-trail

**From [Pattern: Source Attribution](/admin/handbook/meta/pattern-source-attribution):**

histórico rastreável de events com origem identificável, usado para auditoria.

### balance

**From [Pattern: Snapshots](/admin/handbook/meta/pattern-snapshots):**

current saldo dinâmico que atualiza on event, sem fechamento periódico.

### Bearer token

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Esquema de auth onde o cliente envia `Authorization: Bearer <token>` no header. Day-1 do HTTP transport usa token estático configurado via env var.

### Best-effort write

**From [Log de Auditoria](/admin/handbook/tools/infrastructure/audit-log):**

Um insert de auditoria cuja falha é logada e engolida, de modo que nunca pode quebrar ou dar rollback na ação de negócio que descreve.

### Billing customer

**From [Clientes de Cobrança](/admin/handbook/blocks/financial/billing-customers):**

o espelho local de um cliente registrado no provider de pagamento.

### BillingCycle

**From [R5 — Subscriptions Split + Offering Creation](/admin/handbook/refactor/r5-subscriptions-split):**

ciclo de cobrança (monthly, annual, etc.). Atributo da subscription real.

### BillingEvent

**From [Assinaturas](/admin/handbook/blocks/financial/subscriptions):**

linha de log de auditoria interno capturando transição de estado.

### Block

**From [Pattern: Block](/admin/handbook/meta/pattern-block-level):**

nível de dado — single source of truth de um tipo de registro. Sempre plural.

**From [Pattern: Composição em Três Níveis](/admin/handbook/meta/pattern-three-level-composition):**

categoria de dado dentro de uma family — single source of truth daquele tipo de registro.

### Block Family

**From [Pattern: Block](/admin/handbook/meta/pattern-block-level):**

conjunto de blocks correlacionados gerados/manipulados por uma tool.

**From [Pattern: Composição em Três Níveis](/admin/handbook/meta/pattern-three-level-composition):**

agrupamento de blocks correlacionados gerados por uma tool.

### Block Group

**From [Pattern: Block](/admin/handbook/meta/pattern-block-level):**

agrupamento opcional intra-block; metadata declarativa, sem CRUD próprio.

**From [Pattern: Composição em Três Níveis](/admin/handbook/meta/pattern-three-level-composition):**

agrupamento opcional intra-block, para organização interna.

### BlockConnection

**From [R1 — Tools Foundation Reconciliation](/admin/handbook/refactor/r1-tools-foundation):**

descriptor `{blockName, usage, purpose}` em Tool.blocks. Indica como uma tool consome dados de um block.

### BlockGroupSpec

**From [R0 — Manifest Registry Foundation](/admin/handbook/refactor/r0-manifest-registry):**

especificação aninhada para grupos de block (ex.: packages como grupo de products). Mora dentro do campo `groups?` do block pai. R3 exercitará isto.

### Brownfield investigation

**From [R1.5 — Re-investigation R3-R8 Reclassifications](/admin/handbook/refactor/r1-5-reclassifications-revision):**

leitura do código real (paths, manifests, surfaces) para confrontar suposições do plano original. Inverso de greenfield (planejar como se nada existisse).

### buildToolActionCatalog

**From [R1 — Tools Foundation Reconciliation](/admin/handbook/refactor/r1-tools-foundation):**

helper em `registry.ts` que materializa o catálogo de actions para o system prompt do orquestrador, achatando categories → tools → actions.

### Bundled pricing

**From [R3 — Packages Refinement](/admin/handbook/refactor/r3-packages-refinement):**

preço definido no nível de ProductGroup, distinto da soma dos products individuais.

### Campaign

**From [R4 — Campaigns Convergence (block → tool)](/admin/handbook/refactor/r4-campaigns-convergence):**

record de execução (instância de uma campanha de marketing rodando ou agendada).

### CampaignChannel

**From [R4 — Campaigns Convergence (block → tool)](/admin/handbook/refactor/r4-campaigns-convergence):**

canal de execução (email, whatsapp, sms, etc.) — termo independente de "channel" em Organization.

### CampaignObjective

**From [R4 — Campaigns Convergence (block → tool)](/admin/handbook/refactor/r4-campaigns-convergence):**

objetivo declarado (awareness, conversion, retention).

### CampaignRun

**From [R4 — Campaigns Convergence (block → tool)](/admin/handbook/refactor/r4-campaigns-convergence):**

instância de execução individual de uma campanha multi-step.

### CampaignStatus

**From [R4 — Campaigns Convergence (block → tool)](/admin/handbook/refactor/r4-campaigns-convergence):**

estados (DRAFT, SCHEDULED, RUNNING, COMPLETED, PAUSED, CANCELLED).

### Channel

**From [R2.5 — Network Split (Organization + Directory)](/admin/handbook/refactor/r2-5-network-split):**

termo polissêmico — em Organization significa channel institucional (canal organizacional); em messaging significa canal de comunicação. Distinção crítica.

### ChargeLineItem

**From [Cobranças](/admin/handbook/blocks/financial/charges):**

linha que divide uma cobrança composta entre as assinaturas que cobre (junction N:N).

### Coarse gating

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

Autorização por nome de papel (`requireOrgRole`), em oposição a checagens finas de recurso×ação.

### Cobrança (Charge)

**From [Cobranças](/admin/handbook/blocks/financial/charges):**

evento único de cobrança no provider.

### Communication area

**From [Comunicação](/admin/handbook/areas/communication):**

macro-divisão para tools de interação humano-humano e humano-agente.

### compensating entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Entry nova criada para anular o efeito de uma entry anterior; preserva a entry original intacta.

**From [Pattern: Source Attribution](/admin/handbook/meta/pattern-source-attribution):**

event com valor invertido que neutraliza efeito de event anterior — preserva audit trail (não deleta).

### Cross-area embed

**From [Pattern: Surface](/admin/handbook/meta/pattern-surface-level):**

Internal surface de uma área renderizada dentro de outra área.

### cross-tool reference

**From [Pattern: Plan Orchestrator](/admin/handbook/meta/pattern-plan-orchestrator):**

referência declarativa de uma tool a definições em outra tool — não duplica dado, apenas aponta.

### current-state

**From [Pattern: Snapshots](/admin/handbook/meta/pattern-snapshots):**

estado atual sem dimensão temporal de fechamento — dinâmico, atualiza continuamente.

### Directory

**From [R2.5 — Network Split (Organization + Directory)](/admin/handbook/refactor/r2-5-network-split):**

top-level feature com estrutura de pessoas (profiles, roles, permissions, promoters, onboarding).

### Distinção package vs product-group

**From [R3 — Packages Refinement](/admin/handbook/refactor/r3-packages-refinement):**

package é a oferta comercial; product-group é o bundle de products subjacente. Um package consome um product-group.

### Doc-first

**From [R1.5 — Re-investigation R3-R8 Reclassifications](/admin/handbook/refactor/r1-5-reclassifications-revision):**

protocolo onde decisões arquiteturais são cristalizadas em prosa canônica antes de qualquer mudança de código.

### Domain Event

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Registro imutável de algo significativo que aconteceu em um bounded context. Fato no passado, não comando.

### Double-entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Modelo contábil onde todo movimento é registrado simultaneamente como débito e crédito em contas diferentes, somando zero.

### drill-down

**From [Pattern: Source Attribution](/admin/handbook/meta/pattern-source-attribution):**

navegação do efeito (event derivado) para a causa (registro de origem).

### DunningAttempt

**From [Cobranças](/admin/handbook/blocks/financial/charges):**

retry de uma cobrança falha, rastreado por tentativa com um outcome.

### Editor da matriz

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

O grid de Switches super_admin-only em `/admin/organization/permissions` que liga/desliga grants via `PATCH /api/org/permissions/grant`.

### Embed

**From [Pattern: Surface](/admin/handbook/meta/pattern-surface-level):**

External surface distribuída como widget injetável em site terceiro.

### Embedded Mode

**From [Pattern: Composição em Três Níveis](/admin/handbook/meta/pattern-three-level-composition):**

tool invocada inline em outro contexto, sem sair da surface chamadora.

**From [Pattern: Tool](/admin/handbook/meta/pattern-tool-level):**

tool invocada inline a partir de outra surface.

### EntityManifest

**From [R0 — Manifest Registry Foundation](/admin/handbook/refactor/r0-manifest-registry):**

união discriminada de `BlockManifest | ToolManifest | FeatureManifest`. Substitui o `BlockManifest` monolítico pré-R0.

### Entry

**From [Handbook](/admin/handbook/areas/infrastructure/handbook):**

par `feature.yml` + `{pt-BR,en-US}.md` documentando uma feature/category/layer.

### Exhaustion

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Estado após 5 tentativas falhas. `nextAttemptAt = NULL`, auto-retry para, intervenção manual necessária.

### External ID

**From [Clientes de Cobrança](/admin/handbook/blocks/financial/billing-customers):**

o identificador do cliente no namespace do provider (ex: ID de cliente Recharge).

### External Surface

**From [Pattern: Surface](/admin/handbook/meta/pattern-surface-level):**

surface fora da plataforma; acessível por audiências externas (público, clientes finais, sistemas terceiros).

**From [Pattern: Composição em Três Níveis](/admin/handbook/meta/pattern-three-level-composition):**

surface fora da plataforma (página pública, embed, email, push, integração externa).

### getToolsByArea

**From [Áreas](/admin/handbook/areas):**

helper que retorna as tools registradas em uma dada area.

**From [R2 — Areas Foundation](/admin/handbook/refactor/r2-areas-foundation):**

helper que filtra tools[] por area.name.

### governance pattern

**From [Pattern: Manage Types/Sets](/admin/handbook/meta/pattern-manage-types):**

classe de patterns UX cuja função é organizar relação entre regras (templates) e operação (instances).

### Handler

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Função que reage a um evento de um dado `eventType`. Registrada estaticamente. Deve ser idempotente.

### header sub-action

**From [Pattern: Manage Types/Sets](/admin/handbook/meta/pattern-manage-types):**

affordance UX no header da tool (botão ou dropdown) que abre vista secundária da mesma tool.

### historical-state

**From [Pattern: Snapshots](/admin/handbook/meta/pattern-snapshots):**

estado capturado em ponto específico do tempo — imutável, append-only.

### Idempotency key

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Chave que identifica unicamente uma requisição; permite retry seguro sem efeito duplicado.

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Chave única opcional na emissão. Emit repetido com a mesma chave retorna o evento existente se payload match, lança se divergir.

### Identity area

**From [Identidade](/admin/handbook/areas/identity):**

macro-divisão para tools de quem (Network/Directory) e o que se sabe (Knowledge).

### Infrastructure area

**From [Infraestrutura](/admin/handbook/areas/infrastructure):**

macro-divisão para tools de plataforma (docs, observability, config) invisíveis em fluxo de produto normal.

### Inline component

**From [Pattern: Surface](/admin/handbook/meta/pattern-surface-level):**

componente embutido em outra tela que mostra ou manipula dados.

### instance

**From [Pattern: Manage Types/Sets](/admin/handbook/meta/pattern-manage-types):**

entidade concreta atrelada a contexto específico, derivada de um template.

### Integração horizontal

**From [Modelo de Integrações](/admin/handbook/integrations/integration-model):**

Usa a infraestrutura de integração compartilhada (armazenamento de tokens, tabela de webhooks, sync logs) sem models específicos de domínio.

### Integração profunda

**From [Modelo de Integrações](/admin/handbook/integrations/integration-model):**

OAuth + read/write + webhooks de entrada + sincronização de estado + validação de assinatura + deduplicação.

### Integração rasa

**From [Modelo de Integrações](/admin/handbook/integrations/integration-model):**

OAuth + chamadas de API somente-leitura. Sem webhooks de entrada ou sincronização de estado.

### Integração vertical

**From [Modelo de Integrações](/admin/handbook/integrations/integration-model):**

Categoria de integrações que compartilha regras de negócio de domínio que exigem seus próprios models ou invariantes (ex.: Payment).

### Integration

**From [Modelo de Integrações](/admin/handbook/integrations/integration-model):**

Conexão entre o ComeçaAI e um serviço externo específico, identificada por um `slug` (ex.: `recharge`, `gorgias`, `zoom`).

### Integration surface

**From [Pattern: Surface](/admin/handbook/meta/pattern-surface-level):**

External surface fornecida por sistema terceiro que recebe dados nossos (ex: Stripe checkout).

### IntegrationWebhookEvent

**From [Modelo de Integrações](/admin/handbook/integrations/integration-model):**

Payload de webhook de entrada armazenado antes do processamento, habilitando replay e auditoria.

### Internal Surface

**From [Pattern: Surface](/admin/handbook/meta/pattern-surface-level):**

surface dentro da plataforma; requer sessão autenticada.

**From [Pattern: Composição em Três Níveis](/admin/handbook/meta/pattern-three-level-composition):**

surface dentro da plataforma (tab embedded, modal, inline component, cross-area embed).

### Invariante ≥1 owner

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

A regra de que uma organização precisa sempre manter ao menos um owner ativo.

### Journal entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Unidade atômica de movimento financeiro — uma entry agrupa 2+ lines que balanceiam por moeda.

### Journal line

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Componente individual de uma entry — vincula uma account, direção (D/C), amount e currency.

### JSON-RPC

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Protocolo de RPC baseado em JSON usado pelo MCP. Requests têm `{jsonrpc, id, method, params}`; responses têm `{jsonrpc, id, result}` ou `{jsonrpc, id, error}`.

### kebab-case

**From [Pattern: Naming Convention](/admin/handbook/meta/pattern-naming-convention):**

convenção de naming com palavras em lowercase separadas por hyphens (ex: `recognition-tracks`).

### kind

**From [R0 — Manifest Registry Foundation](/admin/handbook/refactor/r0-manifest-registry):**

campo discriminador em `EntityManifest`. Valores: `"block" | "tool" | "top_level_feature"`. Determina shape estrutural e onde o manifest mora fisicamente.

### Knowledge folder

**From [Knowledge](/admin/handbook/areas/identity/knowledge):**

agrupamento transversal por contexto, não por tipo de block.

### llms.txt

**From [llms.txt](/admin/handbook/meta/llms-txt):**

arquivo Markdown em `/llms.txt` que orienta LLMs sobre o produto. Convenção definida em llmstxt.org.

### manage-sets-pattern

**From [Pattern: Manage Types/Sets](/admin/handbook/meta/pattern-manage-types):**

variação para tools cuja terminologia natural é "sets" em vez de "types" (ex: Permissions com "Manage sets").

### manage-types-pattern

**From [Pattern: Manage Types/Sets](/admin/handbook/meta/pattern-manage-types):**

pattern UX para tools que gerenciam templates + instances via header sub-action "Manage types".

### Manifest

**From [Pattern: Tool](/admin/handbook/meta/pattern-tool-level):**

declaração TypeScript que descreve a tool — identidade, paths, capabilities, block family.

### Matriz de permissões

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

O mapa hardcoded `ROLE_PERMISSIONS` de papel → grants recurso×ação; o modelo de acesso declarado.

### MCP

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Model Context Protocol — spec aberta que define como AI assistants consultam recursos externos (tools, resources, prompts) de forma uniforme.

### MemberConnection

**From [Modelo de Integrações](/admin/handbook/integrations/integration-model):**

Registro por-perfil que armazena tokens OAuth para integrações que suportam conexões pessoais.

### Membership

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

Uma linha `OrganizationMember` ligando um profile a uma organização; carrega os papéis do membro.

### Mini-spec

**From [R1.5 — Re-investigation R3-R8 Reclassifications](/admin/handbook/refactor/r1-5-reclassifications-revision):**

entry de Handbook descrevendo escopo e decisões de uma etapa do refator antes da execução. Status `draft` enquanto não executada.

### Modal/Sheet

**From [Pattern: Surface](/admin/handbook/meta/pattern-surface-level):**

surface invocada inline para tarefa pontual.

### Money tuple

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Representação `(amountCents: bigint, currency)` — nunca `number` ou `Decimal` solto.

### natural-language-naming

**From [Pattern: Naming Convention](/admin/handbook/meta/pattern-naming-convention):**

princípio de que tool name deve refletir como o time fala da tool no dia-a-dia.

### Notification area

**From [Notificação](/admin/handbook/areas/notification):**

macro-divisão para tools de comunicação unidirecional sistema → usuário, orientada a eventos.

### O flip

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

Setar `CAN_ENFORCEMENT=enforce` para que as negações do `can()` virem 403 reais; só env e reversível (ver o flip runbook).

### Orchestrator

**From [Chat](/admin/handbook/areas/communication/chat):**

componente do Chat que decide qual ação ou retrieve invocar.

### orchestrator pattern

**From [Pattern: Plan Orchestrator](/admin/handbook/meta/pattern-plan-orchestrator):**

pattern arquitetural onde primitivo agnóstico (Plan) declara regras referenciando outros tools sem armazenar lógica de execução.

### Organization

**From [R2.5 — Network Split (Organization + Directory)](/admin/handbook/refactor/r2-5-network-split):**

top-level feature com estrutura institucional (multimarket, market, company, departments, channels institucionais).

### Origin tracking

**From [Knowledge](/admin/handbook/areas/identity/knowledge):**

trilha de proveniência de cada item.

### Outbox

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

A tabela `domain_events` que guarda eventos entre emissão e entrega. Transacional com a mudança de estado do produtor.

### Package

**From [R3 — Packages Refinement](/admin/handbook/refactor/r3-packages-refinement):**

instância vendável que compõe um ProductGroup + termos comerciais (contrato, billing). Tool em sales.

### Papel (Role)

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

Um conjunto nomeado de acesso (`OWNER`, `ADMIN`, `MEMBER` e três variantes com escopo de departamento), modelado como o enum `MemberRole`.

### Papel com escopo de departamento

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

Um papel ligado a um departamento via `scopeId` (`scopeType = DEPARTMENT`); definido no modelo mas ainda não usado como gate.

### Papel com escopo ORG

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

Um papel que se aplica à organização inteira (`scopeType = ORG`); no V1 cada membro tem exatamente um.

### period

**From [Pattern: Snapshots](/admin/handbook/meta/pattern-snapshots):**

janela temporal explícita do snapshot, com type enum e start_date/end_date.

### period-configurable

**From [Pattern: Snapshots](/admin/handbook/meta/pattern-snapshots):**

capacidade do snapshot acomodar períodos variados (mensal, quinzenal, trimestral, anual, custom).

### plan

**From [Pattern: Plan Orchestrator](/admin/handbook/meta/pattern-plan-orchestrator):**

instance atrelada a um profile, declarando como ele se relaciona com a empresa via references a outras tools.

### plan-instance

**From [Pattern: Plan Orchestrator](/admin/handbook/meta/pattern-plan-orchestrator):**

sinônimo operacional de plan — termo usado quando precisa enfatizar a oposição a plan-type.

### plan-transition

**From [Pattern: Plan Orchestrator](/admin/handbook/meta/pattern-plan-orchestrator):**

registro append-only de migração de profile entre plans, com timestamp, plan anterior, plan novo, e critério atendido.

### plan-type

**From [Pattern: Plan Orchestrator](/admin/handbook/meta/pattern-plan-orchestrator):**

template reutilizável de plan, gerenciado via header sub-action "Manage types".

### plural-naming

**From [Pattern: Naming Convention](/admin/handbook/meta/pattern-naming-convention):**

convenção para tools que gerenciam coleções (Plans, Products, Contracts) e para todos os blocks.

### polymorphic-reference

**From [Pattern: Source Attribution](/admin/handbook/meta/pattern-source-attribution):**

referência composta por (block_uid + id + type) que aponta para tipos diversos de registros.

### PortalSession

**From [Assinaturas](/admin/handbook/blocks/financial/subscriptions):**

URL de curta duração para a UI hospedada de billing do provider.

### position

**From [Pattern: Snapshots](/admin/handbook/meta/pattern-snapshots):**

current rank + histórico congelado por período; específico para tool Ranking.

### postedAt

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Timestamp de chronology da entry; usado para saldos point-in-time e ordenação de extrato (não `createdAt`).

### Posting

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Ação de gravar uma entry no ledger via `postJournalEntry`; único write path autorizado.

### ProductGroup

**From [R3 — Packages Refinement](/admin/handbook/refactor/r3-packages-refinement):**

block-group dentro de products. Subset curado de productIds com metadata leve. Primeiro caso real do pattern block-group.

### Profile

**From [R2.5 — Network Split (Organization + Directory)](/admin/handbook/refactor/r2-5-network-split):**

entry de pessoa no Directory.

### ProfileType

**From [R2.5 — Network Split (Organization + Directory)](/admin/handbook/refactor/r2-5-network-split):**

classificação tipada de profiles (interno vs externo, roles operacionais).

### progress

**From [Pattern: Snapshots](/admin/handbook/meta/pattern-snapshots):**

current state contínuo de progressão (level atual + histórico no track), sem fechamento periódico.

### Promoter

**From [R2.5 — Network Split (Organization + Directory)](/admin/handbook/refactor/r2-5-network-split):**

profile especial — internal promoter (funcionário) vs external promoter (parceiro indicador).

### Public page

**From [Pattern: Surface](/admin/handbook/meta/pattern-surface-level):**

External surface acessível por URL pública sem autenticação corporativa.

### Re-classification

**From [R1.5 — Re-investigation R3-R8 Reclassifications](/admin/handbook/refactor/r1-5-reclassifications-revision):**

mudança de `technical_category` de uma feature existente (ex: block → tool, block → area). Documentada na mini-spec da etapa.

### Record

**From [Pattern: Block](/admin/handbook/meta/pattern-block-level):**

instância concreta dentro de um block — o que o usuário cria/edita/lê.

**From [Pattern: Composição em Três Níveis](/admin/handbook/meta/pattern-three-level-composition):**

instância concreta dentro de um block — o registro que o usuário vê em tela.

### Recurso fantasma

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

Recurso declarado em `ROLE_PERMISSIONS` sem rota `requireOrgRole` onde enforçar; só modelo ("modelo — sem superfície").

### Registry

**From [Pattern: Tool](/admin/handbook/meta/pattern-tool-level):**

tabela central que indexa todos os manifests; o orchestrator consulta o registry.

### Resource

**From [Log de Auditoria](/admin/handbook/tools/infrastructure/audit-log):**

A entidade afetada, identificada por `resource_type` + uma string genérica `resource_id`.

### Reversal

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Compensating entry com direções invertidas que neutraliza o efeito de uma entry original.

### reversal-cascade

**From [Pattern: Source Attribution](/admin/handbook/meta/pattern-source-attribution):**

propagação automática de reversão de um event original para todos os events derivados, via source attribution.

### robots.txt

**From [llms.txt](/admin/handbook/meta/llms-txt):**

análogo histórico — arquivo que orienta search engine crawlers. `llms.txt` segue o mesmo princípio mas para AI assistants.

### Routine

**From [R6 — Routines as Tool](/admin/handbook/refactor/r6-routines-tool):**

sequência reutilizável de steps com triggers configuráveis. Top-level feature.

### RoutineRun

**From [R6 — Routines as Tool](/admin/handbook/refactor/r6-routines-tool):**

instância de execução de uma routine.

### RoutineStatus

**From [R6 — Routines as Tool](/admin/handbook/refactor/r6-routines-tool):**

estados de uma routine (DRAFT, ACTIVE, PAUSED, ARCHIVED).

### RoutineTriggerType

**From [R6 — Routines as Tool](/admin/handbook/refactor/r6-routines-tool):**

tipo de gatilho (MANUAL, SCHEDULE, EVENT).

### search_data / execute_action

**From [Chat](/admin/handbook/areas/communication/chat):**

as duas tools primárias do orquestrador.

### Section

**From [Marketplace](/admin/handbook/areas/transaction/marketplace):**

agrupamento configurável de items dentro do storefront.

### semantic-distinction

**From [Pattern: Naming Convention](/admin/handbook/meta/pattern-naming-convention):**

princípio de diferenciação entre termos similares via contexto (ex: Profile tool singular vs profile-types block plural).

### Shadow mode

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

O `can()` roda ao lado do `requireOrgRole` e loga concordância/divergência (`[can-shadow]`) sem nunca alterar o resultado.

### Single source of truth

**From [Pattern: Block](/admin/handbook/meta/pattern-block-level):**

princípio de que cada tipo de dado tem exatamente um block dono; outros referenciam via FK.

### singular-naming

**From [Pattern: Naming Convention](/admin/handbook/meta/pattern-naming-convention):**

convenção para tools que são sistemas únicos (Chat, Marketplace, Recognition).

### snapshot

**From [Pattern: Snapshots](/admin/handbook/meta/pattern-snapshots):**

foto congelada de estado em ponto no tempo, append-only, com período explícito.

### Source attribution

**From [Pattern: Block](/admin/handbook/meta/pattern-block-level):**

campo polimórfico em events que aponta para o registro de origem (source_block + source_id + source_type).

### Source kind/id

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Referência polimórfica que liga a entry ao evento de negócio que a originou (cobrança, comissão, etc.).

### source-attribution

**From [Pattern: Source Attribution](/admin/handbook/meta/pattern-source-attribution):**

pattern arquitetural onde todo event carrega referência polimórfica ao registro de origem.

### source-block

**From [Pattern: Source Attribution](/admin/handbook/meta/pattern-source-attribution):**

campo do source apontando para o UID do block onde o registro de origem mora.

### source-id

**From [Pattern: Source Attribution](/admin/handbook/meta/pattern-source-attribution):**

campo do source apontando para a FK do registro específico de origem.

### source-type

**From [Pattern: Source Attribution](/admin/handbook/meta/pattern-source-attribution):**

discriminator do tipo de evento dentro do source_block (ex: sale-completed, sale-refunded).

### Standalone Mode

**From [Pattern: Composição em Três Níveis](/admin/handbook/meta/pattern-three-level-composition):**

tool acessada em seu path canônico, com workflow completo.

**From [Pattern: Tool](/admin/handbook/meta/pattern-tool-level):**

tool em seu path canônico com workflow completo.

### Stateless mode

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Modo do Streamable HTTP transport onde nenhum session ID é mantido entre requests; cada request é completamente independente.

### Stdio transport

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Transport MCP onde o servidor é um processo Node lançado pelo cliente; comunicação via stdin/stdout.

### Storefront

**From [Marketplace](/admin/handbook/areas/transaction/marketplace):**

superfície pública do marketplace.

### Streamable HTTP

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Transport MCP via HTTP que suporta tanto SSE quanto request/response direto. Implementado pelo SDK em `WebStandardStreamableHTTPServerTransport`.

### Strict tenant isolation

**From [Log de Auditoria](/admin/handbook/tools/infrastructure/audit-log):**

Uma policy de RLS com apenas `tenant_isolation` (sem `herd_app_full_access` permissivo), rejeitando leituras e escritas cross-tenant na camada do banco.

### Subscription

**From [R5 — Subscriptions Split + Offering Creation](/admin/handbook/refactor/r5-subscriptions-split):**

real record do cliente (quem assina o quê, status, billing). Bloco residual.

### subscription-offering

**From [R5 — Subscriptions Split + Offering Creation](/admin/handbook/refactor/r5-subscriptions-split):**

tool em sales que define + vende tiers. Composta por products + services + agents.

### SubscriptionStatus

**From [R5 — Subscriptions Split + Offering Creation](/admin/handbook/refactor/r5-subscriptions-split):**

estados (ACTIVE, PAUSED, CANCELLED, PAST_DUE, TRIAL).

### SubscriptionTier

**From [R5 — Subscriptions Split + Offering Creation](/admin/handbook/refactor/r5-subscriptions-split):**

offering structure — definição do plano/tier vendável. Owner conceitual é a tool subscription-offering.

### suffix-convention

**From [Pattern: Naming Convention](/admin/handbook/meta/pattern-naming-convention):**

sistema de sufixos canônicos que codificam semântica de blocks (`-events`, `-snapshots`, `-progress`, etc.).

### Sufixo canônico

**From [Pattern: Block](/admin/handbook/meta/pattern-block-level):**

tag no id do block que codifica semântica (`-events`, `-snapshots`, `-progress`, etc.).

### super admin

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

Um ator de nível plataforma (`isSuperAdmin`) que bypassa as checagens de permissão da org, mas nunca a invariante de ≥1 owner.

### Surface

**From [Pattern: Surface](/admin/handbook/meta/pattern-surface-level):**

nível de manifestação — onde dados e funcionalidade aparecem para alguém.

**From [Pattern: Composição em Três Níveis](/admin/handbook/meta/pattern-three-level-composition):**

nível de manifestação — onde dados e funcionalidade aparecem para alguém.

### Tab embedded

**From [Pattern: Surface](/admin/handbook/meta/pattern-surface-level):**

surface interna que aparece como aba dentro de outra tool.

### Tabela `role_permissions`

**From [Papéis e Permissões](/admin/handbook/areas/identity/roles-permissions):**

A matriz global DB-driven que o `can()` lê (via `loadRoleMatrix()`); semeada a partir de `ROLE_PERMISSIONS`, editável pelo super_admin.

### template

**From [Pattern: Manage Types/Sets](/admin/handbook/meta/pattern-manage-types):**

definição reutilizável de uma entidade — molde a partir do qual instâncias são derivadas.

### Tier access

**From [R5 — Subscriptions Split + Offering Creation](/admin/handbook/refactor/r5-subscriptions-split):**

matriz de quais agents/features são acessíveis em cada tier.

### Tool

**From [R1 — Tools Foundation Reconciliation](/admin/handbook/refactor/r1-tools-foundation):**

interface canônica para tool individual em `src/lib/tools/manifest.ts`. 10 campos + `kind: "tool"`. Mora embedded em ToolCategoryManifest.tools.

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Função invocável pelo cliente MCP. Cada tool tem nome, descrição, input schema (JSON Schema) e implementação.

**From [Pattern: Composição em Três Níveis](/admin/handbook/meta/pattern-three-level-composition):**

nível de manipulação rica — UI, regras, registry, manifest. Unidade comercial e operacional do ComeçaAI.

**From [Pattern: Tool](/admin/handbook/meta/pattern-tool-level):**

unidade de manipulação rica — UI, regras, manifest, registry. Unidade comercial do ComeçaAI.

### Tool Category

**From [Pattern: Tool](/admin/handbook/meta/pattern-tool-level):**

agrupamento runtime de tools por afinidade de orquestração (Finances, Legal, Marketing, Sales, Operations, Foundation). Não é tool em si.

### ToolAction

**From [R1 — Tools Foundation Reconciliation](/admin/handbook/refactor/r1-tools-foundation):**

ação exposta por uma tool ao chat orchestrator. Pode orquestrar block actions (`blockActions`) ou ter endpoint próprio (`endpoint`).

### ToolCategoryManifest

**From [R1 — Tools Foundation Reconciliation](/admin/handbook/refactor/r1-tools-foundation):**

interface canônica para agrupamento de tools por área de negócio. `kind: "tool_category"`. Registry: `src/lib/tools/registry.ts`.

### Transaction area

**From [Transação](/admin/handbook/areas/transaction):**

macro-divisão para tools de troca comercial customer-facing.

### Trio

**From [Pattern: Composição em Três Níveis](/admin/handbook/meta/pattern-three-level-composition):**

a composição Tool + Block Family + Surface que define toda capability do ComeçaAI.

### type guard

**From [R0 — Manifest Registry Foundation](/admin/handbook/refactor/r0-manifest-registry):**

função de narrowing TypeScript (`isBlockManifest`, etc.) que confirma o `kind` de um `EntityManifest` em runtime, permitindo o compilador acessar campos kind-specific com segurança.

### Widget

**From [Dashboard](/admin/handbook/areas/workflow/dashboard):**

card individual no dashboard agregando uma métrica.

### Worker

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Processo CLI (`npm run worker:domain-events`) que pega eventos pendentes e despacha para handlers.

### Workflow area

**From [Workflow](/admin/handbook/areas/workflow):**

macro-divisão para tools admin-facing de operação diária.

### xrefmap

**From [Handbook](/admin/handbook/areas/infrastructure/handbook):**

índice gerado de cross-references entre entries.

<!-- END_GENERATED_GLOSSARY -->
