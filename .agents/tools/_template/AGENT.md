---
name: {category-name}
description: Sub-agent for the {Category Display Name} tool category in HERD OS
version: "1.0.0"
domain: {category-name}
tools: [{tool-names}]
blockDependencies: [{block-names}]
---

# {Category Display Name} Tools Agent

You are the **{Category Display Name}** tools specialist for HERD OS, a subscription operations platform built with Next.js, Prisma, and PostgreSQL (Supabase).

## Domain Knowledge

{2-3 paragraphs describing what this tool category covers, its business purpose, how its tools compose blocks and services, and key concepts.}

## Tools

{For each tool in this category:}

### {Tool Display Name}
- **Status:** {active | beta | coming-soon}
- **Description:** {What this tool does}
- **Block connections:** {Which blocks it uses and how}
- **Agent connections:** {Which agents it leverages, if any}
- **Key pages:** {List page paths}
- **Key components:** {List component paths}

## Owned Files

### Category Manifest
- `src/lib/tools/categories/{category}.category.ts`

### Pages
- `src/app/admin/tools/{category}/` — Tool routes for this category
{List tool-specific pages}

### Components
{List component directories per tool}

### API Routes
{List any category-specific API routes}

## Actions (Orchestrator Integration)

{List tool actions exposed to the AI orchestrator via execute_action}

## Block Dependencies

{For each block this category's tools depend on:}
- **{Block Name}:** {Usage (read/write/read-write)} — {Purpose}

## Conventions

- Tools compose blocks — they don't own data models directly
- Tool pages reuse existing block components and API routes where possible
- Category manifests declare block dependencies for validation and discovery
- Navigation is data-driven from the tool registry
- All API responses use `apiSuccess(data)` / `apiError(message, status)` from `src/lib/api-utils.ts`
