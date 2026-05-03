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

**Última atualização:** 2026-05-03

<!-- BEGIN_GENERATED_GLOSSARY -->

### Agent

**From [R7 — Agents as Top-Level Feature (consolidate dual surface)](/admin/handbook/refactor/r7-agents-feature):**

AI assistant configurável. Top-level feature pós-R7.

### AgentKnowledgeItem

**From [R7 — Agents as Top-Level Feature (consolidate dual surface)](/admin/handbook/refactor/r7-agents-feature):**

item de conhecimento associado ao agent (rename de KnowledgeApp).

### AgentRole

**From [R7 — Agents as Top-Level Feature (consolidate dual surface)](/admin/handbook/refactor/r7-agents-feature):**

papel funcional do agent (orchestrator, specialist).

### AgentSkill

**From [R7 — Agents as Top-Level Feature (consolidate dual surface)](/admin/handbook/refactor/r7-agents-feature):**

capacidade declarada do agent (resolução de problemas específicos).

### AgentStatus

**From [R7 — Agents as Top-Level Feature (consolidate dual surface)](/admin/handbook/refactor/r7-agents-feature):**

estados (ACTIVE, INACTIVE, ARCHIVED).

### AgentTierAccess

**From [R7 — Agents as Top-Level Feature (consolidate dual surface)](/admin/handbook/refactor/r7-agents-feature):**

matriz de acesso de agents por tier de subscription.

### AgentTool

**From [R7 — Agents as Top-Level Feature (consolidate dual surface)](/admin/handbook/refactor/r7-agents-feature):**

ferramenta exposta ao agent (tool da plataforma que o agent pode invocar).

### Aggregate

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Entidade de domínio sobre a qual um evento é. Identificada por `aggregateType` + `aggregateId` (UUID).

### Append-only

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Estratégia de escrita onde registros existentes nunca são modificados ou deletados; correção via novo registro compensatório.

### Audit trail

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Histórico cronológico imutável de todas as mudanças, usado para auditoria e reconstrução de estado.

### Bearer token

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Esquema de auth onde o cliente envia `Authorization: Bearer <token>` no header. Day-1 do HTTP transport usa token estático configurado via env var.

### BillingCycle

**From [R5 — Subscriptions Split + Offering Creation](/admin/handbook/refactor/r5-subscriptions-split):**

ciclo de cobrança (monthly, annual, etc.). Atributo da subscription real.

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

### Compensating entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Entry nova criada para anular o efeito de uma entry anterior; preserva a entry original intacta.

### Composer

**From [R8 — Marketplace as Top-Level Feature](/admin/handbook/refactor/r8-marketplace-feature):**

UI de admin que monta a estrutura do marketplace (sections, layout, visibility).

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

### EntityManifest

**From [R0 — Manifest Registry Foundation](/admin/handbook/refactor/r0-manifest-registry):**

união discriminada de `BlockManifest | ToolManifest | FeatureManifest`. Substitui o `BlockManifest` monolítico pré-R0.

### Exhaustion

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Estado após 5 tentativas falhas. `nextAttemptAt = NULL`, auto-retry para, intervenção manual necessária.

### Handler

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Função que reage a um evento de um dado `eventType`. Registrada estaticamente. Deve ser idempotente.

### Idempotency key

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Chave que identifica unicamente uma requisição; permite retry seguro sem efeito duplicado.

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Chave única opcional na emissão. Emit repetido com a mesma chave retorna o evento existente se payload match, lança se divergir.

### Journal entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Unidade atômica de movimento financeiro — uma entry agrupa 2+ lines que balanceiam por moeda.

### Journal line

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Componente individual de uma entry — vincula uma account, direção (D/C), amount e currency.

### JSON-RPC

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Protocolo de RPC baseado em JSON usado pelo MCP. Requests têm `{jsonrpc, id, method, params}`; responses têm `{jsonrpc, id, result}` ou `{jsonrpc, id, error}`.

### kind

**From [R0 — Manifest Registry Foundation](/admin/handbook/refactor/r0-manifest-registry):**

campo discriminador em `EntityManifest`. Valores: `"block" | "tool" | "top_level_feature"`. Determina shape estrutural e onde o manifest mora fisicamente.

### llms.txt

**From [llms.txt](/admin/handbook/meta/llms-txt):**

arquivo Markdown em `/llms.txt` que orienta LLMs sobre o produto. Convenção definida em llmstxt.org.

### Marketplace

**From [R8 — Marketplace as Top-Level Feature](/admin/handbook/refactor/r8-marketplace-feature):**

top-level feature de infraestrutura para expor conteúdo (items) em surfaces configuráveis (sections + composer).

### MarketplaceItem

**From [R8 — Marketplace as Top-Level Feature](/admin/handbook/refactor/r8-marketplace-feature):**

item exibível no marketplace (produto, serviço, plano, evento, etc. — vem de qualquer block).

### MarketplaceSection

**From [R8 — Marketplace as Top-Level Feature](/admin/handbook/refactor/r8-marketplace-feature):**

seção configurável que agrupa items por critério (block + filters + ordering).

### MCP

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Model Context Protocol — spec aberta que define como AI assistants consultam recursos externos (tools, resources, prompts) de forma uniforme.

### Mini-spec

