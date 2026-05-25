---
title: "Pattern: Naming Convention"
description: "Naming por linguagem natural; blocks sempre plural; sufixos canônicos; distinção semântica entre Profile, profile-types e profiles."
locale: pt-BR
uid: herd.meta.pattern-naming-convention
---

> Para agentes de IA: este pattern é invariante de vocabulário. Quando criar tool, block ou surface novos, consulte este pattern para garantir naming consistente. Decisões cravadas em sessão arquitetural de maio/2026.

# Pattern: Naming Convention

Naming claro reduz fricção entre product, design, engineering e business. O ComeçaAI adota convenções precisas mas não mecânicas — a regra é **linguagem natural** decidir quando aplicável (tools), e **convenções canônicas** quando há valor em vocabulário compartilhado (blocks).

Este pattern consolida três regras: como nomear tools, como nomear blocks (incluindo sufixos canônicos), e como evitar a confusão clássica entre Profile (tool), profile-types (block) e profiles (block).

## Business

Naming ruim é dívida invisível. Em uma plataforma com dezenas de tools e blocks, conversar sobre "o módulo de pontos" vs "Points tool" vs "points block" sem regras compartilhadas vira atrito constante. Cada conversa começa pedindo desambiguação.

A consequência é dupla. Para o time, vocabulário consistente reduz tempo de onboarding, agiliza code review, e facilita escrita de specs. Para AI agents (orchestrator, MCP, Claude Code), naming previsível habilita reasoning correto sem ambiguidade — agente que sabe que "block name é sempre plural" lê schema com mais confiança.

## Product

### Tool naming — linguagem natural

A regra única para tools: **como o time, design e business falam dessa tool no dia-a-dia? Esse é o nome.** Não há regra mecânica forçando singular ou plural; a linguagem natural decide.

**Plural** quando a tool gerencia coleção:

| Tool | Por que plural |
|---|---|
| Products, Plans, Contracts, Permissions, Roles | gerenciam coleção de itens do mesmo tipo |
| Expenses, Payments, Forms, Packages, Milestones | mesmo padrão |
| Brand Kits, Locations, Pipelines, Routines, Agents, Subscriptions, Campaigns | mesmo padrão |
| Business Units, Departments | múltiplas unidades organizacionais |

**Singular** quando a tool é sistema único:

| Tool | Por que singular |
|---|---|
| Chat, Marketplace, Dashboard | sistema único da plataforma |
| Knowledge, Network, Profile, Handbook, Ledger | mesmo padrão |
| Recognition, Ranking, Capacitation, Remuneration, Points | sistemas de progressão (singulares como conceito) |
| Wallet (futura) | mesmo padrão |

**Teste rápido**: pronuncie a frase "vou abrir [tool]". "Vou abrir Plans" soa natural; "Vou abrir Plan" soa errado. "Vou abrir Chat" soa natural; "Vou abrir Chats" soa errado. Esse teste resolve a maioria dos casos.

### Block naming — sempre plural

Diferente de tools, blocks **sempre são plurais** — porque representam coleção de records:

```
products (não product)
contacts (não contact)
recognition-events (não recognition-event)
points-balances (não points-balance)
```

A razão é simples: o block é "a tabela" / "a lista de coisas desse tipo". Singular quebra mental model.

### Distinção semântica entre Profiles

Caso especial que ilustra a importância das três regras. Existem **quatro coisas chamadas de profile** no produto, e elas não colidem porque vivem em contextos distintos:

| Termo | Tipo | Localização | Singular/Plural |
|---|---|---|---|
| **Profile** (institucional) | Tool standalone | Organization area | Singular |
| **Profile** (pessoal — futura) | Tool standalone | Identity area | Singular |
| **profile-types** | Block (gerenciado em Network "Manage types") | Network tool | Plural |
| **profiles** | Block (instâncias) | Network tool consome | Plural |

Os contextos diferentes (área, layer, singular vs plural) eliminam ambiguidade. Confundir os quatro produz documentação errada, schema confuso e UI inconsistente.

O mesmo princípio se aplica a qualquer family que tenha "tipo + instância":

- `plan-types` (templates plural) vs `plans` (instâncias plural) — Plans tool singular ou Plans tool plural? Plans tool plural (gerencia coleção).
- `permission-sets` (templates) vs `permissions` (instâncias) — Permissions tool plural.

## Architecture

### Sufixos canônicos de blocks

Sufixos no id do block codificam semântica. **Aplicar sempre que a semântica casar**; não inventar variantes ad-hoc.

