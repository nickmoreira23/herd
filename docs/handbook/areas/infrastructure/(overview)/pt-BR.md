---
title: Infraestrutura
description: Infraestrutura de plataforma sob o capô. Tools que documentam, configuram, ou operam a própria plataforma.
locale: pt-BR
uid: herd.category.areas.infrastructure
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Infraestrutura

Area que agrupa tools de **infraestrutura da plataforma** — documentação, configuração, observabilidade.

## Business

Infrastructure é o "abaixo da linha d'água" do produto: invisível em fluxo normal mas crítico para operação. Handbook, domain-events, ledger (em parte) vivem aqui ou tangenciam.

## Product

Tools desta area aparecem em `/admin/areas` sob "Infraestrutura". Em R2 contém Handbook como entry-point para documentação.

## Architecture

Handbook é o reader bilíngue de entries do `docs/handbook/`. Outras tools de infraestrutura (domain-events, ledger) vivem na layer `tools/` mas mantêm relação semântica com esta area.

## Operations

Adicionar tool: registrar em `areaRegistry`, criar entry em `docs/handbook/areas/infrastructure/{tool}/feature.yml`.

## Glossary

- **Infrastructure area**: macro-divisão para tools de plataforma (docs, observability, config) invisíveis em fluxo de produto normal.

## Changelog

- **2026-05-03 (R2)** — Area criada. Contém Handbook.
