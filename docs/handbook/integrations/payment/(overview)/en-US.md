---
title: Payment
description: Payment and billing integrations. Providers that handle recurring billing, subscriptions, refunds, dunning.
locale: en-US
uid: herd.category.integrations.payment
---

# Payment

Category grouping billing / payment integrations. Providers in this category adopt the `PaymentProviderAdapter` (a vertical of `IntegrationAdapter`), with the canonical schema in the 11 billing tables (Sub-etapa 9).

## Business

All recurring ComeçaAI revenue flows through an external payment provider. This category standardizes how providers are integrated (manifest, capabilities, webhook events) and mapped into the canonical billing schema.

## Product

V1 with Recharge as the single provider (Bucked Up storefront). Other providers (Stripe, Recurly, Chargebee) land in the `payment-provider` pattern when the product demands.

## Architecture

Category under the `integrations` layer. Each provider implements `PaymentProviderAdapter`. Webhook ingress → dedup → outbox → handler. Raw → canonical mapper (Sub-etapa 11) normalizes provider differences (e.g. `success` vs `paid` → `ChargeStatus.SUCCESS`).

## Operations

Webhook URLs registered in the provider's dashboard (V1, single-tenant). Multi-tenant subscription via API is tracked tech debt.

## Glossary

- **Charge:** billing event in the provider (one attempt, success or failure).
- **Subscription:** recurring link between customer and plan.
- **Dunning:** retry sequence after a billing failure.

## Changelog

- **2026-05-20 (Sub-etapa 10):** category created with Recharge as the first provider.
