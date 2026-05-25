---
title: Soluções
description: Camada que organiza pacotes de funcionalidades focados em valor de negócio — por mercado, por departamento, por segmento.
locale: pt-BR
uid: herd.layer.solutions
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Soluções

A camada de Solutions organiza pacotes de funcionalidades por **valor de negócio**, não por natureza técnica. Uma Solution responde "que valor a gente entrega, e para quem?" — para um mercado, para um departamento, para um segmento. Solutions compõem tools, blocks e integrations de toda a estrutura do ComeçaAI em propostas de valor coerentes.

## Business

Uma Solution é a unidade comercial de articulação do ComeçaAI. Quando um cliente diz "preciso de ajuda com aceleração de pipeline de vendas", está descrevendo uma Solution. A Solution pode compor Marketing Tools, Finance Tools e integrations de múltiplas categorias — mas o cliente não se importa com a composição. Ele se importa com o outcome.

Isso distingue Solutions de Tools. Tools são organizadas por **o que elas são** (Marketing Tools, Finance Tools, Legal Tools). Solutions são organizadas por **quem elas atendem e que valor entregam** (Healthcare Solutions, Sales Department Solutions, SMB Solutions). A mesma tool pode participar de múltiplas Solutions; a mesma Solution pode compor tools de múltiplas categories.

<!-- TODO: 2-3 parágrafos sobre framing comercial: como Solutions guiam go-to-market, como customer journey se alinha com categorias de Solution, como pricing tiers podem alinhar com escopo de Solution. -->

## Product

<!-- TODO: Como usuários (sales reps, customer success, prospects) navegam Solutions no admin e em superfícies de marketing. Solution browser, comparison views, ROI calculators por Solution. -->

## Architecture

A camada de Solutions no Handbook organiza documentação hierarquicamente. Categories de Solution são introduzidas lazily — criadas só quando a primeira solution de uma category é documentada. Day-1 a camada de Solutions tem só este overview; categories serão populadas durante a etapa de backfill.

Quando uma nova Solution é documentada, o agente (humano ou IA via skill `/new-feature`) decide a qual category ela pertence. Se o fit mais próximo é uma category que ainda não existe, o agente a cria. Categories emergem do inventário documentado em vez de serem prescritas top-down.

<!-- TODO: 2-3 parágrafos sobre implicações arquiteturais: como uma Solution compõe tools/blocks via cross-references, como métricas a nível de Solution diferem de métricas a nível de feature, como versionamento de Solutions funciona. -->

## Operations

<!-- TODO: Convenções para trabalhar com Solutions: quando introduzir uma nova Solution vs. estender uma existente, como deprecar Solutions, como Solution roadmap se encaixa no product planning. -->

## Glossary

<!-- TODO: Glossário local de termos específicos de Solution (Solution, value proposition, segment, vertical, target market, etc.). -->

## Changelog

- **2026-05-02** — Publicação inicial. Layer overview criado durante Sub-etapa 1.5 da Handbook UI.
