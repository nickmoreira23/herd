> Para agentes de IA: esta entrada documenta R0 (foundation do refator) — três sub-etapas (R0.0, R0.1, R0.2) que prepararam o terreno para R1–R7. Leia antes de tocar em `src/lib/blocks/manifest.ts` ou propor mudanças no manifest registry.

# R0 — Manifest Registry Foundation

R0 é a etapa de fundação do refator estrutural. Composta por três sub-etapas que aterrissam juntas em main: (i) consolidar Phase 1.5 + Handbook foundation no main, (ii) documentar a taxonomia arquitetural canônica no Handbook, (iii) introduzir o `kind` discriminator no `BlockManifest` preparando o registry para as re-classificações de R3–R7. Sem R0, cada etapa subsequente teria que re-litigar perguntas de fundação.

## Business

Por que R0 importa comercialmente: o refator viabiliza Tools, Solutions e Networks plurais sobre fundação alinhada. Sem R0, toda etapa R3–R7 — packages → block group, campaigns → tool, subscriptions split, agents → feature — gastaria iteração discutindo "o que é um block vs tool vs feature?". R0 commit a resposta. As etapas downstream se tornam mecânicas: aplicar a taxonomia, não inventá-la.

## Product

Invisível ao usuário final. R0 não muda comportamento de nenhuma feature. O que muda é o que vem depois — features futuras nascem com classificação canônica e o registry está preparado para receber as três formas (block, tool, area — esta última substitui o antigo top-level-feature em R2) em vez de assumir uma só.

## Architecture

### R0.0 — Limpeza pré-refator (2026-05-02, hashes 9615dbd → 16d444f)

Pré-condição estrutural antes de qualquer alteração de schema. Phase 1.5 (cadeia de 28 commits) foi rebaseada sobre Handbook foundation e merged via PR #7. Handbook foundation merged via PR #6. Conflito em `AGENTS.md` resolvido manualmente. Conflito de sidebar resolvido (Knowledge mantém ícone Brain, Handbook usa BookOpen). Chave i18n `nav.sidebar.handbook` adicionada.

Sem R0.0, R0.1 e R0.2 não teriam base limpa para aplicar mudanças.

### R0.1 — Reforma de conteúdo arquitetural (2026-05-02, hash 80f892c)

Seis lacunas arquiteturais fechadas em `_meta/handbook`:

1. Hierarquia comercial 5-níveis plural — Networks como categoria com subtipos Multi-market / Market / Corporate.
2. Valores canônicos de `technical_category` arquitetural — `block` / `block-group` / `tool` / `area` (área substitui `top-level-feature`, removido em R2).
3. Árvore de decisão atualizada para classificar nova feature por natureza (dado / utilidade / autônoma).
4. Tabela de mapeamento de paths atualizada cobrindo os quatro tipos arquiteturais.
5. Tabela de re-classificações para R3–R7 — referência canônica para que cada etapa sabe o que muda.
6. Guia de disciplina de classificação em 5 instruções para agentes — como classificar antes de propor.

Adicionalmente: distinção `level` vs `technical_category` documentada (evitando o erro de inversão), pattern "SKILL → Handbook tool" documentado, refs de `domain-events` em AGENTS.md atualizadas, enum `TechnicalCategory` em `schemas/feature.zod.ts` bumpada de 3 → 11 valores (4 arquiteturais canônicos + 7 dimensões temáticas).

### R0.2 — Schema bump do manifest (2026-05-02, hash b8670ed)

Schema bump em `src/lib/blocks/manifest.ts`:

```typescript
export type EntityKind = "block" | "tool" | "top_level_feature";
export type EntityManifest = BlockManifest | ToolManifest | FeatureManifest;

// BlockManifest preserva 10 campos funcionais + adiciona kind, remove domain
export interface BlockManifest {
  kind: "block";
  name: string;
  displayName: string;
  description: string;
  types: string[];
  capabilities: string[];
  actions: BlockAction[];
  models: string[];
  dependencies: string[];
  paths: { components, pages, api, lib?, validators?, provider? };
  groups?: BlockGroupSpec[];
}

// ToolManifest e FeatureManifest provisórios.
// Shapes finais refinados em R1 (tools foundation) e R2 (features foundation).

export interface BlockGroupSpec { /* ... preparado para R3 packages */ }

// Type guards
export function isBlockManifest(m: EntityManifest): m is BlockManifest;
export function isToolManifest(m: EntityManifest): m is ToolManifest;
export function isFeatureManifest(m: EntityManifest): m is FeatureManifest;
```

