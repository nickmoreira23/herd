---
title: Clientes de Cobrança
description: Espelho local de clientes do provider de pagamento, opcionalmente vinculados a um membro da plataforma via MemberConnection.
locale: pt-BR
uid: herd.block.financial.billing-customers
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entrada. Use `Accept: text/markdown` ou anexe `.md` à URL para evitar renderização HTML.

# Clientes de Cobrança

`BillingCustomer` é o espelho local de um cliente registrado em um provider de pagamento (Recharge, futuramente Stripe etc.). Toda cobrança, assinatura e método de pagamento referencia um `BillingCustomer`. O cliente pode ou não estar vinculado ainda a um membro da plataforma — a FK opcional `memberConnectionId` fecha esse vínculo quando ele é descoberto.

## Business

Um billing customer é "a identidade do comprador no provider". Para Recharge é o cliente Shopify que assinou; para um futuro fluxo Stripe direto seria o objeto Customer do Stripe. A plataforma mantém uma linha-sombra fina (`email`, `name`, `provider_data` raw) para responder "quem pagou?" sem round-trip no provider em cada leitura.

## Product

- Um billing customer por par `(provider_id, external_id)` — unicidade enforcada no DB.
- `memberConnectionId` é nullable: o cliente pode existir antes de estar ligado a um membro (ex: email bateu, mas o handshake OAuth ainda não rolou); o link é setado quando a descoberta resolve.
- Atualizar um cliente é provider-driven: webhooks do provider disparam upserts baseados no external ID.

## Architecture

Tabela tenant-scoped (`tenant_id NOT NULL`, RLS strict policy `billing_customers_tenant_isolation`). Cadeia de FKs:

- `tenant_id` → `organizations(id)` `ON DELETE CASCADE` — encerrar um tenant cascateia para todos os dados de billing.
- `provider_id` → `payment_providers(id)` `ON DELETE RESTRICT` — providers são removidos de forma deliberada; nunca como efeito colateral.
- `member_connection_id` → `member_connections(id)` `ON DELETE SET NULL` — desconectar um membro deixa o registro do cliente intacto (ainda precisamos atribuir cobranças passadas).

`provider_data JSONB` guarda o payload bruto do provider — nunca confiar somente nas colunas normalizadas para replay ou auditoria.

## Operations

- Lookup por external ID do provider: `SELECT * FROM billing_customers WHERE provider_id = ? AND external_id = ?` (coberto pelo unique index).
- Reverse-link a partir de um membro: `SELECT * FROM billing_customers WHERE member_connection_id = ?` (coberto pelo `billing_customers_member_connection_idx`).
- Re-linking após reconciliação manual: atualizar `member_connection_id` direto.

## Glossary

- **Billing customer**: o espelho local de um cliente registrado no provider de pagamento.
- **External ID**: o identificador do cliente no namespace do provider (ex: ID de cliente Recharge).

## Changelog

- **2026-05-19** — Publicação inicial (Sub-etapa 9, Payment Provider Layer).
