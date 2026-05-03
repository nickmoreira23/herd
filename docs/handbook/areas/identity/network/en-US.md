---
title: Network
description: Network management — profiles, roles, channels, departments, directory.
locale: en-US
uid: herd.tool.identity.network
---

> **For AI agents:** This Markdown file is the canonical form of this entry.

# Network

Provisional network-management tool in R2. Bundles profiles, roles, channels, departments, and people directory.

## Business

Network answers "who is in the system and how are they organized?". In R2 it's unified as a single tool; R2.5 splits it into two — Organization (structural) and Directory (lookup).

## Product

Accessible at `/admin/network`. In R2.5 these routes will be refactored into `/admin/organization` and `/admin/directory`.

## Architecture

In R2 Network aggregates profile, role, channel, department, and contacts blocks. R2.5 will separate concerns: organizational structure vs people lookup.

## Operations

In R2: add a person via the Network UI. In R2.5: use the appropriate tool based on purpose (Org vs Directory).

## Glossary

- **Network (R2)**: provisional unified identity-management tool.
- **Organization (R2.5)**: will cover structure — departments, channels, hierarchy.
- **Directory (R2.5)**: will cover lookup — searching people.

## Changelog

- **2026-05-03 (R2)** — Handbook entry created as a provisional tool. R2.5 will split it.
