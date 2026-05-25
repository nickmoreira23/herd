---
title: Pagamento
description: Integrações de pagamento e billing. Providers que processam cobrança recorrente, assinaturas, refunds, dunning.
locale: pt-BR
uid: herd.category.integrations.payment
---

# Pagamento

Categoria que agrupa integrações de billing/pagamento. Providers desta categoria adotam o `PaymentProviderAdapter` (vertical do IntegrationAdapter), com schema canonical em 11 tabelas billing (Sub-etapa 9).

## Business

Toda receita recorrente do ComeçaAI passa por algum payment provider externo. Esta categoria padroniza como esses providers são integrados (manifest, capabilities, webhook events) e mapeados para o schema billing canonical.

## Product

V1 com Recharge como único provider (storefront Bucked Up). Outros providers (Stripe, Recurly, Chargebee) chegam no padrão `payment-provider` quando o produto demandar.

## Architecture

Categoria sob o layer `integrations`. Cada provider implementa `PaymentProviderAdapter`. Webhook ingress → dedup → outbox → handler. Mapper raw → canonical (Sub-etapa 11) normaliza diferenças entre providers (ex: `success` vs `paid` → `ChargeStatus.SUCCESS`).

## Operations

Webhook URLs registradas no dashboard do provider (V1, single-tenant). Multi-tenant subscription via API é tech debt rastreado.

## Glossary

- **Charge:** evento de cobrança no provider (uma tentativa, sucesso ou falha).
- **Subscription:** vínculo recorrente entre customer e plano.
- **Dunning:** sequência de retentativas após falha de cobrança.

## Changelog

- **2026-05-20 (Sub-etapa 10):** categoria criada com Recharge como primeiro provider.
