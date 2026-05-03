---
title: Notificação
description: Centro de notificações. Centraliza alertas, lembretes e comunicações orientadas a eventos.
locale: pt-BR
uid: herd.category.areas.notification
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Notificação

Area que agrupa **tools de notificação** — alertas, lembretes, comunicações orientadas a evento.

## Business

Notification é o canal de saída orientado a evento do sistema. Diferente de Communication (conversação bidirecional) ou Workflow (operação interna), Notification é unidirecional sistema → usuário.

## Product

Em R2 esta area é placeholder — sem tools cravadas ainda. Aparecerá em `/admin/areas` mas vazia até que primeira notification tool seja introduzida.

## Architecture

Sem tools em R2. Quando primeira tool de notification existir (ex: alerts-center, digest-builder), será registrada em `areaRegistry` e ganhará entry handbook aqui.

## Operations

Para introduzir primeira tool: criar manifest, registrar em `areaRegistry` (já reserva área), criar entry handbook em `docs/handbook/areas/notification/{tool}/feature.yml`.

## Glossary

- **Notification area**: macro-divisão para tools de comunicação unidirecional sistema → usuário, orientada a eventos.

## Changelog

- **2026-05-03 (R2)** — Area criada como placeholder. Sem tools em R2.
