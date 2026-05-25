---
title: "Pattern: Tool"
description: "Tool como unidade comercial e operacional do ComeçaAI: dois modos, naming natural, manifest em registry."
locale: pt-BR
uid: herd.meta.pattern-tool-level
---

> Para agentes de IA: este pattern é invariante arquitetural. Quando criar tool nova, consulte aqui antes para diferenciar de Surface, Block ou Tool Category. Decisões cravadas em sessão arquitetural de maio/2026.

# Pattern: Tool

Tool é o nível de manipulação rica do ComeçaAI — onde regras de negócio, autoria e UI completa moram. Toda capability nasce como trio (ver `pattern-three-level-composition`); este pattern explica especificamente o nível Tool: o que é, o que não é, e como criar uma nova sem fragmentar a arquitetura.

## Business

Tool é a unidade comercial do ComeçaAI. Pode ser ativada por plano comercial, monetizada individualmente, e composta em pacotes (Solutions, conceito futuro). Cada tool tem objetivo de negócio claro — gerar valor que justifique seu próprio espaço.

A consequência prática é seletiva: se uma "feature" candidata não tem objetivo comercial próprio, ela provavelmente é parte de outra tool (uma surface, um block, ou uma sub-rotina interna). Tools não são guarda-chuvas técnicos — são produtos. Esse rigor evita o crescimento por acreção que faz roadmaps comerciais virarem listas indistintas de "features".

## Product

Tool tem **dois modos** de operação. O mesmo manifest, a mesma lógica core, mas dois cenários de UI:

- **Standalone**: o usuário acessa a tool em path canônico (`/admin/products`, `/admin/plans`). Workflow completo, header próprio, breadcrumb próprio. É a forma "completa" de usar a tool.
- **Embedded**: a tool é invocada inline a partir de outra surface — modal "Quick add", tab em outra tool, sheet inline. Mantém a lógica core mas reduz a UI ao essencial para a tarefa imediata.

**Naming** segue linguagem natural — não regra mecânica:

- **Plural** quando a tool gerencia coleção: `Products`, `Plans`, `Contracts`, `Permissions`, `Roles`, `Business Units`, `Departments`, `Brand Kits`, `Locations`, `Routines`, `Agents`, `Campaigns`, `Pipelines`.
- **Singular** quando a tool é sistema único: `Chat`, `Marketplace`, `Dashboard`, `Knowledge`, `Network`, `Profile`, `Handbook`, `Ledger`, `Recognition`, `Ranking`, `Capacitation`, `Remuneration`, `Points`, `Wallet`.

A regra é: como time, design e business falam dessa tool no dia-a-dia? Esse é o nome.

## Architecture

### Manifest e registry

Toda tool tem manifest TypeScript em `src/lib/tools/tools/{tool}.tool.ts` que declara identidade, paths, capacidades e block family associada. O manifest registra a tool em `src/lib/tools/registry.ts`. O orchestrator de chat consome o registry para rotear chamadas de `execute_action`.

Manifest carrega:

- Identidade (`id`, displayName em pt-BR e en-US).
- Paths canônicos (admin paths, source paths).
- Categoria runtime (Finances, Legal, Marketing, Sales, Operations, Foundation).
- Capabilities expostas a agentes (actions e seus parâmetros).
- Block family associada (lista de blocks que a tool produz/manipula).

### Tool ≠ Surface ≠ Block

Critérios decisivos para diferenciar:

- **Tool**: tem UI rica, lógica de manipulação, e gera/manipula uma família de blocks. Ex: Plans tool gerencia `plan-types`, `plans`, `plan-transitions`.
- **Surface**: consome blocks e pode invocar tools inline, mas não gera dado próprio. Ex: Marketplace consome `products` mas não os manipula.
- **Block**: single source of truth de um tipo de dado. Não tem UI rica própria — é manipulado pela tool dona da family.

Quando há dúvida, a pergunta é: "se eu remover esta coisa, qual é a perda?" Perda de UI rica e regras → era tool. Perda de manifestação → era surface. Perda do dado em si → era block.

### Tool gera FAMILY, não block único

Decisão importante: tool nunca gera só um block. Sempre gera **família** de blocks correlacionados. Plans gera 3 blocks (`plan-types`, `plans`, `plan-transitions`). Recognition gera 8 blocks. Ledger orquestra `journal-entries` + `commissions-payments`.

Isso evita o anti-pattern de "uma tool por block" que fragmenta arquitetura, duplica chrome, e dificulta evolução conjunta de dados que sempre andam juntos.

### Tool Category vs Area

Duas dimensões distintas que classificam uma tool:

- **Area** (estrutural, 6 fixas): Organization, Identity, Communication, Transaction, Workflow, Notification. Toda tool vive em exatamente uma área.
- **Tool Category** (runtime, opcional dentro de Workflow): Finances, Legal, Marketing, Operations, Sales, Foundation. Agrupa tools por afinidade de runtime/orquestração.

Não confundir: Area diz *onde a tool mora no produto*; Tool Category diz *como o orquestrador agrupa para roteamento*.

## Operations

### Checklist para criar tool nova

1. **Natureza**: a coisa tem objetivo de negócio claro e justifica unidade própria? Se não → talvez seja surface ou parte de tool existente.
2. **Area**: em qual das 6 areas a tool vive? Se não cabe em nenhuma → pause-and-report.
3. **Tool Category** (opcional dentro de Workflow > Tools): Finances, Legal, Marketing, Operations, Sales, Foundation.
4. **Block Family**: quais blocks ela gera/manipula? Aplique sufixos canônicos (ver `pattern-block-level`).
5. **Surfaces**: quais surfaces consomem ou invocam essa tool? Há External? Há Internal?
6. **Pattern Manage Types/Sets**: a tool gerencia templates + instances? Se sim → aplicar pattern de header sub-action (`pattern-manage-types`).
7. **Naming**: singular ou plural? Decidir por como o time fala da tool, não por regra mecânica.

### Anti-patterns a evitar

- **Tool template-only**: tool separada só para gerenciar templates de outra tool (ex: `plan-types-tool` separada de `plans-tool`). Use o pattern Manage Types em vez disso.
- **Tool por block**: criar uma tool para cada block isolado. Tools sempre operam sobre family, não block único.
- **Tool sem standalone**: se a tool só existe em modo embedded, geralmente é uma surface, não tool.
- **Tool sem Area**: se a tool não cabe em nenhuma das 6 areas, é sinal de que a feature ainda não está bem definida — pause-and-report antes de criar uma area nova.

## Glossary

- **Tool**: unidade de manipulação rica — UI, regras, manifest, registry. Unidade comercial do ComeçaAI.
- **Tool Category**: agrupamento runtime de tools por afinidade de orquestração (Finances, Legal, Marketing, Sales, Operations, Foundation). Não é tool em si.
- **Area**: macro-divisão estrutural do produto (Organization, Identity, Communication, Transaction, Workflow, Notification). Tools vivem dentro de areas.
- **Manifest**: declaração TypeScript que descreve a tool — identidade, paths, capabilities, block family.
- **Registry**: tabela central que indexa todos os manifests; o orchestrator consulta o registry.
- **Standalone Mode**: tool em seu path canônico com workflow completo.
- **Embedded Mode**: tool invocada inline a partir de outra surface.

## Changelog

- **2026-05-04 (v1.0)** — Pattern cravado em sessão arquitetural R2.5 expandida (maio/2026). Estabelece tool como unidade comercial e operacional do ComeçaAI com dois modos formais (standalone + embedded), naming por linguagem natural, e geração de Block Family inteira em vez de block único.
