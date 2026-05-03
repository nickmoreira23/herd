---
title: Handbook
description: Reader do sistema de documentação. Renderiza entries bilíngues com cross-references e glossário.
locale: pt-BR
uid: herd.tool.infrastructure.handbook
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry.

# Handbook

Tool reader do sistema de documentação. Lê entries de `docs/handbook/` e renderiza em UI navegável.

## Business

Handbook é a fonte da verdade do produto. Reader serve essa verdade aos operadores em UI clara, bilingue (pt-BR / en-US), com cross-refs e diagramas.

## Product

Acessível em `/admin/handbook`. Navegação por hierarquia (layer → category → feature). Glossary global gerada de glossários locais.

## Architecture

Source: `docs/handbook/**/{pt-BR,en-US}.md` + `feature.yml`. Index gerado por `npm run gen:all` (xrefmap, search-index, glossary). Renderer: Mermaid, headings semânticas, locale switch.

## Operations

Adicionar entry: `npm run gen:feature` ou criar `feature.yml` + bilingual md manualmente. Após mudanças: `npm run gen:all` + `npm run validate:handbook`.

## Glossary

- **Entry**: par `feature.yml` + `{pt-BR,en-US}.md` documentando uma feature/category/layer.
- **xrefmap**: índice gerado de cross-references entre entries.

## Changelog

- **2026-05-03 (R2)** — Entry handbook criada para Handbook reader na area Infrastructure. (Distinct de `herd.meta.handbook` que documenta o sistema doc em si.)
