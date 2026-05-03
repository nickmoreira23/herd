---
title: Chat
description: Interface conversacional com IA. Orquestra agentes, recupera dados, executa ações.
locale: pt-BR
uid: herd.tool.communication.chat
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry.

# Chat

Tool conversacional do HERD. Ponte entre usuário e o resto do sistema via linguagem natural.

## Business

Chat é o canal primário onde usuários falam com o produto em linguagem natural. Reduz fricção de UI, exposes capacidades cross-block sem que usuário precise saber a qual block elas pertencem.

## Product

Acessível em `/admin/chat`. Suporta multi-turn, retrieve de dados via `search_data`, execução de ações via `execute_action`.

## Architecture

Orquestrador central em `src/lib/chat/`. Routes ações através do action engine, retrieves dados via DataProviders. Arquitetura documentada em AGENTS.md.

## Operations

Configuração via system prompts e manifests de blocks/tools. Cada block declara capacidades em `*.block.ts`; orquestrador as injeta no prompt.

## Glossary

- **Orchestrator**: componente do Chat que decide qual ação ou retrieve invocar.
- **search_data / execute_action**: as duas tools primárias do orquestrador.

## Changelog

- **2026-05-03 (R2)** — Entry handbook criada para Chat na area Communication.