**Decisão: preservação de shape sobre simplificação teórica.** A spec original propunha um `BlockManifest` minimalista de 6 campos. Os outros 5 campos (`displayName`, `description`, `types`, `actions`, `dependencies`) são exercitados em runtime pelo orquestrador de chat (`action-execution.ts`) e pela UI (sidebar / dialogs). Simplificar quebraria o chat de Phase 2. Simplificação (se desejável) é refator separado com escopo próprio.

**Migração mecânica:** 32 manifests em `src/lib/blocks/blocks/` atualizados. Cada um recebeu `kind: "block"` como primeiro campo; campo `domain` removido.

**Limpeza de consumidor:** `src/lib/marketplace/types.ts` e `src/lib/marketplace/registry.ts` tinham `EligibleBlock.domain` que mapeava mecanicamente de `manifest.domain`. Removido (sem consumidor semântico além do próprio mapeamento).

`domain` foi deprecado, não substituído. O drift era severo (4 valores declarados na spec vs 7 no código, com `engagement` listado mas nunca usado). Nenhuma reintrodução de `category` nesta etapa — quando aparecer demanda concreta de consumidor, `category` pode ser adicionado com semântica apropriada.

### Decisão: registries separados

Block, tool e feature registries são fisicamente separados (`src/lib/blocks/blocks/`, `src/lib/tools/tools/`, `src/lib/features/`). R0.2 mantém `blockRegistry` como `Record<string, BlockManifest>`. R1 e R2 introduzem `toolRegistry` e `featureRegistry` paralelos. Um `Record<string, EntityManifest>` unificado foi rejeitado em favor de separação física que espelha o layout de paths.

## Operations

Cinco instruções para agentes trabalhando em superfícies pós-R0:

1. Ao criar um manifest novo, use o `kind` apropriado (`block` por enquanto; `tool` e `top_level_feature` disponíveis mas sem produtor em R0). Adicione `kind: "block"` como primeiro campo do literal.
2. Ao consumir um manifest onde `kind` importa, use type guards (`isBlockManifest`, `isToolManifest`, `isFeatureManifest`) para narrowing. Não acesse campos kind-specific sem guard.
3. Ao re-classificar um manifest de `block` para `tool` ou `top_level_feature` (em R3–R7), siga a spec da etapa para movimentação de paths e mapeamento de campos. Não improvise.
4. O campo `domain` foi removido e não substituído. Se aparecer caso de uso que precise filtrar/agrupar manifests, proponha com consumidor concreto + semântica; não invente.
5. As 5 instruções de disciplina de classificação em `_meta/handbook` se aplicam: classifique antes de propor, justifique com a árvore de decisão, documente re-classificação no commit, traga dúvidas ao diálogo, não invente categorias novas.

## Glossary

- **EntityManifest**: união discriminada de `BlockManifest | ToolManifest | FeatureManifest`. Substitui o `BlockManifest` monolítico pré-R0.
- **kind**: campo discriminador em `EntityManifest`. Valores: `"block" | "tool" | "top_level_feature"`. Determina shape estrutural e onde o manifest mora fisicamente.
- **BlockGroupSpec**: especificação aninhada para grupos de block (ex.: packages como grupo de products). Mora dentro do campo `groups?` do block pai. R3 exercitará isto.
- **type guard**: função de narrowing TypeScript (`isBlockManifest`, etc.) que confirma o `kind` de um `EntityManifest` em runtime, permitindo o compilador acessar campos kind-specific com segurança.

## Changelog

- **2026-05-02 (R0 fecha)** — Três sub-etapas aterrissam em main: R0.0 limpeza (PR #7 + #6), R0.1 reforma de conteúdo (PR #8, hash 80f892c), R0.2 schema bump (esta entrada, hash b8670ed). 23 `feature.yml` totais no Handbook (era 21 → +1 para overview do refator, +1 para r0-manifest-registry).
