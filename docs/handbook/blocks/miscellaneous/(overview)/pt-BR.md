---
title: Diversos
description: Blocks que ainda não foram classificados em uma category específica — acomodação temporária, débito a resolver durante o backfill.
locale: pt-BR
uid: herd.category.blocks.miscellaneous
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry. Use `Accept: text/markdown` ou adicione `.md` à URL para evitar renderização HTML.

# Diversos

A category Miscellaneous existe para abrigar blocks que ainda não foram classificados em uma category específica. É uma acomodação temporária, e blocks que aqui residem são candidatos prioritários para classificação durante a etapa de backfill.

## Business

Essa category é uma concessão pragmática. Melhor ter um Block documentado em "Miscellaneous" do que esperar a classificação ideal antes de documentar. O custo de colocação imperfeita é baixo; o custo de documentação faltante é alto.

Blocks aqui não são de segunda classe — eles têm entries completas de feature.yml, markdown bilíngue completo, participação total no graph de cross-references. O único sinal que os distingue é a category parent, que os marca para re-classificação.

## Architecture

Todo block nesta category carrega um TODO implícito: re-classificação. Quando um block é movido para sua category final, três coisas acontecem:

1. A pasta é renomeada via `git mv` de `blocks/miscellaneous/{block}` para `blocks/{final-category}/{block}`.
2. O `parent` no `feature.yml` do block é atualizado para o UID da nova category.
3. O UID do block é atualizado de `herd.block.miscellaneous.{block}` para `herd.block.{final-category}.{block}`. Frontmatters dos markdowns são atualizados para bater.

Cross-references ao block de outras features também precisam ser atualizadas para o novo UID. Essa é uma mudança coordenada tratada pela etapa de backfill, não pelo desenvolvedor que por acaso está mexendo em código não relacionado.

## Operations

<!-- TODO: Processo concreto para re-classificar um block: quem propõe a nova category, quem aprova, quanto tempo blocks devem ficar em Miscellaneous antes de serem priorizados para re-classificação. -->

## Glossary

<!-- TODO: Glossário local se necessário. Provavelmente não — esta category é intencionalmente genérica. -->

## Changelog

- **2026-05-02** — Publicação inicial. Category overview criado durante Sub-etapa 1.5 da Handbook UI.
