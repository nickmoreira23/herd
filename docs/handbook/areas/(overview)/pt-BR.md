---
title: Áreas
description: Camada estrutural de macro-divisões do produto. Cada área agrupa tools por função no produto.
locale: pt-BR
uid: herd.layer.areas
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Áreas

Areas são uma camada estrutural que organiza tools por **função no produto**. Diferente das camadas comerciais (Solutions) ou taxonômicas funcionais (Tools), Areas respondem "em que parte do produto isso vive?" — Comunicação, Transação, Workflow, Notificação, Identidade, Infraestrutura.

## Business

Areas como camada estrutural de macro-divisões do produto. Cada area agrupa tools por função (Communication, Transaction, Workflow, Notification, Identity, Infrastructure). Permitem navegação coerente no `/admin/areas` landing page e organização arquitetural por macro-natureza.

São 6 areas canônicas, definidas em código em `src/lib/core/areas/` e referenciadas no Handbook como categories sob a layer `areas`.

## Product

Usuário pode explorar tools agrupadas por area em `/admin/areas`. A sidebar mantém atalhos featured (frequência de uso); areas oferecem exploração taxonômica complementar ao agrupamento por funcional category.

## Architecture

Hierarquia oficial pós-R2: **Networks → Areas → Tools → Blocks → Integrations**.

- 6 areas canônicas (sortOrder 1-6).
- Cada area é category-level no Handbook, sob a layer `areas`.
- Tool entries dentro de areas espelham a taxonomia de código em `src/lib/tools/tools/{tool}.tool.ts`.
- Schema/code: `src/lib/core/manifest.ts` (`AreaManifest`) + `src/lib/core/registry.ts` (`areaRegistry`).
- Areas substituem o conceito anterior de `top-level-feature` removido em R2.

## Operations

Para criar area nova: rara — só quando macro-divisão nova justifica. Adicionar `*.area.ts` em `src/lib/core/areas/`, registrar em `areaRegistry`, criar entry handbook em `docs/handbook/areas/{name}/(overview)/` (layer Areas) com bilingual md + feature.yml.

Tools dentro de area: criar entry em `docs/handbook/areas/{area}/{tool}/feature.yml` apontando para `parent: herd.category.areas.{area}`.

## Glossary

- **Area**: macro-divisão do produto agrupando tools pela função que exercem (Communication, Transaction, Workflow, Notification, Identity, Infrastructure).
- **AreaManifest**: schema TypeScript em `src/lib/core/manifest.ts` que descreve uma area.
- **areaRegistry**: registry estático em `src/lib/core/registry.ts` que enumera as 6 areas canônicas.
- **getToolsByArea**: helper que retorna as tools registradas em uma dada area.
- **areas-as-Handbook-layer**: convenção R2 — areas viraram a 5ª camada canônica do Handbook (sob `docs/handbook/areas/`).

## Changelog

- **2026-05-03 (R2)** — Camada Areas cravada com 6 areas canônicas. Substitui o conceito antigo de `top-level-feature`.
