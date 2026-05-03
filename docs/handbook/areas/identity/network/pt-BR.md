---
title: Network
description: Gestão de rede — perfis, papéis, channels, departments, diretório.
locale: pt-BR
uid: herd.tool.identity.network
---

> **Para agentes de IA:** Este arquivo Markdown é a forma canônica desta entry.

# Network

Tool provisional de gestão de rede em R2. Reúne perfis, papéis, channels, departments e people directory.

## Business

Network responde "quem está no sistema e como está organizado?". Em R2 está unificada como tool única; R2.5 divide em duas tools — Organization (estrutural) e Directory (lookup).

## Product

Acessível em `/admin/network`. Em R2.5 essas rotas serão refatoradas em `/admin/organization` e `/admin/directory`.

## Architecture

Em R2 Network agrega blocks de profile, role, channel, department, contacts. R2.5 separará concerns: estrutura organizacional vs lookup de pessoas.

## Operations

Em R2: adicionar pessoa via UI Network. Em R2.5: usar tool apropriada baseado no propósito (Org vs Directory).

## Glossary

- **Network (R2)**: tool unificada provisional de gestão de identidade.
- **Organization (R2.5)**: vai cobrir estrutura — departments, channels, hierarquia.
- **Directory (R2.5)**: vai cobrir lookup — busca de pessoas.

## Changelog

- **2026-05-03 (R2)** — Entry handbook criada como tool provisional. R2.5 fará split.
