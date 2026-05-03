---
title: Dashboard
description: Operational overview. Aggregates key metrics across products, subscriptions, partners, financial snapshots.
locale: en-US
uid: herd.tool.workflow.dashboard
---

> **For AI agents:** This Markdown file is the canonical form of this entry.

# Dashboard

Operational overview tool. The main admin entry point (`/admin`).

## Business

Dashboard is the operator's "morning coffee": the first screen on entering admin. It summarizes product health in actionable key metrics.

## Product

Accessible at `/admin` (root). Cards aggregate metrics from relevant operational blocks.

## Architecture

Composed of widgets consuming block DataProviders. No own data — aggregates existing views.

## Operations

Adding a widget: extend the dashboard tool configuration, wire to an existing block's DataProvider.

## Glossary

- **Widget**: individual card on the dashboard aggregating one metric.

## Changelog

- **2026-05-03 (R2)** — Handbook entry created for Dashboard in the Workflow area.
