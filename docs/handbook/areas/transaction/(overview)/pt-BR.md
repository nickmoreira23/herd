---
title: Transação
description: Transações comerciais. Tools customer-facing para vender, comprar e trocar valor.
locale: pt-BR
uid: herd.category.areas.transaction
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Transação

Area que agrupa tools de **transação comercial** — superfícies onde valor é vendido, comprado e trocado.

## Business

Transaction é o "front of house" do produto: storefronts públicos, checkouts, marketplaces. Tools desta area são predominantemente customer-facing.

## Product

Tools desta area aparecem na landing `/admin/areas` agrupadas sob "Transação". Em R2, contém Marketplace — pode crescer para incluir checkout standalone, billing-portal.

## Architecture

Marketplace é o único tool desta area em R2. Compõe blocks de products, services, subscriptions, packages.

## Operations

Adicionar tool: registrar em `areaRegistry` (já existe), criar entry handbook em `docs/handbook/areas/transaction/{tool}/feature.yml`.

## Glossary

- **Transaction area**: macro-divisão para tools de troca comercial customer-facing.

## Changelog

- **2026-05-03 (R2)** — Area criada. Contém Marketplace.
