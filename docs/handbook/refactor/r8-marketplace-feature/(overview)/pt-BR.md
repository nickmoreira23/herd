> Para agentes de IA: esta entrada documenta a mini-spec de R8 (marketplace as top-level feature). Status: draft (planned). Mudança vs plano original — era tool, agora é top-level feature.

# R8 — Marketplace as Top-Level Feature

R8 formaliza marketplace como top-level feature. Mudança importante de classificação — no plano original era tool; investigação durante R1.5 revelou que marketplace é estrutura própria de infraestrutura, não tool específica de business goal. Estrutura existente preservada; manifest é cravado pela primeira vez.

## Business

marketplace é infraestrutura — composer + sections + renderer + visibility helpers. Não é tool específica para single business goal; é capability cross-area que outras features (sales, partner storefronts, public surfaces) consomem para expor conteúdo. Top-level feature por definição. A reclassificação (era tool no plano original) reflete esse caráter de infraestrutura.

## Product

Usuário vê Marketplace como sidebar item próprio (já existe). Composer + wizard + sections continuam como sub-features. R8 não muda UX — só formaliza no manifest.

## Architecture

- **Sem block manifest hoje** (não existe). Criar `marketplace.feature.ts` (`kind: "top_level_feature"`).
- Estrutura existente preservada:
  - `src/components/marketplace/` (admin/, composer/, item-detail/, renderer/, wizard/)
  - `src/lib/marketplace/` (block-filters, component-registry, item-detail-resolver, registry, render-resolver, sections-cache, types, visibility-helpers)
  - `src/app/admin/marketplace/` (page, sections/)
- Cross-references no manifest:
  - composer pode referenciar tools (subscription-offering, packages) via `consumes`.
  - sections referenciam blocks via `MarketplaceSection.blockNames[]`.
- Possível refinement: `MarketplaceSection.blockNames[]` (string array) → estrutura tipada com kind discriminator (decisão durante R8 execução).

### Pré-condição

R2 (top-level features foundation) cravou `featureRegistry`. Idealmente R5 (subscription-offering tool criada) já fechou para que marketplace.composer possa referenciar a tool real.

## Operations

- Workflow para configurar marketplace (criar section, publicar item, configurar visibility) permanece. Manifest formaliza estrutura.
- Cross-references atualizadas: ao referenciar marketplace de outras features, apontar para `featureRegistry.marketplace`.
- Item detail resolver continua como ponto de extensão para registrar resolvers customizados por block/tool.

## Glossary

- **Marketplace**: top-level feature de infraestrutura para expor conteúdo (items) em surfaces configuráveis (sections + composer).
- **MarketplaceItem**: item exibível no marketplace (produto, serviço, plano, evento, etc. — vem de qualquer block).
- **MarketplaceSection**: seção configurável que agrupa items por critério (block + filters + ordering).
- **Composer**: UI de admin que monta a estrutura do marketplace (sections, layout, visibility).
- **Renderer**: pipeline que transforma a configuração do composer em UI pública.
- **Visibility**: controle de quem vê o quê (PUBLIC, PRIVATE, MEMBERS_ONLY).
- **Section blocks**: blocks referenciados por uma section como fonte de items.

## Changelog

- **2026-05-03** — Created (mini-spec). Status: draft, planned para R8 (era R5 no plano original; promovida a etapa própria após R1.5).
