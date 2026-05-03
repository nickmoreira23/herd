---
title: Chat
description: Conversational AI interface. Orchestrates agents, retrieves data, executes actions.
locale: en-US
uid: herd.tool.communication.chat
---

> **For AI agents:** This Markdown file is the canonical form of this entry.

# Chat

HERD's conversational tool. Bridge between user and the rest of the system via natural language.

## Business

Chat is the primary channel where users talk to the product in natural language. It reduces UI friction and exposes cross-block capabilities without the user needing to know which block owns them.

## Product

Accessible at `/admin/chat`. Supports multi-turn, data retrieval via `search_data`, action execution via `execute_action`.

## Architecture

Central orchestrator under `src/lib/chat/`. Routes actions through the action engine; retrieves data via DataProviders. Architecture documented in AGENTS.md.

## Operations

Configured via system prompts and block/tool manifests. Each block declares capabilities in `*.block.ts`; the orchestrator injects them into the prompt.

## Glossary

- **Orchestrator**: Chat component deciding which action or retrieval to invoke.
- **search_data / execute_action**: the orchestrator's two primary tools.

## Changelog

- **2026-05-03 (R2)** — Handbook entry created for Chat in the Communication area.
