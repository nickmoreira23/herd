---
title: Identidade
description: Área de identidade e conhecimento. Tools que gerem quem está no sistema e o que o sistema sabe.
locale: pt-BR
uid: herd.category.areas.identity
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Identidade

Area que agrupa tools de **identidade e conhecimento** — quem está no sistema e o que ele sabe.

## Business

Identity é a fundação cognitiva do produto: directory de pessoas/orgs, base de conhecimento. Sem identidade não há contexto; sem conhecimento não há inteligência.

## Product

Tools desta area aparecem em `/admin/areas` sob "Identidade". Em R2 contém Knowledge e Network.

## Architecture

- **Network**: provisional em R2. Será dividido em Organization + Directory em R2.5.
- **Knowledge**: meta-tool composta de 9 first-class blocks (documents, images, videos, audios, tables, forms, links, feeds, apps).

## Operations

Adicionar tool: registrar em `areaRegistry`, criar entry em `docs/handbook/areas/identity/{tool}/feature.yml`.

## Glossary

- **Identity area**: macro-divisão para tools de quem (Network/Directory) e o que se sabe (Knowledge).

## Changelog

- **2026-05-03 (R2)** — Area criada. Contém Knowledge, Network.
