---
title: Reuniões
description: Reuniões de cliente — discovery, demos, suporte. Sincroniza com calendários externos.
locale: pt-BR
uid: herd.block.miscellaneous.meetings
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Reuniões

O block de Reuniões representa interações de cliente em um calendário — sales calls, sessões de suporte, syncs internos. Cada reunião referencia um ou mais Contacts, opcionalmente um Deal, e sincroniza com provedores de calendário externos (Google, Microsoft, etc.) através da camada de integrations. Reuniões são o artefato mais comum vinculado a tempo no fluxo comercial do ComeçaAI.

## Business

Reuniões são onde relações comerciais avançam. Todo deal que fecha passa por reuniões; todo cliente que churna tem histórico de reuniões que pode ser analisado. Rastrear reuniões dentro do ComeçaAI — em vez de apenas nas ferramentas de calendário — mantém a relação com o cliente coerente entre sistemas e acessível para agents (sales reps, orchestrator de IA) sem context-switching.

<!-- TODO: 2-3 parágrafos sobre signal comercial: frequência de reuniões como indicador de saúde, time-to-first-meeting como métrica de funil, outcomes de reunião como preditor de deal. -->

## Product

<!-- TODO: Como usuários agendam, conduzem, documentam reuniões dentro do ComeçaAI. Calendar view, meeting detail, vinculação de contact, captura de notas, automação de follow-up. -->

## Architecture

O block de Reuniões é dono do `Meeting` Prisma model e expõe CRUD via endpoints REST em `src/app/api/meetings/`. As superfícies de UI vivem em `src/components/meetings/` e `src/app/admin/blocks/meetings/`. O block manifest em `src/lib/blocks/blocks/meetings.block.ts` declara capabilities para o chat orchestrator.

Meetings consomem contacts (toda reunião precisa referenciar pelo menos um contact) e consomem `google-calendar` para sincronização com o Google Calendar (outras integrations de calendário seguem o mesmo pattern). A integration `google-calendar` é documentada separadamente como entry de `level: integration`; hoje seu `feature.yml` ainda não existe, então a cross-reference está registrada no strangler-fig allowlist (`docs/handbook/_meta/.legacy-allowlist.txt`).

O block expõe um block-group day-1: `discovery-calls`, uma view curada de reuniões marcadas como primeira conversa com prospect.

<!-- TODO: 2-3 parágrafos sobre detalhes do schema, semântica de sync de calendário, resolução de conflitos quando calendário e ComeçaAI divergem, tratamento de recorrência. -->

## Operations

<!-- TODO: Convenções para trabalhar com reuniões: tratamento de timezone, edge cases de sync de calendário, como reuniões interagem com a lógica de agendamento do chat orchestrator. -->

## Glossary

<!-- TODO: Glossário local de termos específicos de reuniões (ex: "discovery call", "demo", "QBR", "no-show"). -->

## Changelog

- **2026-05-01** — Publicação inicial. Block exemplar na etapa Handbook Foundation. Demonstra strangler-fig allowlist via dangling reference para a integration `google-calendar`.
