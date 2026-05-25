---
title: llms.txt
description: Public file at /llms.txt following the llmstxt.org convention — guides LLMs about what ComeçaAI is, where to find canonical content, and how to access it programmatically.
locale: en-US
uid: herd.meta.llms-txt
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# llms.txt

Public file at `/llms.txt` following the [llmstxt.org](https://llmstxt.org) convention. Analogous to `robots.txt` (which guides search engine crawlers) but for LLMs: when an AI agent fetches a ComeçaAI domain, it reads `/llms.txt` to discover what the product is, where the canonical Handbook lives, and how to connect via MCP.

## Business

When you share a ComeçaAI link with an AI agent (Claude, ChatGPT, Cursor, etc.), the agent typically does an initial discovery pass to understand the domain. Without `llms.txt`, it infers from HTML, sitemap, or prior knowledge. With `llms.txt`, it gets a short, focused briefing: link to the Handbook home, list of documented layers, pointer to the MCP server.

This significantly increases the agent's chance of working with the product without manual briefing. For automated code review, spec generation, onboarding new agents, or plain Q&A about the product, `llms.txt` is the cheapest way to ground authoritative context.

## Architecture

### Generation

`scripts/build-llms-txt.ts` reads `mcp/generated/search-index.json` and produces `public/llms.txt`. Deterministic: same input → byte-identical output (same pattern as other generated artifacts like `xrefmap.yml` and `glossary`). Part of `gen:all`.

Structure of the generated file:

1. **Header** `# ComeçaAI` + blockquote with short description + total entry count.
2. **Documentation**: link to Handbook home.
3. **Layers**: 5 fixed layers with title + en-US description.
4. **Categories**: all categories ordered by layer (Networks → Solutions → Tools → Blocks → Integrations).
5. **Meta**: entries with `level: meta` (handbook, glossary, mcp, llms-txt).
6. **Programmatic access**: pointer to the MCP Server entry.

Individual features (network/solution/tool/block/integration) are **not listed** — the file would grow proportionally to the backfill. Agents interested in features discover them via the Handbook home or via MCP search.

### Serving

There is no route handler. Next.js serves `public/llms.txt` automatically as a static file at `/llms.txt`. Benefits: CDN cache, no cold start, no DB dependency. Trade-off: pre-build regen is needed — wired into `gen:all`.

### Locale

Day-1 English only (the convention's default language). A pt-BR version (`/llms-pt.txt` or similar) is left for a future iteration if needed.

## Operations

Manual regen: `npm run gen:llms-txt`. As part of the full pipeline: `npm run gen:all`.

Local serving check:

```bash
npm run dev
curl http://localhost:3000/llms.txt | head -20
```

In production, the Next.js deployment already serves `public/*` directly. No additional config required.

Cache headers: Next.js defaults for static files in `public/`. For finer control, switch to a custom route handler (not pinned day-1 — simplicity wins).

## Glossary

- **llms.txt**: Markdown file at `/llms.txt` that guides LLMs about the product. Convention defined at llmstxt.org.
- **robots.txt**: Historical analog — a file that guides search engine crawlers. `llms.txt` follows the same principle but for AI assistants.

## Changelog

- **2026-05-02** — Initial publication. Generator script + static serving via Next.js public/.