| Sufixo | Função |
|---|---|
| (sem sufixo) | Bloco principal da family (ex: `products`, `contacts`) |
| `-categories` | Block Group naming (agrupamento intra-block) |
| `-tracks` / `-systems` / `-rules` | Definições principais |
| `-levels` | Níveis nomeados |
| `-criteria` | Condições reutilizáveis |
| `-events` | Log temporal (com source attribution obrigatória) |
| `-progress` | Current state contínuo |
| `-positions` | Ranking current + histórico (Ranking-specific) |
| `-balances` | Saldo dinâmico atualiza on event |
| `-snapshots` | Histórico congelado por período configurável |
| `-benefits` | Regras condicionais ativas em level |
| `-rewards` | Premiações singulares concedidas |
| `-stories` | Conteúdo narrativo publicável |
| `-payouts` | Pagamentos consolidados (auditados) |
| `-redemptions` | Resgates |
| `-transitions` | Log de mudanças de estado entre instâncias |

Detalhe semântico de cada sufixo está documentado em `pattern-block-level` (estrutura) e `pattern-snapshots` (sufixos de estado).

### kebab-case sempre

Em paths físicos, ids, e UIDs, sempre kebab-case (lowercase + hyphen). Sem snake_case, camelCase ou PascalCase em ids/UIDs.

```
✓ pattern-naming-convention
✓ recognition-tracks
✓ business-units

✗ patternNamingConvention
✗ recognition_tracks
✗ BusinessUnits
```

### UID structure

UID concatena tokens kebab-case com pontos. Já formalizado no schema (ver `_meta/handbook`):

```
herd.layer.{layer-name}              — layer
herd.category.{layer-name}.{cat-id}  — category
herd.{level}.{cat-id}.{feat-id}      — feature individual
herd.meta.{id}                       — meta entry
```

UID nunca muda após criação — é identificador estável (ver invariante em `_meta/handbook`).

## Operations

### Checklist para nomear tool nova

1. **Linguagem natural primeiro**: como o time fala da tool? "Vou abrir Plans" ou "Vou abrir Plan"? Pronunciar a frase decide singular/plural.
2. **Coleção ou sistema único?**: tool gerencia múltiplas instâncias do mesmo tipo (Plans, Products, Contracts) → plural. Tool é sistema único na plataforma (Chat, Marketplace, Dashboard) → singular.
3. **Validar contra tools existentes**: o nome casa com tools já criadas? Se a categoria semântica for nova, conferir com produto/design.
4. **Evitar redundância com layer/area**: tool dentro de "Marketing Tools" não precisa do prefixo "Marketing" no nome. Layer já contextualiza.

### Checklist para nomear block novo

1. **Plural**: id sempre plural. Sem exceção.
2. **kebab-case**: hyphen, lowercase, sem caracteres especiais.
3. **Sufixo canônico apropriado**: consultar tabela. Se nenhum sufixo encaixa exatamente, pause-and-report — provavelmente significa que a semântica do block precisa ser reexaminada antes de implementar.
4. **Evitar sufixos ad-hoc**: nunca `-history`, `-archive`, `-list`, `-data` — quebra vocabulário.
5. **Tool dona clara**: o block pertence a qual tool? Família consistente.

### Checklist para nomear UID/path

1. **Kebab-case obrigatório** em todos segmentos.
2. **Concordância path ↔ UID**: o path físico (`docs/handbook/{layer}/{cat}/{id}/`) deve bater letra-por-letra com o UID (`herd.{level}.{cat}.{id}`).
3. **`(overview)` reservado**: o segmento `(overview)` é específico para layer/category overview entries. Não usar como id de feature.
4. **Estabilidade**: UID, uma vez publicado, não muda. Renames vão por deprecation + sucessor.

### Anti-patterns a evitar

- **Tool com naming forçado**: forçar plural quando o time fala singular (ou vice-versa). Quebra usabilidade da conversa interna.
- **Block singular**: criar `product` em vez de `products`. Confunde mental model.
- **Sufixo ad-hoc**: criar `recognition-history` ou `points-archive`. Use os sufixos canônicos.
- **Profile confusion**: criar block `profile` (singular) quando deveria ser `profiles`. Misturar Profile (tool) com `profiles` (block).
- **Renomear UID**: editar `uid` de entry após publicação. Sempre via deprecation.

## Glossary

- **kebab-case**: convenção de naming com palavras em lowercase separadas por hyphens (ex: `recognition-tracks`).
- **singular-naming**: convenção para tools que são sistemas únicos (Chat, Marketplace, Recognition).
- **plural-naming**: convenção para tools que gerenciam coleções (Plans, Products, Contracts) e para todos os blocks.
- **suffix-convention**: sistema de sufixos canônicos que codificam semântica de blocks (`-events`, `-snapshots`, `-progress`, etc.).
- **semantic-distinction**: princípio de diferenciação entre termos similares via contexto (ex: Profile tool singular vs profile-types block plural).
- **natural-language-naming**: princípio de que tool name deve refletir como o time fala da tool no dia-a-dia.

## Changelog

- **2026-05-04 (v1.0)** — Pattern cravado em sessão arquitetural R2.5 expandida (maio/2026). Estabelece naming por linguagem natural para tools, naming sempre plural para blocks, sufixos canônicos como vocabulário compartilhado, distinção formal Profile vs profile-types vs profiles, e kebab-case como convenção universal em paths/ids/UIDs.
