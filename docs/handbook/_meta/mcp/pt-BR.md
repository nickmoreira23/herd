---
title: Servidor MCP
description: Servidor Model Context Protocol que expõe o Handbook como recurso navegável para AI assistants via stdio (clientes locais) e HTTP (clientes remotos).
locale: pt-BR
uid: herd.meta.mcp
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Servidor MCP

Servidor Model Context Protocol que expõe o Handbook como recurso navegável para AI assistants. Suporta dois transports: **stdio** (para clientes locais como Claude Desktop e Claude Code) e **HTTP** (para clientes remotos como ChatGPT web). Ambos compartilham a mesma lógica de tools (search + fetch) sobre o mesmo `mcp/generated/search-index.json`.

## Business

O servidor MCP existe para que AI assistants consigam responder perguntas sobre o HERD usando documentação canônica em vez de adivinhação ou inferência de código. Quando um assistente é perguntado "como funciona o ledger no HERD?", ele chama `search` para descobrir a entry, depois `fetch` para ler o markdown completo — chega no mesmo conteúdo que um humano vê em `/admin/handbook/...`.

Sem o servidor MCP, cada nova conversa começa do zero: o assistente lê código, infere semântica, e produz respostas plausíveis mas não-canônicas. Com o MCP, o assistente bate em uma fonte versionada (commits do Handbook) e cita o que leu. Isso é particularmente importante para code review automatizado, geração de specs, e onboarding de agentes novos.

## Architecture

### Tools

Duas tools registradas:

- **`search(query)`** — busca lexical no índice. Retorna até 20 resultados rankeados por score (uid=10, id=8, title=5, description=3, body=1) com `{id, title, text, url}`.
- **`fetch(id)`** — retorna conteúdo completo da entry pelo UID, com title/body/url/metadata em ambos os locales.

A lógica de scoring é compartilhada com a busca client-side da UI via `src/lib/handbook/search.ts` — mesma função pura. Mudança em um lado reflete em ambos.

### Transports

#### Stdio (clientes locais)

Entrypoint: `mcp/index.ts`. Roda como processo Node via `npm run mcp:dev` (ou via comando configurado no cliente). Cliente abre o processo, envia JSON-RPC pelo stdin, recebe respostas pelo stdout. Logs em stderr.

Configuração típica para Claude Desktop:

```json
{
  "mcpServers": {
    "herd-docs": {
      "command": "tsx",
      "args": ["/path/to/herd/mcp/index.ts"]
    }
  }
}
```

#### HTTP (clientes remotos)

Endpoint: `POST /api/mcp` (Next.js route handler em `src/app/api/mcp/route.ts`). Cliente envia JSON-RPC no body; servidor responde com Server-Sent Events compatíveis com a spec MCP Streamable HTTP.

Auth: bearer token estático na env `MCP_HTTP_TOKEN`. Sem token configurado, route retorna `503`. Token incorreto → `401`. Token correto → request é processada via `WebStandardStreamableHTTPServerTransport` do SDK.

Modo: stateless (`sessionIdGenerator: undefined`). Cada request é independente; sem state cross-request. Aceitável para o caso atual (cada `tools/call` é self-contained).

CORS: configurado para `https://chatgpt.com` (origin do ChatGPT web). Outros origins precisam de ajuste explícito.

### Geração do índice

`mcp/generated/search-index.json` é gerado por `scripts/build-search-index.ts` (parte de `npm run gen:all`). Contém todas as entries com bodies bilíngues completos. Recarregado em memória pelas tools (cache module-level). Após `git pull` que muda entries, dev server precisa restart para invalidar cache.

### Conexão entre transports

Ambos os transports invocam a mesma função `createServer()` em `mcp/server.ts`, que registra as duas tools. A diferença é só o transport conectado: `StdioServerTransport` vs `WebStandardStreamableHTTPServerTransport`. A função pura `searchEntries` em `src/lib/handbook/search.ts` é compartilhada com a UI client-side via `/admin/api/handbook/search`.

## Operations

### Setup local — stdio

