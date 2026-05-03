---
title: Workflow
description: Centro de workflow operacional. Tools internas para gerir trabalho do dia-a-dia.
locale: pt-BR
uid: herd.category.areas.workflow
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Workflow

Area que agrupa o **centro operacional do produto** — tools internas para gerir trabalho diário em finanças, vendas, jurídico, milestones, dashboards.

## Business

Workflow é o "back of house": onde a equipe interna opera o produto. Não é customer-facing — é admin-facing. Aqui vivem dashboards, ops de finanças, ops de vendas, ops jurídicas.

## Product

Tools desta area aparecem em `/admin/areas` sob "Workflow". Em R2 contém Dashboard como ponto de entrada operacional unificado.

## Architecture

Dashboard agrega métricas-chave de blocks operacionais (products, subscriptions, partners, snapshots financeiros). Tools financial (ledger), sales-ops, legal-ops vivem na layer `tools/` mas seu ponto de entrada operacional é Workflow.

## Operations

Adicionar tool: registrar em `areaRegistry`, criar entry handbook em `docs/handbook/areas/workflow/{tool}/feature.yml`.

## Glossary

- **Workflow area**: macro-divisão para tools admin-facing de operação diária.

## Changelog

- **2026-05-03 (R2)** — Area criada. Contém Dashboard.
