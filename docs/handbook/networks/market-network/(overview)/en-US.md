---
title: Market Network
description: The external network connecting multiple companies in the same market.
locale: en-US
uid: herd.category.networks.market-network
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Market Network

The Market Network connects multiple companies operating in the same market. It is the external ecosystem where a company interacts with customers, partners, suppliers, and competitors. Where a Corporate Network is internal and isolated, a Market Network is shared and emergent — its value comes from cross-company visibility.

## Business

A Market Network's value is in market intelligence: comparatives, benchmarks, cross-company opportunity discovery. Two companies in the same Market Network can — within explicit consent — see anonymized comparison data, surface joint customers, or discover opportunities to partner. None of this is possible inside a single Corporate Network.

This is what distinguishes HERD from a single-tenant CRM. A Corporate Network alone gives a company internal organization. A Market Network gives a company position within a broader ecosystem. Both layers matter, and they answer different questions: "how do we operate?" vs. "where do we stand?"

<!-- TODO: 2-3 more paragraphs on the commercial flywheel of Market Networks: how the value of a Market Network grows superlinearly with members, how privacy/consent is preserved, how monetization differs from Corporate Network. -->

## Product

<!-- TODO: How users (sales, leadership) interact with Market Network surfaces in HERD's admin UI. Market dashboards, segment views, peer benchmarks, opportunity discovery flows. -->

## Architecture

The Market Network is a layer above individual Corporate Networks, with a federated model. Features that live within a Market Network — market itself, segments, cross-company benchmarks, federated identities — will be documented as individual features within this category as the backfill etapa proceeds.

Each feature inside this category declares `parent: herd.category.networks.market-network` in its `feature.yml`. UID format: `herd.{level}.market-network.{feature-id}`. Cross-network features (those that link a Corporate Network to a Market Network) declare consumes/consumed_by relationships across category boundaries — a permitted cross-reference pattern in the Handbook graph.

<!-- TODO: 2-3 more paragraphs on architectural implications: how data sharing across Corporate Networks is implemented (anonymization, aggregation, opt-in), how identity federation works, how Market Network state is partitioned vs. replicated. -->

## Operations

<!-- TODO: Conventions for working with Market Network features: how consent is obtained and tracked, how to handle Corporate Networks leaving a Market Network, how Market Network governance differs from Corporate Network governance. -->

## Glossary

<!-- TODO: Local glossary of Market-Network-specific terms (Market Network, segment, benchmark, federation, opt-in, anonymization, etc.). -->

## Changelog

- **2026-05-02** — Initial publication. Category overview created during Handbook UI Sub-etapa 1.5.
