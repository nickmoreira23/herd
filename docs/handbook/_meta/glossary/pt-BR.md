---
title: Glossário
description: >-
  Glossário global agregado dos termos definidos em todas as entries do
  Handbook.
locale: pt-BR
uid: herd.meta.glossary
---
# Glossário

Glossário global agregado a partir das seções `## Glossary` de todas as entries do Handbook. Gerado automaticamente por `npm run gen:glossary`.

**Última atualização:** 2026-05-02

<!-- BEGIN_GENERATED_GLOSSARY -->

### Append-only

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Estratégia de escrita onde registros existentes nunca são modificados ou deletados; correção via novo registro compensatório.

### Audit trail

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Histórico cronológico imutável de todas as mudanças, usado para auditoria e reconstrução de estado.

### Compensating entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Entry nova criada para anular o efeito de uma entry anterior; preserva a entry original intacta.

### Double-entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Modelo contábil onde todo movimento é registrado simultaneamente como débito e crédito em contas diferentes, somando zero.

### Idempotency key

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Chave que identifica unicamente uma requisição; permite retry seguro sem efeito duplicado.

### Journal entry

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Unidade atômica de movimento financeiro — uma entry agrupa 2+ lines que balanceiam por moeda.

### Journal line

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Componente individual de uma entry — vincula uma account, direção (D/C), amount e currency.

### Money tuple

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Representação `(amountCents: bigint, currency)` — nunca `number` ou `Decimal` solto.

### postedAt

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Timestamp de chronology da entry; usado para saldos point-in-time e ordenação de extrato (não `createdAt`).

### Posting

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Ação de gravar uma entry no ledger via `postJournalEntry`; único write path autorizado.

### Reversal

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Compensating entry com direções invertidas que neutraliza o efeito de uma entry original.

### Source kind/id

**From [Ledger](/admin/handbook/tools/financial/ledger):**

Referência polimórfica que liga a entry ao evento de negócio que a originou (cobrança, comissão, etc.).

<!-- END_GENERATED_GLOSSARY -->
