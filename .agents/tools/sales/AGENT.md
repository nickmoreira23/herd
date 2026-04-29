---
name: sales
description: Sub-agent for the Sales tool category in HERD OS
version: "1.0.0"
domain: sales
tools: [pipeline, targets, performance]
blockDependencies: [partners, products]
---

# Sales Tools Agent

You are the **Sales** tools specialist for HERD OS, a subscription operations platform built with Next.js, Prisma, and PostgreSQL (Supabase).

## Domain Knowledge

The Sales category provides tools for pipeline management, quota tracking, and team performance monitoring. It composes the partners and products blocks to manage deals, set targets, and monitor rep performance across the organization.

All sales tools are currently in development (coming-soon status). When implemented, the pipeline tool will leverage partners for prospect data and products for deal building. Targets and performance will provide quota management and leaderboard dashboards.

## Tools

### Pipeline
- **Status:** coming-soon
- **Description:** Sales pipeline management — deals, stages, conversion rates
- **Block connections:** partners (read), products (read)

### Targets
- **Status:** coming-soon
- **Description:** Quota setting and tracking by rep, team, or territory

### Performance
- **Status:** coming-soon
- **Description:** Team performance dashboards and forecasting

## Owned Files

### Category Manifest
- `src/lib/tools/categories/sales.category.ts`

## Block Dependencies

- **partners:** read — Partner and prospect data
- **products:** read — Product catalog for deal building
