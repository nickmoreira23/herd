---
title: Contatos
description: Single source of truth para pessoas no HERD — leads, clientes, parceiros, funcionários.
locale: pt-BR
uid: herd.block.miscellaneous.contacts
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Contatos

O block de Contatos é o single source of truth do HERD para pessoas. Todo indivíduo que a plataforma rastreia — leads, clientes, parceiros, funcionários — é um Contact, com identidade estável que persiste através de deals, meetings e campanhas. Contatos é o block mais consumido do HERD; quase toda tool lê deste block, e vários blocks (meetings, deals, campaigns) referenciam de volta para cá.

## Business

Saber quem é uma pessoa, com o que ela se importa, e quais touchpoints ela teve com a empresa é a base de qualquer relação comercial. Contatos como single source of truth elimina o silent drift que acontece quando a mesma pessoa existe com atributos ligeiramente diferentes em CRM, ferramenta de email, calendário e inbox de suporte.

<!-- TODO: 2-3 parágrafos sobre valor comercial: implicações de lifecycle, economia de qualificação de lead, insights de retenção. -->

## Product

<!-- TODO: Como usuários (vendas, marketing, suporte) interagem com contatos no admin UI do HERD. List/detail views, filtros, segmentação por estágio de lifecycle, integração com blocks relacionados. -->

## Architecture

O block de Contatos é dono do `Contact` Prisma model e expõe CRUD via endpoints REST em `src/app/api/contacts/`. As superfícies de UI vivem em `src/components/contacts/` e `src/app/admin/blocks/contacts/`. O block manifest em `src/lib/blocks/blocks/contacts.block.ts` declara as capabilities do block para o chat orchestrator do HERD (search via DataProviders, execução de ações).

O block expõe um block-group day-1: `leads`, uma view curada de contatos em estágio inicial de qualificação comercial. Block-groups são intra-block — compartilham o mesmo Prisma model e endpoints CRUD do block pai, com tagging semântico ou filtragem aplicada.

<!-- TODO: 2-3 parágrafos sobre detalhes do schema, índices, políticas RLS, estados de lifecycle, fronteiras de integração com meetings/deals. -->

## Operations

<!-- TODO: Convenções específicas para trabalhar com contatos: regras de validação, estratégia de deduplicação, semântica de merge, como tratar requests de data subject GDPR/LGPD. -->

## Glossary

<!-- TODO: Glossário local de termos específicos de contatos (ex: "lead", "MQL", "SQL", "lifecycle stage"). -->

## Changelog

- **2026-05-01** — Publicação inicial. Block exemplar na etapa Handbook Foundation.
