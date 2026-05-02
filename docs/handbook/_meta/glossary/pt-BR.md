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

### Append-only

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Estratégia de escrita onde registros existentes nunca são modificados ou deletados; correção via novo registro compensatório.

### Audit trail

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Histórico cronológico imutável de todas as mudanças, usado para auditoria e reconstrução de estado.

### Bearer token

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Esquema de auth onde o cliente envia `Authorization: Bearer <token>` no header. Day-1 do HTTP transport usa token estático configurado via env var.

### Compensating entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Entry nova criada para anular o efeito de uma entry anterior; preserva a entry original intacta.

### Double-entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Modelo contábil onde todo movimento é registrado simultaneamente como débito e crédito em contas diferentes, somando zero.

### Idempotency key

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Chave que identifica unicamente uma requisição; permite retry seguro sem efeito duplicado.

### Journal entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Unidade atômica de movimento financeiro — uma entry agrupa 2+ lines que balanceiam por moeda.

### Journal line

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Componente individual de uma entry — vincula uma account, direção (D/C), amount e currency.

### JSON-RPC

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Protocolo de RPC baseado em JSON usado pelo MCP. Requests têm `{jsonrpc, id, method, params}`; responses têm `{jsonrpc, id, result}` ou `{jsonrpc, id, error}`.

### MCP

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Model Context Protocol — spec aberta que define como AI assistants consultam recursos externos (tools, resources, prompts) de forma uniforme.

### Money tuple

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Representação `(amountCents: bigint, currency)` — nunca `number` ou `Decimal` solto.

### postedAt

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Timestamp de chronology da entry; usado para saldos point-in-time e ordenação de extrato (não `createdAt`).

### Posting

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Ação de gravar uma entry no ledger via `postJournalEntry`; único write path autorizado.

### Reversal

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Compensating entry com direções invertidas que neutraliza o efeito de uma entry original.

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

**From [Servidor MCP](/admin/handbook/meta/mcp):**

Função invocável pelo cliente MCP. Cada tool tem nome, descrição, input schema (JSON Schema) e implementação.

<!-- END_GENERATED_GLOSSARY -->
