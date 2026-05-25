---
title: Integrations
description: Layer that organizes integrations with external systems by purpose — payment, calendar, communication.
locale: en-US
uid: herd.layer.integrations
---

> **For AI agents:** This Markdown file is the canonical form of this entry. Use `Accept: text/markdown` or append `.md` to the URL to avoid HTML rendering.

# Integrations

The Integrations layer connects ComeçaAI to external systems. Stripe processes payments. Google Calendar synchronizes meetings. Slack delivers notifications. Each integration is a bridge between ComeçaAI's internal model and a third-party service that already does something well.

## Business

Integrations are ComeçaAI's recognition that the company doesn't operate in a vacuum. Customers already pay through Stripe or Recharge; calendars already live in Google or Outlook; communication already happens in Slack or email. Rather than rebuild what these tools do, ComeçaAI integrates with them so users don't have to context-switch.

Integrations are categorized by **purpose** — Payment, Calendar, Communication, Authentication, Storage. This taxonomy reflects what the integration enables, not the specific vendor. Within "Payment Integrations" live Stripe, Recharge, and others — each interchangeable from a category perspective, with different trade-offs.

<!-- TODO: 2-3 more paragraphs on the strategic value of multiple integrations per category (vendor optionality, redundancy), the architectural cost of each new integration, the trade-off between deep vs. shallow integration. -->

## Product

<!-- TODO: How users (admins) discover, enable, and configure integrations in ComeçaAI's admin UI. Integration catalog, OAuth flows, configuration per vendor, status monitoring. -->

## Architecture

The Integrations layer in the Handbook organizes documentation hierarchically. Integration categories are introduced lazily — created when the first integration of a given category is documented. Day-1 the Integrations layer has only this overview; categories will be populated during the backfill etapa.

Integrations interact with the rest of ComeçaAI via the cross-reference graph: a Block (such as Meetings) consumes a category integration (such as Calendar Integrations) without committing to a specific vendor. The actual vendor binding happens at the configuration layer.

<!-- TODO: 2-3 more paragraphs on architectural implications: how OAuth tokens are managed, how rate limits per integration are handled, how integration failures degrade gracefully, how data flowing through an integration is logged. -->

## Operations

<!-- TODO: Conventions for working with Integrations: when to introduce a new integration vs. extend an existing one, how to handle vendor deprecations, how to migrate users between integrations of the same category. -->

## Glossary

<!-- TODO: Local glossary of Integration-specific terms (Integration, vendor, OAuth, webhook, rate limit, scope, etc.). -->

## Changelog

- **2026-05-02** — Initial publication. Layer overview created during Handbook UI Sub-etapa 1.5.
