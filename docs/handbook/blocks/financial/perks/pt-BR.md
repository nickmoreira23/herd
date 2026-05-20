---
title: Perks
description: Catálogo de benefícios oferecidos a membros — internos da própria empresa ou externos via parceiros. Cada perk pode ser configurado por tier de subscription.
locale: pt-BR
uid: herd.block.financial.perks
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Perks

Block que modela o **catálogo de benefícios** oferecidos a membros da plataforma. Um Perk é uma entrada nesse catálogo (ex: "Acesso à academia", "Desconto em livraria") que pode ser **interna** (oferecida pela própria empresa) ou **externa** (via parceiros). Cada perk é configurável por `SubscriptionTier` — o mesmo perk pode estar disponível só no tier "Pro", ou em todos.

## Business

Perks resolvem a necessidade de comunicar "o que vem junto com a assinatura" de forma estruturada, em vez de descrição em texto livre dentro do tier. Sem o block, tier passa a ter um campo `description: string` que vira fonte de drift entre o que está vendido e o que está sendo entregue.

O modelo canonical foi cravado na Sub-etapa 3.5.5: `Perk` é o conceito único; `PartnerBrand` foi dropado e a história externa-vs-interna fica representada por flag/categoria no próprio Perk (não por model paralelo).

## Product

Interface acessível em `/admin/blocks/perks`. Operações: CRUD, bulk, import, export. Cada perk pode receber atribuições por tier via `PerkTierAssignment` (junction N:N entre `Perk` e `SubscriptionTier`).

Sub-options configuráveis: um perk pode permitir ao membro escolher entre variantes (ex: "Escolha entre Spotify ou Apple Music"). Modelado no próprio perk via campos de opções.

Block expõe ações ao orquestrador: `list_perks`, `create_perk`, `update_perk`, `delete_perk`, `bulk_*`, `import_perks`, `export_perks`.

## Architecture

Manifesto em `src/lib/blocks/blocks/perks.block.ts`. Registry: `src/lib/blocks/registry.ts`. Validators: `src/lib/validators/perk.ts`. Models Prisma: `Perk` + `PerkTierAssignment`. Status enum: `PerkStatus` (`ACTIVE`, `DRAFT`, `ARCHIVED`).

Componentes em `src/components/perks/`. Routes em `src/app/admin/blocks/perks/` (UI) + `src/app/api/perks/` (REST). Provider para chat: `src/lib/chat/providers/perk.provider.ts`.

Capabilities declaradas: `read`, `create`, `update`, `delete`, `bulk`, `import`, `export`. Dependencies: `tiers` (via `PerkTierAssignment.subscriptionTierId`).

## Operations

Sem cron ou worker dedicado. Lifecycle gerenciado pelo administrador via UI. Imports em bulk via CSV. Drafts não aparecem em queries de chat até serem promovidos para ACTIVE.

## Glossary

- **Perk:** unidade do catálogo de benefícios (ex: "Acesso à academia").
- **PerkTierAssignment:** junction que liga um perk a um tier de subscription.
- **PerkStatus:** estado do perk (ACTIVE, DRAFT, ARCHIVED) controlando visibilidade.

## Changelog

- **2026-05-20 (Sub-etapa 3.5.5):** consolidado como conceito único. `PartnerBrand` (model paralelo zerado, zero rows) foi dropado; toda a stack de parceiros migrou para Perk se/quando vier um caso real.
- **2026-05-20 (Sub-etapa 3.9):** entry handbook criada como artefato canônico.