**From [R1.5 — Re-investigation R3-R8 Reclassifications](/admin/handbook/refactor/r1-5-reclassifications-revision):**

entry de Handbook descrevendo escopo e decisões de uma etapa do refator antes da execução. Status `draft` enquanto não executada.

### Money tuple

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Representação `(amountCents: bigint, currency)` — nunca `number` ou `Decimal` solto.

### Organization

**From [R2.5 — Network Split (Organization + Directory)](/admin/handbook/refactor/r2-5-network-split):**

top-level feature com estrutura institucional (multimarket, market, company, departments, channels institucionais).

### Outbox

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

A tabela `domain_events` que guarda eventos entre emissão e entrega. Transacional com a mudança de estado do produtor.

### Package

**From [R3 — Packages Refinement](/admin/handbook/refactor/r3-packages-refinement):**

instância vendável que compõe um ProductGroup + termos comerciais (contrato, billing). Tool em sales.

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

### Promoter

**From [R2.5 — Network Split (Organization + Directory)](/admin/handbook/refactor/r2-5-network-split):**

profile especial — internal promoter (funcionário) vs external promoter (parceiro indicador).

### Re-classification

**From [R1.5 — Re-investigation R3-R8 Reclassifications](/admin/handbook/refactor/r1-5-reclassifications-revision):**

mudança de `technical_category` de uma feature existente (ex: block → tool, block → top-level-feature). Documentada na mini-spec da etapa.

### Renderer

**From [R8 — Marketplace as Top-Level Feature](/admin/handbook/refactor/r8-marketplace-feature):**

pipeline que transforma a configuração do composer em UI pública.

### Reversal

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Compensating entry com direções invertidas que neutraliza o efeito de uma entry original.

### robots.txt

**From [llms.txt](/admin/handbook/meta/llms-txt):**

análogo histórico — arquivo que orienta search engine crawlers. `llms.txt` segue o mesmo princípio mas para AI assistants.

### Routine

**From [R6 — Routines as Top-Level Feature](/admin/handbook/refactor/r6-routines-feature):**

sequência reutilizável de steps com triggers configuráveis. Top-level feature.

### RoutineRun

**From [R6 — Routines as Top-Level Feature](/admin/handbook/refactor/r6-routines-feature):**

instância de execução de uma routine.

### RoutineStatus

**From [R6 — Routines as Top-Level Feature](/admin/handbook/refactor/r6-routines-feature):**

estados de uma routine (DRAFT, ACTIVE, PAUSED, ARCHIVED).

### RoutineTriggerType

**From [R6 — Routines as Top-Level Feature](/admin/handbook/refactor/r6-routines-feature):**

tipo de gatilho (MANUAL, SCHEDULE, EVENT).

### Section blocks

**From [R8 — Marketplace as Top-Level Feature](/admin/handbook/refactor/r8-marketplace-feature):**

blocks referenciados por uma section como fonte de items.

### Source kind/id

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Referência polimórfica que liga a entry ao evento de negócio que a originou (cobrança, comissão, etc.).

### Stateless mode

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Modo do Streamable HTTP transport onde nenhum session ID é mantido entre requests; cada request é completamente independente.

### Stdio transport

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Transport MCP onde o servidor é um processo Node lançado pelo cliente; comunicação via stdin/stdout.

### Streamable HTTP

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Transport MCP via HTTP que suporta tanto SSE quanto request/response direto. Implementado pelo SDK em `WebStandardStreamableHTTPServerTransport`.

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

### Tier access

**From [R5 — Subscriptions Split + Offering Creation](/admin/handbook/refactor/r5-subscriptions-split):**

matriz de quais agents/features são acessíveis em cada tier.

### Tool

**From [R1 — Tools Foundation Reconciliation](/admin/handbook/refactor/r1-tools-foundation):**

interface canônica para tool individual em `src/lib/tools/manifest.ts`. 10 campos + `kind: "tool"`. Mora embedded em ToolCategoryManifest.tools.

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Função invocável pelo cliente MCP. Cada tool tem nome, descrição, input schema (JSON Schema) e implementação.

### ToolAction

**From [R1 — Tools Foundation Reconciliation](/admin/handbook/refactor/r1-tools-foundation):**

ação exposta por uma tool ao chat orchestrator. Pode orquestrar block actions (`blockActions`) ou ter endpoint próprio (`endpoint`).

### ToolCategoryManifest

**From [R1 — Tools Foundation Reconciliation](/admin/handbook/refactor/r1-tools-foundation):**

interface canônica para agrupamento de tools por área de negócio. `kind: "tool_category"`. Registry: `src/lib/tools/registry.ts`.

### type guard

**From [R0 — Manifest Registry Foundation](/admin/handbook/refactor/r0-manifest-registry):**

função de narrowing TypeScript (`isBlockManifest`, etc.) que confirma o `kind` de um `EntityManifest` em runtime, permitindo o compilador acessar campos kind-specific com segurança.

### Visibility

**From [R8 — Marketplace as Top-Level Feature](/admin/handbook/refactor/r8-marketplace-feature):**

controle de quem vê o quê (PUBLIC, PRIVATE, MEMBERS_ONLY).

### Worker

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Processo CLI (`npm run worker:domain-events`) que pega eventos pendentes e despacha para handlers.

<!-- END_GENERATED_GLOSSARY -->
