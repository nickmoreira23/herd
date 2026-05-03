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

**Última atualização:** 2026-05-02

<!-- BEGIN_GENERATED_GLOSSARY -->

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

### BlockConnection

**From [R1 — Tools Foundation Reconciliation](/admin/handbook/refactor/r1-tools-foundation):**

descriptor `{blockName, usage, purpose}` em Tool.blocks. Indica como uma tool consome dados de um block.

### BlockGroupSpec

**From [R0 — Manifest Registry Foundation](/admin/handbook/refactor/r0-manifest-registry):**

especificação aninhada para grupos de block (ex.: packages como grupo de products). Mora dentro do campo `groups?` do block pai. R3 exercitará isto.

### buildToolActionCatalog

**From [R1 — Tools Foundation Reconciliation](/admin/handbook/refactor/r1-tools-foundation):**

helper em `registry.ts` que materializa o catálogo de actions para o system prompt do orquestrador, achatando categories → tools → actions.

### Compensating entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Entry nova criada para anular o efeito de uma entry anterior; preserva a entry original intacta.

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

### MCP

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Model Context Protocol — spec aberta que define como AI assistants consultam recursos externos (tools, resources, prompts) de forma uniforme.

### Money tuple

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Representação `(amountCents: bigint, currency)` — nunca `number` ou `Decimal` solto.

### Outbox

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

A tabela `domain_events` que guarda eventos entre emissão e entrega. Transacional com a mudança de estado do produtor.

### postedAt

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Timestamp de chronology da entry; usado para saldos point-in-time e ordenação de extrato (não `createdAt`).

### Posting

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Ação de gravar uma entry no ledger via `postJournalEntry`; único write path autorizado.

### Reversal

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Compensating entry com direções invertidas que neutraliza o efeito de uma entry original.

### robots.txt

**From [llms.txt](/admin/handbook/meta/llms-txt):**

análogo histórico — arquivo que orienta search engine crawlers. `llms.txt` segue o mesmo princípio mas para AI assistants.

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

### Worker

**From [Eventos de Domínio](/admin/handbook/tools/infrastructure/domain-events):**

Processo CLI (`npm run worker:domain-events`) que pega eventos pendentes e despacha para handlers.

<!-- END_GENERATED_GLOSSARY -->
