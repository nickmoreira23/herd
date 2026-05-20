---
title: Profile
description: Perfil pessoal do usuário — identidade, avatar, preferências, locale e configurações de conta. A visão "eu como indivíduo".
locale: pt-BR
uid: herd.tool.identity.profile
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Profile

Tool standalone que cobre a **identidade pessoal** do usuário logado: nome, sobrenome, email, avatar, locale, e preferências de conta. É a visão "eu como indivíduo" — opera no nível da pessoa, não da empresa.

## Business

Profile resolve a necessidade básica de cada usuário ter um lugar canônico para sua identidade. Sem isso, dados pessoais ficam escondidos em sub-rotas opacas de "Settings" ou misturados com configurações da organização (que pertencem ao `organizationTool`, não a Profile).

O público é o **usuário individual** — primeiro acesso (preencher dados básicos), atualizações ao longo do tempo (foto, locale, preferências) e gestão de credenciais. Não é uma tool administrativa; cada usuário só vê seu próprio Profile.

O par natural de Profile é `organizationTool` — Profile trata "eu como indivíduo", Organization trata "a empresa onde estou". Ambos compartilham `area: identity` mas resolvem necessidades distintas.

## Product

Interface acessível em `/admin/profile`. Página única hoje (sem sub-rotas) — `hasSubRoutes: false` no manifesto. Quando preferências e settings ganharem volume, sub-rotas serão adicionadas.

Blocks consumidos:

- `contacts` (read-write) — persiste o registro `NetworkProfile` do próprio usuário

Não expõe actions ao orquestrador. Edição é via formulário próprio (`profile-client.tsx`).

## Architecture

Tool standalone declarado em `src/lib/tools/tools/profile.tool.ts`. Registrado em `src/lib/tools/registry.ts` no map `standaloneTools` com chave `profile`. Area `identity`. `hasSubRoutes: false`. Ícone `User`, cor `#06b6d4` (cyan, distingue do roxo de Organization).

Componente único hoje: `src/components/profile/profile-client.tsx`. A página `src/app/admin/profile/page.tsx` é um RSC que carrega a `NetworkProfile` do usuário autenticado e passa para o cliente.

`actions: []` — sem orquestração via `execute_action`.

## Operations

Sem cron, worker ou pipeline. Mudanças em Profile escrevem direto em `NetworkProfile` via API tradicional. A persistência de locale é dupla (cookie + DB) — ver seção "Locale persistence" em `AGENTS.md`.

## Glossary

- **NetworkProfile:** model Prisma que representa um usuário no sistema. Em Camada 1, há uma `NetworkProfile : Organization` 1:1.
- **Avatar:** imagem de perfil, armazenada em `NetworkProfile.avatarUrl`.

## Changelog

- **2026-05-20 (Sub-etapa 3.7):** criado como split de `networkTool` (que foi deletado). Conceito separado de `organization` para distinguir identidade pessoal da institucional.
