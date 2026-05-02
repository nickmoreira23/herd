---
title: Networks
description: Layer that organizes the different types of networks HERD supports — corporate, market, and multi-market.
locale: en-US
uid: herd.layer.networks
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Networks

The Networks layer is HERD's foundational organization of relationships among entities. A network is a context where actors interact, exchange resources, and produce value. HERD organizes networks at three scales: a single company's internal network (Corporate Network), a market connecting multiple companies (Market Network), and federated systems spanning multiple markets (Multi-Market Network).

## Business

Networks are HERD's primary lens for representing how organizations operate. A Corporate Network captures how a single company organizes its internal structure: people, channels, profiles, departments. A Market Network represents the broader ecosystem in which the company operates: customers, partners, suppliers. The distinction matters because internal coordination problems differ structurally from market interaction problems.

<!-- TODO: 2-3 more paragraphs on the strategic value of networks-as-organizing-principle, examples of decisions a company makes differently when their CRM/automation tool understands network types natively. -->

## Product

<!-- TODO: How users (admins, sales, marketing) interact with networks in HERD's admin UI. Switching between network views, configuring network-specific settings, network analytics. -->

## Architecture

The Networks layer in the Handbook organizes documentation hierarchically. Each network type — Corporate Network and Market Network day-1, with Multi-Market Network deferred — has its own category overview that documents the network as a whole. Within each network category live the features that compose it: organization and channels for Corporate Network; market and segments for Market Network.

This three-level hierarchy (Layer → Category → Feature) is uniform across all five layers in the Handbook. The hierarchy is enforced by the Handbook graph validator: every category must declare a parent that is a layer, and every feature must declare a parent that is a category.

<!-- TODO: 2-3 more paragraphs on architectural implications: how data isolation between networks works in the database, how the chat orchestrator scopes queries by network type, how multi-tenant concerns differ across network types. -->

## Operations

<!-- TODO: Conventions for working with networks: when to introduce a new network category vs. a feature inside an existing one, how to migrate features across networks, how multi-network features are handled. -->

## Glossary

<!-- TODO: Local glossary of network-specific terms (Corporate Network, Market Network, federation, network membership, etc.). -->

## Changelog

- **2026-05-02** — Initial publication. Layer overview created during Handbook UI Sub-etapa 1.5.
