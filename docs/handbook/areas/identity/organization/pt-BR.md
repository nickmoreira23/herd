---
title: Organization
description: Estrutura institucional — brand kit, departamentos, locais, horários, org chart, e diretório de membros. A visão "empresa como um todo".
locale: pt-BR
uid: herd.tool.identity.organization
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Organization

Tool standalone que concentra a **estrutura institucional** do negócio do usuário: brand kit, departamentos, locais físicos, horários de funcionamento, hierarquia organizacional e diretório de membros. É a visão "empresa como um todo" — opera no nível da entidade, não do indivíduo.

## Business

Organization existe porque toda operação precisa responder, em um lugar canônico, "onde fica a empresa, como ela se chama, como se apresenta, e quem são as pessoas dentro dela". Sem uma tool dedicada, esses metadados ficam pulverizados (logo num lugar, departamentos noutro, horários no terceiro) e divergem com o tempo.

O público primário é o **administrador da plataforma** que configura a empresa pela primeira vez ou ajusta metadados ao longo do tempo. Público secundário são outras tools que **consomem** companies/contacts para suas próprias finalidades (marketplace usa companies metadata em listagens, chat usa member directory para identificar participantes, etc.).

O par natural de Organization é `profileTool` — Organization trata "a empresa", Profile trata "eu como indivíduo dentro dela". Os dois compartilham `area: identity` mas têm escopos distintos.

## Product

Interface acessível em `/admin/organization`. Sub-rotas:

- `/admin/organization/brand-kit` — identidade visual (logos, cores, tipografia)
- `/admin/organization/departments` — departamentos da empresa
- `/admin/organization/users` — diretório de membros
- `/admin/organization/org-chart` — visualização hierárquica
- `/admin/organization/network-map` — mapeamento de relações
- `/admin/organization/profile` — perfil institucional da organização (formulário de identidade)

Blocks consumidos:

- `companies` (read-write) — metadados institucionais, departamentos, locais
- `contacts` (read) — diretório de membros

Não expõe actions ao orquestrador hoje. Manipulação direta via UI.

## Architecture

Tool standalone declarado em `src/lib/tools/tools/organization.tool.ts`. Registrado em `src/lib/tools/registry.ts` no map `standaloneTools` com chave `organization`. Area `identity`. `hasSubRoutes: true`. Ícone `Building2`, cor `#a855f7`.

Componentes em `src/components/organization/`: 14 arquivos cobrindo formulários (brand-kit, business-hours, contact-info, general-info, locations, regional-settings), visualizações (org-chart-canvas, network-map-canvas) e gestão de membros (user-table, user-columns).

`actions: []` — não há orquestração via `execute_action` no momento. Edição é via UI direta.

## Operations

Não há cron, worker, ou pipeline associado a Organization. Mudanças em metadados refletem em outras tools que consomem o block `companies` na próxima leitura.

Quando um tenant é provisionado, Organization é inicializada com defaults (brand kit vazio, sem departamentos) e o administrador preenche progressivamente.

## Glossary

- **Brand kit:** assets de identidade visual (logos, cores, tipografia) configurados centralmente.
- **Org chart:** representação hierárquica de cargos e relações de reporte.
- **Network map:** representação visual de relações entre membros e entidades (departamentos, locais).

## Changelog

- **2026-05-20 (Sub-etapa 3.7):** criado como split de `networkTool` (que foi deletado). Conceito separado de `profile` para distinguir identidade institucional ("a empresa") da pessoal ("eu como indivíduo").
