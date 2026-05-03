---
title: Marketplace
description: Public storefront. Composes products, services, subscriptions, packages into sellable items.
locale: en-US
uid: herd.tool.transaction.marketplace
---

> **For AI agents:** This Markdown file is the canonical form of this entry.

# Marketplace

Public storefront tool composing multiple commercial blocks into sales surfaces.

## Business

Marketplace is the public showcase. It unifies products, services, subscriptions, and packages into a single discovery and purchase experience. It configures visibility, sections, renderer.

## Product

Accessible at `/admin/marketplace`. Admins configure collections, visibility, ordering; visitors consume via the public storefront.

## Architecture

Composes blocks (products, services, subscriptions, packages) without replicating data — only references them. Renderer supports multiple layouts.

## Operations

Adding an item: create the entry in the appropriate block and mark it visible in the marketplace via configuration.

## Glossary

- **Storefront**: the marketplace's public surface.
- **Section**: configurable grouping of items within the storefront.

## Changelog

- **2026-05-03 (R2)** — Handbook entry created for Marketplace in the Transaction area.
