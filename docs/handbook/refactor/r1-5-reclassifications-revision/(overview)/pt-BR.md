> Para agentes de IA: esta entrada documenta R1.5 — revisão doc-first das re-classifications planejadas para R3-R8 contra o estado real do código. Antes de iniciar qualquer etapa de R2.5 a R8, leia esta entry e a mini-spec da etapa específica.

# R1.5 — Re-investigation R3-R8 Reclassifications

R1.5 é uma etapa exclusivamente documental. Durante R1, ao reconciliar a tools foundation com o discriminator schema cravado em R0.2, a investigação factual do código revelou divergências significativas entre o plano original do refator e o estado real das features. R1.5 cristaliza as decisões revistas em mini-specs antes que qualquer execução de R2.5–R8 comece.

## Business

O plano original do refator (cravado em R0.1) assumiu greenfield: que as re-classifications seriam mecânicas, baseadas em uma leitura uniforme do estado atual. A investigação durante R1 revelou estado brownfield com débitos arquiteturais específicos a cada feature: packages já é tool, campaigns dual-existe (block ativo + placeholder coming-soon), marketplace é estrutura própria sem manifest, agents tem dual surface (admin/agents top-level paralelo a admin/blocks/agents), e por aí. Documentar essas decisões antes de executar evita litígio repetido nas etapas individuais.

R1.5 é doc-first puro — zero código tocado. O retorno é eliminar ambiguidade nas etapas downstream.

## Product

Sem mudança de produto. Trabalho interno de planejamento documentado canonicamente.

## Architecture

R1.5 produz oito artefatos no Handbook:

1. **R1.5 own entry** (esta) — documenta a metodologia da revisão.
2. **R2.5 — Network Split** — Network atual, hoje top-level com sub-features ricas, splitará em Organization (estrutura institucional) + Directory (estrutura de pessoas). Channel disambiguation incluída.
3. **R3 — Packages Refinement** — packages confirmado como tool em sales/packages. R3 muda forma: investigar block-group de products dentro da tool (não mover packages para dentro de products como originalmente planejado).
4. **R4 — Campaigns Convergence** — campaigns hoje é block ativo + placeholder coming-soon em marketing.category.ts. R4 promove o block para tool real e deleta o placeholder.
5. **R5 — Subscriptions Split + Offering Creation** — subscriptions permanece bloco residual (registro real do cliente). Nova tool `subscription-offering` criada em sales para o catalog vendável. Paths divergentes (components/tiers/, api/tiers/) consolidados.
6. **R6 — Routines as Top-Level Feature** — routines hoje é block sem top-level surface. Promovido com criação de `/admin/routines/` e sidebar item dedicado.
7. **R7 — Agents as Top-Level Feature** — agents tem dual surface (admin/agents top-level já existe paralelo a admin/blocks/agents). R7 consolida e dropa admin/blocks/agents/.
8. **R8 — Marketplace as Top-Level Feature** — marketplace é UI standalone sem block manifest. Mudança de plano (era tool no original); formaliza como top-level feature com manifest cravado.

A tabela de re-classifications em `_meta/handbook/{pt-BR,en-US}.md` foi atualizada para refletir essas decisões factuais, substituindo a versão original de R0.1.

## Operations

Daqui para frente, qualquer agent (humano ou IA) executando uma etapa em R3-R8 deve:

1. Consultar a mini-spec respectiva no Handbook (`docs/handbook/refactor/r{X}-{name}/`) **antes** de propor qualquer spec executável.
2. Tratar a mini-spec como contrato de escopo. Surpresas durante execução (que façam o escopo crescer ou contradizer a mini-spec) devem ser elevadas ao usuário, não absorvidas silenciosamente.
3. Não pré-criar manifests prometidos por mini-specs (ex: `subscription-offering.tool.ts`, `marketplace.feature.ts`) durante outras etapas — esses landings são parte da etapa específica.

R1.5 não destrava etapas downstream sequencialmente: R2.5–R8 dependem de R2 (areas foundation). R6 e R7 em particular consomem o registry estabelecido em R2.

## Glossary

- **Re-classification**: mudança de `technical_category` de uma feature existente (ex: block → tool, block → area). Documentada na mini-spec da etapa.
- **Mini-spec**: entry de Handbook descrevendo escopo e decisões de uma etapa do refator antes da execução. Status `draft` enquanto não executada.
- **Brownfield investigation**: leitura do código real (paths, manifests, surfaces) para confrontar suposições do plano original. Inverso de greenfield (planejar como se nada existisse).
- **Doc-first**: protocolo onde decisões arquiteturais são cristalizadas em prosa canônica antes de qualquer mudança de código.

## Changelog

- **2026-05-03 (R1.5 fecha)** — Created. 7 mini-specs criadas (R2.5, R3, R4, R5, R6, R7, R8) + tabela de re-classifications em `_meta/handbook` atualizada + sequência de etapas em refactor (overview) expandida para 12 etapas. Status atual: doc-first done; etapas individuais ainda em draft.
