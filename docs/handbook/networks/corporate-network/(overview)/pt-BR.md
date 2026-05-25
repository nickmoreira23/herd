---
title: Rede Corporativa
description: A network interna de uma empresa — organização, channels, profiles, departamentos, permissões.
locale: pt-BR
uid: herd.category.networks.corporate-network
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Rede Corporativa

A Corporate Network é a representação interna do ComeçaAI de uma empresa específica. Inclui a estrutura organizacional, canais de comunicação interna, profiles de usuários, departamentos e permissões. Toda empresa que usa o ComeçaAI opera dentro da sua própria Corporate Network com isolamento estrito de dados.

## Business

A Corporate Network é a fronteira primária de tenant-isolation do ComeçaAI. Quando um cliente adota o ComeçaAI, o que ele recebe é uma Corporate Network: um espaço privado para a estrutura interna dele, com seus usuários, channels, departamentos e permissões. Nenhum dado cruza fronteiras de Corporate Network exceto por mecanismos explícitos da Market Network.

Esse isolamento importa comercialmente: clientes esperam que dados internos — quem trabalha lá, qual departamento alguém pertence, que permissões tem — sejam só deles. A Corporate Network é o container que garante esse contrato. É também a unidade na qual billing, tickets de suporte e configuração são escopados.

<!-- TODO: 2-3 parágrafos sobre o valor estratégico de Corporate-Network-as-tenant: como onboarding multi-tenant funciona, como customizações são escopadas por Corporate Network, como reporting respeita a fronteira. -->

## Product

<!-- TODO: Como usuários (admins, membros) interagem com superfícies de Corporate Network no admin UI do ComeçaAI. /admin/organization, /admin/network, profile editor, gerenciamento de channels. -->

## Architecture

Features que compõem a Corporate Network — organization profile, departments, profiles (pessoas), channels, permissões — serão documentadas como features individuais dentro desta category conforme a etapa de backfill avança. Hoje, essas features existem como código em `src/app/admin/organization/` e `src/app/admin/network/`, mas suas entries no Handbook estão pendentes.

Cada feature dentro desta category declara `parent: herd.category.networks.corporate-network` no seu `feature.yml`. O Handbook graph validator garante que esse parent existe e é uma category. Formato de UID para features dentro desta category: `herd.{level}.corporate-network.{feature-id}`.

<!-- TODO: 2-3 parágrafos sobre implicações arquiteturais: como políticas RLS impõem tenant isolation na camada de database, como o chat orchestrator escopa queries por Corporate Network, como referências cross-network (ex: da Market Network de volta para Corporate Network) são modeladas. -->

## Operations

<!-- TODO: Convenções para trabalhar com features de Corporate Network: quando estender uma feature existente vs. criar uma nova, como permissões de usuário são em camadas (role + department + custom), como tratar admins de múltiplas Corporate Networks. -->

## Glossary

<!-- TODO: Glossário local de termos específicos de Corporate Network (Corporate Network, tenant, profile, channel, department, permission, role, etc.). -->

## Changelog

- **2026-05-02** — Publicação inicial. Category overview criado durante Sub-etapa 1.5 da Handbook UI.
