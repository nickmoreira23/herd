---
title: llms.txt
description: Arquivo público em /llms.txt seguindo a convenção llmstxt.org — orienta LLMs sobre o que o ComeçaAI é, onde encontrar conteúdo canônico, e como acessar programaticamente.
locale: pt-BR
uid: herd.meta.llms-txt
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# llms.txt

Arquivo público em `/llms.txt` seguindo a convenção [llmstxt.org](https://llmstxt.org). Análogo a `robots.txt` (que orienta search engines), mas para LLMs: quando um agente faz fetch de um domain do ComeçaAI, lê `/llms.txt` para descobrir o que é o produto, onde está o Handbook canônico, e como conectar via MCP.

## Business

Quando você compartilha um link do ComeçaAI com um agente de IA (Claude, ChatGPT, Cursor, etc.), o agente tipicamente faz uma exploração inicial: tenta entender o domain. Sem `llms.txt`, ele infere do HTML, sitemap, ou conhecimento prévio. Com `llms.txt`, ele recebe um briefing curto e direcionado: link para Handbook home, lista de layers documentados, ponteiro para o servidor MCP.

Isso aumenta significativamente a chance do agente conseguir trabalhar com o produto sem briefing manual. Para code review automatizado, geração de spec, onboarding de agentes novos, ou simples Q&A sobre o produto, `llms.txt` é a forma mais barata de cravar contexto autoritativo.

## Architecture

### Geração

`scripts/build-llms-txt.ts` lê `mcp/generated/search-index.json` e produz `public/llms.txt`. Determinístico: mesmo input → mesmo output byte-idêntico (mesmo padrão dos outros artefatos gerados como `xrefmap.yml` e `glossary`). Parte do `gen:all`.

Estrutura do arquivo gerado:

1. **Header** `# ComeçaAI` + blockquote com descrição curta + contagem total de entries.
2. **Documentation**: link para Handbook home.
3. **Layers**: 5 layers fixos com title + description em en-US.
4. **Categories**: todas as categories ordenadas por layer (Networks → Solutions → Tools → Blocks → Integrations).
5. **Meta**: entries `level: meta` (handbook, glossary, mcp, llms-txt).
6. **Programmatic access**: ponteiro para a entry MCP Server.

Features individuais (network/solution/tool/block/integration) **não são listadas** — o arquivo cresceria proporcionalmente ao backfill. Agentes interessados em features descobrem via Handbook home ou via MCP search.

### Serving

Não há route handler. Next.js serve `public/llms.txt` automaticamente como arquivo estático em `/llms.txt`. Vantagens: cache de CDN, sem cold start, sem dependência do banco. Trade-off: regen pré-build é necessária — embutida em `gen:all`.

### Locale

Day-1 só inglês (idioma padrão da convenção). Versão pt-BR (`/llms-pt.txt` ou similar) fica para iteração futura se necessário.

## Operations

Regerar manualmente: `npm run gen:llms-txt`. Como parte do pipeline completo: `npm run gen:all`.

Verificar serving local:

```bash
npm run dev
curl http://localhost:3000/llms.txt | head -20
```

Em produção, deploy do Next.js já serve `public/*` diretamente. Não há config adicional necessária.

Cache headers: Next.js padrão para arquivos estáticos em `public/`. Se quiser controle fino, mover para route handler customizado (não cravado day-1 — simplicidade vence).

## Glossary

- **llms.txt**: arquivo Markdown em `/llms.txt` que orienta LLMs sobre o produto. Convenção definida em llmstxt.org.
- **robots.txt**: análogo histórico — arquivo que orienta search engine crawlers. `llms.txt` segue o mesmo princípio mas para AI assistants.

## Changelog

- **2026-05-02** — Publicação inicial. Generator script + serving estático via Next.js public/.
