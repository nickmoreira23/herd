---
title: Dashboard
description: Visão operacional. Agrega métricas-chave de products, subscriptions, partners e snapshots financeiros.
locale: pt-BR
uid: herd.tool.workflow.dashboard
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry.

# Dashboard

Tool de overview operacional. Ponto de entrada principal do admin (`/admin`).

## Business

Dashboard é o "morning coffee" do operador: a primeira tela ao entrar no admin. Resume saúde do produto em métricas-chave acionáveis.

## Product

Acessível em `/admin` (root). Cards agregam métricas de blocks operacionais relevantes.

## Architecture

Composto por widgets que consomem DataProviders dos blocks. Sem dado próprio — agrega views existentes.

## Operations

Adicionar widget: extender configuração do dashboard tool, conectar a DataProvider de block existente.

## Glossary

- **Widget**: card individual no dashboard agregando uma métrica.

## Changelog

- **2026-05-03 (R2)** — Entry handbook criada para Dashboard na area Workflow.