Não requer config adicional. `npm run mcp:dev` sobe o entrypoint stdio. Cliente local (Claude Desktop, Claude Code) configurado com `command: "tsx"` + path absoluto a `mcp/index.ts` conecta direto.

### Setup local — HTTP

1. Gerar token: `openssl rand -hex 32`.
2. Setar variável de ambiente `MCP_HTTP_TOKEN=<token-gerado>` (em `.env.local` ou export direto).
3. `npm run dev` (Next.js dev). Endpoint disponível em `http://localhost:3000/api/mcp`.
4. Smoke test:
   ```bash
   curl -X POST http://localhost:3000/api/mcp \
     -H "Authorization: Bearer $MCP_HTTP_TOKEN" \
     -H "Content-Type: application/json" \
     -H "Accept: application/json, text/event-stream" \
     -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
   ```

Se `MCP_HTTP_TOKEN` não estiver setado, o endpoint retorna `503` ("MCP HTTP not configured") — stdio continua funcionando independentemente.

### Deployment HTTP

A route `/api/mcp` deploya junto com o resto do admin (mesma infra Next.js). `MCP_HTTP_TOKEN` deve estar configurada nas envs do ambiente de produção. CORS hoje permite só `https://chatgpt.com` — outros origins exigem edit em `src/app/api/mcp/route.ts`.

### Debugging

- **Stdio**: logs em stderr aparecem direto no terminal do cliente.
- **HTTP**: logs no console do Next.js dev. Erros JSON-RPC voltam no body (`{result:{isError:true, content:[...]}}`).
- **Cache do índice**: tools cacheiam `search-index.json` em memória (module-level). Após `gen:all` que muda o índice, reiniciar o dev server para invalidar.

### Tests

Cobertura automatizada em `mcp/__tests__/` (vitest, roda junto com `npm test`). Estilo integration: bate no `mcp/generated/search-index.json` real — mesmo input que o servidor em produção. Evita drift fixture↔produção.

- `search.test.ts` (11 cases): empty/whitespace queries, exact match, ordering por field weight, limit, snippet com `<mark>`, URL hierárquico (layer/category/feature, layer-only, meta), bilíngue.
- `fetch.test.ts` (6 cases): UID válido, UID inexistente → erro, URL hierárquico, layer URL, meta URL, metadata bilíngue.
- `server.test.ts` (2 cases): smoke do `createServer()`.

**Não cobertos day-1** (deferred):
- HTTP route handler (requer servidor Next.js rodando durante o test).
- Stdio transport end-to-end (requer spawn de child process).

Comportamento dessas camadas é exercitado via curl manual (HTTP) ou via cliente real conectando (stdio). Quando virar dor, mover para tests.

## Glossary

- **Bearer token**: Esquema de auth onde o cliente envia `Authorization: Bearer <token>` no header. Day-1 do HTTP transport usa token estático configurado via env var.
- **JSON-RPC**: Protocolo de RPC baseado em JSON usado pelo MCP. Requests têm `{jsonrpc, id, method, params}`; responses têm `{jsonrpc, id, result}` ou `{jsonrpc, id, error}`.
- **MCP**: Model Context Protocol — spec aberta que define como AI assistants consultam recursos externos (tools, resources, prompts) de forma uniforme.
- **Stateless mode**: Modo do Streamable HTTP transport onde nenhum session ID é mantido entre requests; cada request é completamente independente.
- **Stdio transport**: Transport MCP onde o servidor é um processo Node lançado pelo cliente; comunicação via stdin/stdout.
- **Streamable HTTP**: Transport MCP via HTTP que suporta tanto SSE quanto request/response direto. Implementado pelo SDK em `WebStandardStreamableHTTPServerTransport`.
- **Tool**: Função invocável pelo cliente MCP. Cada tool tem nome, descrição, input schema (JSON Schema) e implementação.

## Changelog

- **2026-05-02** — Publicação inicial. Architecture perspective preenchida com info do stdio + HTTP transports. Demais perspectives ficam para sub-etapas futuras.
