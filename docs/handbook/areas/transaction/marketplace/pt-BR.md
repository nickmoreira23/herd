---
title: Marketplace
description: Storefront público. Compõe products, services, subscriptions e packages em itens vendáveis.
locale: pt-BR
uid: herd.tool.transaction.marketplace
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry.

# Marketplace

Tool de storefront público que compõe múltiplos blocks comerciais em superfícies de venda.

## Business

Marketplace é a vitrine pública. Une products, services, subscriptions e packages em uma única experiência de descoberta e compra. Configura visibilidade, sections, renderer.

## Product

Acessível em `/admin/marketplace`. Admins configuram coleções, visibilidade, ordem; visitantes consomem via storefront público.

## Architecture

Compõe blocks (products, services, subscriptions, packages) sem replicar dados — apenas referencia. Renderer suporta múltiplos layouts.

## Operations

Adicionar item: criar entry no block apropriado e marcá-lo como visível no marketplace via configuração.

## Glossary

- **Storefront**: superfície pública do marketplace.
- **Section**: agrupamento configurável de items dentro do storefront.

## Changelog

- **2026-05-03 (R2)** — Entry handbook criada para Marketplace na area Transaction.
