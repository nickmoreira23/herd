---
title: Ferramentas
description: Camada que organiza ferramentas por natureza funcional — financeiras, jurídicas, de marketing, de vendas.
locale: pt-BR
uid: herd.layer.tools
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Ferramentas

A camada de Tools organiza ferramentas individuais por **natureza funcional** — que tipo de ferramenta ela é, não o valor que entrega. Uma `email-sequence-tool` pertence a "Marketing Tools" porque ela é, por sua natureza, uma ferramenta de marketing, independentemente da solution que a compõe.

## Business

Tools são as unidades atômicas de execução do HERD. Cada tool faz uma coisa bem: enviar uma sequência de emails, gerar um invoice, validar uma cláusula contratual. Tools são building blocks reutilizáveis que compõem Solutions.

Tools são categorizadas pela sua **natureza técnica/funcional** — Marketing, Finance, Legal, Sales, HR, Operations. Essa taxonomia responde "que tipo de ferramenta é essa?" e ajuda usuários a descobrir tools por domínio de expertise. Contrasta com Solutions, que respondem "que valor isso entrega, e para quem?".

<!-- TODO: 2-3 parágrafos sobre o valor estratégico de organizar tools por natureza: como informa decisões de reuso, como mapeia para ownership interno de times (cada tool category pode ter um domain expert), como conteúdo de onboarding se alinha com tool categories. -->

## Product

<!-- TODO: Como usuários (admins, end-users) descobrem e configuram tools no admin UI do HERD. Tool catalog, category browser, configuration UI por tool. -->

## Architecture

A camada de Tools no Handbook organiza documentação hierarquicamente. Tool categories são introduzidas lazily — criadas só quando a primeira tool de uma category é documentada. Day-1 a camada de Tools tem só este overview; categories serão populadas durante a etapa de backfill.

Quando uma nova Tool é documentada, o agente (humano ou IA via skill `/new-feature`) decide a qual category ela pertence baseado em natureza funcional, não em quais Solutions podem consumi-la. Uma única Tool pode participar de múltiplas Solutions; uma única Solution pode compor Tools de múltiplas categories.

<!-- TODO: 2-3 parágrafos sobre implicações arquiteturais: como composição de Tool em Solutions funciona via cross-references, como Tool versioning é tratado, como métricas de Tool agregam para métricas de Solution. -->

## Operations

<!-- TODO: Convenções para trabalhar com Tools: quando introduzir uma nova Tool category vs. estender uma existente, como deprecar Tools, como Tool ownership mapeia para times de engineering. -->

## Glossary

<!-- TODO: Glossário local de termos específicos de Tool (Tool, functional category, domain expertise, atomicity, composability, etc.). -->

## Changelog

- **2026-05-02** — Publicação inicial. Layer overview criado durante Sub-etapa 1.5 da Handbook UI.
