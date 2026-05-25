---
title: Integrações
description: Camada que organiza integrações com sistemas externos por finalidade — pagamento, calendário, comunicação.
locale: pt-BR
uid: herd.layer.integrations
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Integrações

A camada de Integrations conecta o ComeçaAI a sistemas externos. Stripe processa pagamentos. Google Calendar sincroniza meetings. Slack entrega notificações. Cada integration é uma ponte entre o model interno do ComeçaAI e um serviço de terceiro que já faz algo bem.

## Business

Integrations são o reconhecimento do ComeçaAI de que a empresa não opera no vácuo. Clientes já pagam via Stripe ou Recharge; calendários já vivem no Google ou Outlook; comunicação já acontece em Slack ou email. Em vez de reconstruir o que essas ferramentas fazem, o ComeçaAI se integra com elas para que usuários não precisem context-switch.

Integrations são categorizadas por **finalidade** — Payment, Calendar, Communication, Authentication, Storage. Essa taxonomia reflete o que a integration habilita, não o vendor específico. Dentro de "Payment Integrations" vivem Stripe, Recharge e outras — cada uma intercambiável de uma perspectiva de category, com trade-offs diferentes.

<!-- TODO: 2-3 parágrafos sobre o valor estratégico de múltiplas integrations por category (optionalidade de vendor, redundância), o custo arquitetural de cada nova integration, o trade-off entre integration profunda vs. rasa. -->

## Product

<!-- TODO: Como usuários (admins) descobrem, habilitam e configuram integrations no admin UI do ComeçaAI. Integration catalog, OAuth flows, configuração por vendor, status monitoring. -->

## Architecture

A camada de Integrations no Handbook organiza documentação hierarquicamente. Integration categories são introduzidas lazily — criadas quando a primeira integration de uma category é documentada. Day-1 a camada de Integrations tem só este overview; categories serão populadas durante a etapa de backfill.

Integrations interagem com o resto do ComeçaAI via o graph de cross-references: um Block (como Meetings) consome uma category de integration (como Calendar Integrations) sem se comprometer com um vendor específico. A binding real do vendor acontece na camada de configuração.

<!-- TODO: 2-3 parágrafos sobre implicações arquiteturais: como OAuth tokens são gerenciados, como rate limits por integration são tratados, como falhas de integration degradam gracefully, como dados fluindo através de uma integration são logados. -->

## Operations

<!-- TODO: Convenções para trabalhar com Integrations: quando introduzir uma nova integration vs. estender uma existente, como tratar vendor deprecations, como migrar usuários entre integrations da mesma category. -->

## Glossary

<!-- TODO: Glossário local de termos específicos de Integration (Integration, vendor, OAuth, webhook, rate limit, scope, etc.). -->

## Changelog

- **2026-05-02** — Publicação inicial. Layer overview criado durante Sub-etapa 1.5 da Handbook UI.
