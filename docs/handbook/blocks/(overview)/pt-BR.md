---
title: Blocos
description: Camada que organiza blocos de dados por natureza — identidade, mídia, tempo, comercial, financeiro.
locale: pt-BR
uid: herd.layer.blocks
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Blocos

A camada de Blocks é a fundação do ComeçaAI para **primitivos de dados** — entidades que a plataforma rastreia com identidades estáveis e semântica de CRUD. Contacts, Meetings, Deals, Documents, Images: cada um é um Block. Blocks são os primitivos mais consumidos no ComeçaAI; tools e solutions lêem e escrevem em blocks constantemente.

## Business

Um Block é a unidade atômica de *o que o ComeçaAI sabe*. Enquanto Tools executam e Solutions entregam valor, Blocks são *o dado em si*. Toda interação comercial ou cria novas instances de Block (novo Contact, novo Meeting, novo Deal) ou modifica instances existentes (mudanças de lifecycle de Contact, progressão de stage de Deal).

Blocks são categorizados por **natureza de dado** — Identity (contacts, profiles), Media (documents, images, videos), Time (meetings, scheduling), Commercial (deals, pipelines), Financial (invoices, payments). Essa taxonomia organiza o data model de forma que humanos e agentes de IA podem navegar intuitivamente.

<!-- TODO: 2-3 parágrafos sobre o valor estratégico de identidades estáveis de Block, como lifecycle stages em blocks guiam workflows comerciais, como ownership e controle de acesso em block funcionam. -->

## Product

<!-- TODO: Como usuários (vendas, marketing, suporte, admins) interagem com blocks no admin UI do ComeçaAI. Views de list/detail por tipo de block, filtros e segmentação, bulk operations, navegação entre blocks relacionados. -->

## Architecture

A camada de Blocks no Handbook organiza documentação hierarquicamente. Block categories são introduzidas lazily — criadas quando o primeiro block de uma category é documentado. Day-1 a camada de Blocks tem uma category, `miscellaneous`, que abriga blocks (`contacts`, `meetings`) ainda não classificados em sua category final. A category miscellaneous vai diminuir conforme a etapa de backfill avança.

Cada Block no ComeçaAI é dono de um Prisma model e expõe CRUD via endpoints REST. Blocks suportam cross-references via `consumes` e `consumed_by` no Handbook graph: um Meeting consome um Contact (toda reunião deve linkar pelo menos um contact), e um Contact é consumed_by Meetings (referenciado de muitos meetings).

<!-- TODO: 2-3 parágrafos sobre implicações arquiteturais: como schemas de Block são versionados, como políticas RLS são uniformes entre blocks, como block-groups (organização intra-block, ex: contacts.leads) funcionam. -->

## Operations

<!-- TODO: Convenções para trabalhar com Blocks: quando introduzir um novo Block vs. estender um existente com um block-group, estratégias de deduplicação, tratamento GDPR/LGPD por category de block. -->

## Glossary

<!-- TODO: Glossário local de termos específicos de Block (Block, block-group, lifecycle, primary identity, foreign reference, soft delete, etc.). -->

## Changelog

- **2026-05-02** — Publicação inicial. Layer overview criado durante Sub-etapa 1.5 da Handbook UI.
