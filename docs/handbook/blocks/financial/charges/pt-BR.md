---
title: Cobranças
description: Eventos de cobrança do provider, dividíveis em múltiplas assinaturas via ChargeLineItem (junction N:N).
locale: pt-BR
uid: herd.block.financial.charges
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entrada. Use `Accept: text/markdown` ou anexe `.md` à URL para evitar renderização HTML.

# Cobranças

`Charge` é um evento único de cobrança no provider: um cliente, um momento, uma quantia. O campo `status` usa o enum canonical `ChargeStatus` (8 valores, normalizados entre providers) para que dashboards não precisem saber que Recharge diz `success` enquanto outro provider pode dizer `paid`. Cobranças que falham alimentam linhas de `DunningAttempt`.

## Business

Uma cobrança é "tentamos cobrar essa quantia nessa data". Para cobranças compostas — um cliente paga por três assinaturas em uma única transação — a linha em `charges` é o pai, e três linhas em `charge_line_items` dividem o valor por assinatura. Essa é a razão central de `ChargeLineItem` existir como N:N (uma cobrança ↔ múltiplas assinaturas).

## Product

- `amount_cents` é `INTEGER` armazenando a menor unidade monetária; nunca use float para dinheiro nesta camada.
- `status` é enum `ChargeStatus`: `QUEUED, PENDING, SUCCESS, FAILED, REFUNDED, PARTIALLY_REFUNDED, SKIPPED, CANCELLED`.
- `processed_at` setado em sucesso; `failed_at` + `failure_reason` setados em falha. Timestamps e status andam juntos para que consumidores possam filtrar por qualquer dimensão.
- Entidades relacionadas:
  - `Invoice` — documento de nota fiscal emitido para a cobrança.
  - `Refund` — reembolso parcial ou total (múltiplos reembolsos por cobrança possíveis).
  - `DunningAttempt` — tentativas de retry em cobrança falha.

### ChargeLineItem (junction N:N)

Quando Recharge cobra um cliente por três assinaturas concorrentes em uma única transação, o formato de wire é **uma cobrança com três line items**. A plataforma espelha:

```
Charge (id=X, amount_cents=12000)
  ├─ ChargeLineItem (charge_id=X, subscription_id=A, amount_cents=4000)
  ├─ ChargeLineItem (charge_id=X, subscription_id=B, amount_cents=5000)
  └─ ChargeLineItem (charge_id=X, subscription_id=C, amount_cents=3000)
```

Sem a junction teríamos que ou (a) duplicar cobranças por assinatura — total errado por cliente — ou (b) perder atribuição por assinatura — receita errada por tier. A junction torna ambos os shapes corretos simultaneamente. UNIQUE `(charge_id, subscription_id)` previne line items duplicados para o mesmo par.

`ChargeLineItem` não tem `external_id` nem `provider_id` próprio — o line item é um split interno, não uma entidade do provider. O line item herda o contexto do provider da cobrança parent.

## Architecture

Tenant-scoped. Cadeia de FKs:

- `tenant_id` → `organizations(id)` `ON DELETE CASCADE`
- `provider_id` → `payment_providers(id)` `ON DELETE RESTRICT`
- `customer_id` → `billing_customers(id)` `ON DELETE CASCADE`
- `payment_method_id` → `payment_methods(id)` `ON DELETE SET NULL`

`ChargeLineItem` cascateia de `charges` e `subscriptions` (deletar qualquer um limpa a junction). Coluna `status` tem index próprio para queries rápidas de "todas as cobranças falhas dessa semana".

Integração com as primitives de Ledger (`Account` / `JournalEntry` / `JournalLine`) é **Camada 3**, fora de escopo intencionalmente. O hook será `JournalEntry.sourceKind = 'charge'` com `sourceId = charges.id`.

## Operations

- Todas as cobranças de um cliente nesse mês: `WHERE customer_id = ? AND processed_at >= ?`.
- Cobranças falhas que precisam de retry: `WHERE status = 'FAILED' AND failed_at < ?`.
- Receita por tier: join `charges` → `charge_line_items` → `subscriptions` e soma `amount_cents` por `subscriptions.tier_id`.
- Contabilidade de reembolsos: soma `refunds.amount_cents WHERE charge_id = ?`; compara com `charges.amount_cents` para detectar `PARTIALLY_REFUNDED` vs `REFUNDED`.

## Glossary

- **Cobrança (Charge)**: evento único de cobrança no provider.
- **ChargeLineItem**: linha que divide uma cobrança composta entre as assinaturas que cobre (junction N:N).
- **DunningAttempt**: retry de uma cobrança falha, rastreado por tentativa com um outcome.

## Changelog

- **2026-05-19** — Publicação inicial (Sub-etapa 9, Payment Provider Layer).
