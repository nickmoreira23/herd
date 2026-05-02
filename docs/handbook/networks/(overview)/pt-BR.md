---
title: Redes
description: Camada que organiza os diferentes tipos de redes que o HERD suporta — corporativas, de mercado e multi-mercado.
locale: pt-BR
uid: herd.layer.networks
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Redes

A camada de Networks é a organização fundacional do HERD para relações entre entidades. Uma network é um contexto onde atores interagem, trocam recursos e produzem valor. O HERD organiza networks em três escalas: a network interna de uma empresa (Corporate Network), uma network conectando múltiplas empresas (Market Network), e sistemas federados abrangendo múltiplos mercados (Multi-Market Network).

## Business

Networks são a lente primária do HERD para representar como organizações operam. Uma Corporate Network captura como uma empresa organiza sua estrutura interna: pessoas, channels, profiles, departamentos. Uma Market Network representa o ecossistema mais amplo em que a empresa opera: clientes, parceiros, fornecedores. A distinção importa porque problemas de coordenação interna diferem estruturalmente de problemas de interação de mercado.

<!-- TODO: 2-3 parágrafos sobre o valor estratégico de networks-as-organizing-principle, exemplos de decisões que uma empresa toma diferente quando seu CRM/ferramenta de automação entende tipos de network nativamente. -->

## Product

<!-- TODO: Como usuários (admins, vendas, marketing) interagem com networks no admin UI do HERD. Trocar entre views de network, configurar settings específicos por network, analytics de network. -->

## Architecture

A camada de Networks no Handbook organiza documentação hierarquicamente. Cada tipo de network — Corporate Network e Market Network day-1, com Multi-Market Network deferred — tem sua própria category overview que documenta a network como todo. Dentro de cada category de network vivem as features que a compõem: organization e channels para Corporate Network; market e segments para Market Network.

Essa hierarquia de três níveis (Layer → Category → Feature) é uniforme entre todas as cinco layers do Handbook. A hierarquia é validada pelo Handbook graph validator: toda category deve declarar um parent que é uma layer, e toda feature deve declarar um parent que é uma category.

<!-- TODO: 2-3 parágrafos sobre implicações arquiteturais: como isolamento de dados entre networks funciona no database, como o chat orchestrator escopa queries por tipo de network, como concerns multi-tenant diferem entre tipos de network. -->

## Operations

<!-- TODO: Convenções para trabalhar com networks: quando introduzir uma nova category de network vs. uma feature dentro de uma existente, como migrar features entre networks, como features multi-network são tratadas. -->

## Glossary

<!-- TODO: Glossário local de termos específicos de network (Corporate Network, Market Network, federation, network membership, etc.). -->

## Changelog

- **2026-05-02** — Publicação inicial. Layer overview criado durante Sub-etapa 1.5 da Handbook UI.
