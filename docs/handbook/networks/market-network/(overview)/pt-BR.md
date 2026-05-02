---
title: Rede de Mercado
description: A network externa que conecta múltiplas empresas no mesmo mercado.
locale: pt-BR
uid: herd.category.networks.market-network
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Rede de Mercado

A Market Network conecta múltiplas empresas que operam no mesmo mercado. É o ecossistema externo onde uma empresa interage com clientes, parceiros, fornecedores e concorrentes. Onde uma Corporate Network é interna e isolada, uma Market Network é compartilhada e emergente — seu valor vem de visibilidade cross-empresa.

## Business

O valor de uma Market Network está em inteligência de mercado: comparativos, benchmarks, descoberta de oportunidades cross-empresa. Duas empresas na mesma Market Network podem — dentro de consentimento explícito — ver dados anonimizados de comparação, identificar clientes em comum, ou descobrir oportunidades de parceria. Nada disso é possível dentro de uma única Corporate Network.

É isso que distingue o HERD de um CRM single-tenant. A Corporate Network sozinha dá a uma empresa organização interna. A Market Network dá à empresa posicionamento dentro de um ecossistema mais amplo. As duas camadas importam, e respondem perguntas diferentes: "como a gente opera?" vs. "onde a gente está?"

<!-- TODO: 2-3 parágrafos sobre o flywheel comercial de Market Networks: como o valor de uma Market Network cresce superlinearmente com membros, como privacy/consent é preservado, como monetização difere de Corporate Network. -->

## Product

<!-- TODO: Como usuários (vendas, liderança) interagem com superfícies de Market Network no admin UI do HERD. Dashboards de mercado, views de segmento, benchmarks de pares, fluxos de opportunity discovery. -->

## Architecture

A Market Network é uma camada acima de Corporate Networks individuais, com modelo federado. Features que vivem dentro de uma Market Network — market em si, segments, benchmarks cross-empresa, identidades federadas — serão documentadas como features individuais dentro desta category conforme a etapa de backfill avança.

Cada feature dentro desta category declara `parent: herd.category.networks.market-network` no seu `feature.yml`. Formato de UID: `herd.{level}.market-network.{feature-id}`. Features cross-network (aquelas que conectam uma Corporate Network a uma Market Network) declaram relacionamentos consumes/consumed_by que atravessam fronteiras de category — um padrão de cross-reference permitido no Handbook graph.

<!-- TODO: 2-3 parágrafos sobre implicações arquiteturais: como compartilhamento de dados entre Corporate Networks é implementado (anonymization, aggregation, opt-in), como federação de identidade funciona, como o estado da Market Network é particionado vs. replicado. -->

## Operations

<!-- TODO: Convenções para trabalhar com features de Market Network: como consentimento é obtido e rastreado, como tratar Corporate Networks que saem de uma Market Network, como governança de Market Network difere de governança de Corporate Network. -->

## Glossary

<!-- TODO: Glossário local de termos específicos de Market Network (Market Network, segment, benchmark, federation, opt-in, anonymization, etc.). -->

## Changelog

- **2026-05-02** — Publicação inicial. Category overview criado durante Sub-etapa 1.5 da Handbook UI.
