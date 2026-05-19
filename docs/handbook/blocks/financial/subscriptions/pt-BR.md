---
title: Assinaturas
description: Vínculo ativo entre BillingCustomer e plano. Opcionalmente conectado ao catálogo SubscriptionTier da plataforma.
locale: pt-BR
uid: herd.block.financial.subscriptions
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entrada. Use `Accept: text/markdown` ou anexe `.md` à URL para evitar renderização HTML.

# Assinaturas

`Subscription` representa uma relação de cobrança ativa: um `BillingCustomer` assinando um plano no provider. É a fonte da verdade para "quem tem qual plano, agora". Cada linha opcionalmente liga a uma `SubscriptionTier` da plataforma (quando o plano do provider mapeia para um tier conhecido) e a um `PaymentMethod` (instrumento que será cobrado no próximo ciclo).

## Business

Uma assinatura é "o cliente está nesse plano e esperamos cobrar ele de novo nessa data". O campo `status` captura o ciclo de vida (`active`, `paused`, `cancelled`, `expired`, etc.) e `next_charge_at` é a data operacional usada por dashboards e lógica de dunning. Cancelamento é registrado por `cancelled_at` (timestamp) E mudança de `status` — os dois sinais existem porque dados legados podem perder um deles.

## Product

- `customer_id` é obrigatório: uma assinatura sempre tem comprador.
- `payment_method_id` é nullable: uma assinatura pode perder o método (cartão expirou, cliente removeu) sem ser cancelada.
- `tier_id` é nullable: um plano do provider pode não estar refletido no catálogo da plataforma (oferta off-menu, plano legado, pricing enterprise customizado).
- Conceitos correlatos:
  - **PortalSession** — URL de curta duração entregando o cliente à UI hospedada de billing do provider para gerenciar a assinatura.
  - **BillingEvent** — log de auditoria interno capturando transições de estado nessa assinatura (ex: `subscription.paused`).

## Architecture

Tenant-scoped. Cadeia de FKs:

- `tenant_id` → `organizations(id)` `ON DELETE CASCADE`
- `provider_id` → `payment_providers(id)` `ON DELETE RESTRICT`
- `customer_id` → `billing_customers(id)` `ON DELETE CASCADE` — quando o cliente é removido, a assinatura vai junto.
- `payment_method_id` → `payment_methods(id)` `ON DELETE SET NULL`
- `tier_id` → `SubscriptionTier(id)` `ON DELETE SET NULL`

Indexes em `tenant_id`, `customer_id`, `tier_id`, `status`. UNIQUE `(provider_id, external_id)` força uma linha-espelho por assinatura do provider.

## Operations

- Achar assinaturas ativas de um cliente: `WHERE customer_id = ? AND status = 'active'`.
- Auditar mudança de status: cross-referenciar linhas de `billing_events` com `entity_type = 'subscription'` e `entity_id` da assinatura.
- Re-linkar payment method depois de atualização de cartão: webhook do provider atualiza `payment_methods` primeiro; o `payment_method_id` da assinatura segue em um webhook posterior (sequência provider-driven).

## Glossary

- **Assinatura**: relação de cobrança ativa no provider espelhada localmente.
- **PortalSession**: URL de curta duração para a UI hospedada de billing do provider.
- **BillingEvent**: linha de log de auditoria interno capturando transição de estado.

## Changelog

- **2026-05-19** — Publicação inicial (Sub-etapa 9, Payment Provider Layer).
