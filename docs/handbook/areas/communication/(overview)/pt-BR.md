---
title: Comunicação
description: Comunicação entre pessoas no sistema. Tools que habilitam conversação, mensageria e interação humano-humano ou humano-agente.
locale: pt-BR
uid: herd.category.areas.communication
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Comunicação

Area que agrupa tools de **comunicação entre pessoas e agentes** dentro do sistema.

## Business

Comunicação é a interface humana primária do produto. Tools desta area habilitam conversação síncrona/assíncrona, mensageria estruturada e interação com agentes de IA. É onde valor é trocado verbalmente.

## Product

Tools desta area aparecem na landing `/admin/areas` agrupadas sob "Comunicação". Em R2, contém apenas Chat — pode crescer para incluir messaging, voice, video.

## Architecture

Area com sortOrder fixo no `areaRegistry` (`src/lib/core/registry.ts`). Tools desta area têm `area: "communication"` em seu manifest.

## Operations

Adicionar tool: registrar em `areaRegistry` se ainda não existir, criar entry handbook em `docs/handbook/areas/communication/{tool}/feature.yml`.

## Glossary

- **Communication area**: macro-divisão para tools de interação humano-humano e humano-agente.

## Changelog

- **2026-05-03 (R2)** — Area criada. Contém Chat.
