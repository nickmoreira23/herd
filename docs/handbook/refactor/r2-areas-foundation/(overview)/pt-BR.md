> Para agentes de IA: esta entrada documenta R2 (areas foundation) — a introdução de Area como 5ª categoria técnica canônica e camada estrutural acima de Tools. Leia antes de tocar em `src/lib/core/manifest.ts`, `src/lib/core/registry.ts`, `src/lib/tools/manifest.ts` (campo `area`), ou propor mudanças relacionadas à hierarquia de produto.

# R2 — Areas Foundation

R2 introduz Areas como macro-divisões do produto onde Tools são posicionadas. Substitui o slot especulativo `top-level-feature` (cravado em R0.1) por uma categoria concreta — `area` — e simplifica a hierarquia de 6 para 5 níveis (Networks → Areas → Tools → Blocks → Integrations). Pillars/Modules foram eliminados em favor de simplicidade.

## Business

Areas são camada estrutural acima de Tools — macro-divisões do produto (Communication, Transaction, Workflow, Notification, Identity, Infrastructure). Permitem agrupar tools por função no produto, oferecendo navegação coerente. Pillars/Modules foram eliminados em favor de simplicidade — Areas + Tools cobrem o que precisamos.

Para clientes do HERD, R2 não muda nada de imediato — é foundation técnica. O efeito user-facing aterrissa no Commit 4 (sidebar reorganizado por area).

## Product

Usuário verá tools agrupadas por area no sidebar (commit 4). Area = primeiro nível de navegação; Tools dentro como sub-items. Layers agregadores (Tools, Blocks, Integrations) preservados como entries separadas.

## Architecture

Hierarquia simplificada de 6 para 5 níveis:

```
Networks (Corporate, Market, Multi-market — categoria comercial)
   ↓ contém
Areas (6 — Communication, Transaction, Workflow, Notification, Identity, Infrastructure)
   ↓ posicionam
Tools (todas as ferramentas — incluindo cross-cutting)
   ↓ compostas de
Blocks (32 manifests existentes)
   ↓ alimentados por
Integrations
```

5 categorias técnicas finais:

- **block** — single source of truth de tipo de dado.
- **block-group** — agrupamento intra-block (R3 traz primeiro caso real).
- **tool** — compõe blocks para objetivo concreto.
- **tool-category** — agrupa tools por disciplina de negócio.
- **area** (NOVA) — macro-divisão do produto.

`top-level-feature` removido (era especulativo). Tools cross-cutting (chat, marketplace, knowledge, network, handbook, dashboard) ficam sem category mas com area mandatory.

R2 cravou em Commit 1:

- `src/lib/core/manifest.ts` com `AreaManifest` interface + `isAreaManifest` type guard.
- `src/lib/core/registry.ts` stub com `areaRegistry` + `getAllAreas` + `getAreaByName` + `getToolsByArea`.
- `Tool` interface ganhou `area: string` mandatory + `category?: string` opcional explícito.
- `EntityKind` extendido com `"area"` (top_level_feature removido).
- `EntityManifest` discriminated union importa `AreaManifest`.
- Schema enum `technical_category` substitui `top-level-feature` por `area` (12 valores).
- 10 tools embedded em categories ganharam area field.
- 3 marketing placeholders dropados (Marketing category preservada vazia para R4).

Próximos commits:

- Commit 2: 6 area manifests + 6 standalone tool manifests novos.
- Commit 3: tool naming/path cleanup.
- Commit 4: Knowledge migration + sidebar registry-driven 2 níveis.
- Commit 5: Handbook docs reform (Areas layer + entries + sweep R1.5).

## Operations

Workflow para criar tool nova:

1. Decidir area (mandatory) e category (opcional).
2. Adicionar tool em `*.category.ts` (com category) OU `src/lib/tools/tools/{name}.tool.ts` (cross-cutting, sem category).
3. Definir `area`, `BlockConnection[]`, `ToolAction[]`, paths.
4. Tools cross-cutting moram em `src/lib/tools/tools/` (Commit 2 cria estrutura).

## Glossary

- **area**: macro-divisão do produto onde tools são posicionadas. 6 valores canônicos.
- **AreaManifest**: interface de manifest de area com kind: "area".
- **areaRegistry**: lookup `Record<string, AreaManifest>` em `src/lib/core/registry.ts`.
- **getToolsByArea**: helper que filtra tools[] por area.name.
- **5-level hierarchy**: Networks → Areas → Tools → Blocks → Integrations.

## Changelog

- **2026-05-03 (v1.0 — Commit 1)** — Foundation técnica: AreaManifest type, registry stub, Tool ganha area field, EntityManifest extension, schema enum bump, 10 tools com area, 3 marketing placeholders dropados.
