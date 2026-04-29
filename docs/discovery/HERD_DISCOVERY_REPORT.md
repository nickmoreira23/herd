# HERD — Relatório de Descoberta

Gerado em: 2026-04-29T21:25:07Z

> Este relatório encerra a **Etapa 0** do projeto Marketplace + Oportunidades. Reflete o estado on-disk do repositório no momento da geração (working tree atualmente sujo — ver seção 10). É a fonte de verdade que ancora as etapas seguintes (Fase 1 em diante). As decisões já fechadas pelo usuário sobre os pontos de fricção entre a arquitetura nova e o estado atual estão consolidadas na seção 11.

## 1. Stack tecnológica

- **Linguagem(ns) principal(is)**: TypeScript 5 (`strict: true`, `target: ES2017`, `module: esnext`, `moduleResolution: bundler`, paths `@/* → ./src/*`).
- **Framework(s) frontend**: Next.js **16.2.1** (App Router, Turbopack, `cacheComponents: true`, `output: standalone`), React **19.2.4**, React DOM 19.2.4.
- **Framework(s) backend**: o próprio Next.js — Route Handlers (`app/**/route.ts`) e Server Actions são o backend. Não há serviço backend separado.
- **Banco de dados**: PostgreSQL via Supabase (URLs `DATABASE_URL` e `DIRECT_URL` no `.env.example`). Driver `pg ^8.20`.
- **ORM / acesso a dados**: Prisma **7.6.0** (`@prisma/client`, `prisma`, adaptador `@prisma/adapter-pg`). Schema único em `prisma/schema.prisma`.
- **Sistema de migrations**: **`prisma db push`** (schema-only). **Não existe pasta `prisma/migrations/`** — não há migrations versionadas hoje. Decisão: migrar para `prisma migrate` na Etapa 1.1 (ver seção 11).
- **Autenticação**: NextAuth **5.0.0-beta.30** com Credentials provider. Estratégia JWT. Implementação em `src/lib/auth.ts`. Senhas em `bcryptjs ^3.0.3`. Tokens via `jose ^6.2.2`. Middleware em `src/middleware.ts` cobre `/admin/:path*` e `/login` (cookie `authjs.session-token`). Há um shortcut de super-admin via env (`ADMIN_EMAIL`, `ADMIN_PASSWORD`).
- **Gerenciador de pacotes**: npm (presença de `package-lock.json`).
- **Runtime (Node version, etc.)**: **Não pinado**. Não há `.nvmrc`, e `package.json` não declara `"engines"`. Apenas `@types/node ^20.19.37` sugere Node 20 como expectativa.
- **Outros notáveis**:
  - Estado: Zustand **5.0.12** (`src/stores/`).
  - Validação: Zod **3.25** (`src/lib/validators/`).
  - Estilo: Tailwind v4 (config inline via `@theme inline` em `src/app/globals.css`, oklch).
  - UI: shadcn (`components.json` style `base-nova`, RSC, ícones lucide).
  - Ícones: `lucide-react`.
  - Toasts: `sonner`.
  - Tema: `next-themes` (default dark).
  - IA: `@anthropic-ai/sdk ^0.82.0`.
  - Voz/transcrição: `@deepgram/sdk ^5.0.0`.
  - Multimídia/parsing: `fluent-ffmpeg`, `pdf-lib`, `pdf-parse`, `pdf-to-img`, `mammoth`, `cheerio`, `turndown`, `exceljs`, `xlsx`.
  - Dados/visualização: `@tanstack/react-table`, `recharts`, `@xyflow/react` + `@dagrejs/dagre`, `@dnd-kit/*`.
  - Editor de texto: `@tiptap/react`.
  - Cron: `cron-parser`, `cronstrue`.
  - Datas: `date-fns ^4.1`.
  - Browser automation: `playwright ^1.59` (instalado, mas sem `playwright.config.*`).
  - **Build/deploy**: Dockerfile presente, `railway.json` presente, `output: standalone` no Next config.

## 2. Estrutura de diretórios (até 2 níveis)

```
HERD/
├── .agents/
│   ├── blocks/                 # 34 dirs: _template, agents, apps, audios, campaigns, companies,
│   │                           # contacts, deals, documents, events, experiences, feedbacks, forms,
│   │                           # images, knowledge, links, locations, meetings, messages, notes,
│   │                           # partners, perks, products, routines, rss, services, subscriptions,
│   │                           # tables, tasks, videos, voice, ... (cada um com AGENT.md)
│   ├── tools/                  # 5 dirs: _template, finances, legal, marketing, sales
│   └── skills/
├── .claude/                    # Claude Code config (launch.json, settings.local.json, skills/, worktrees/)
├── .claire/                    # propósito não documentado (sem README)
├── .git/
├── .github/                    # vazio — sem workflows
├── HERD/                       # vault Obsidian (Welcome.md + .obsidian/) — ver nota abaixo
├── docs/                       # criado por esta etapa (discovery/)
├── prisma/
│   ├── schema.prisma           # 114 modelos (~40k linhas)
│   ├── seed.ts
│   └── data/                   # arquivos de seed
├── public/
│   ├── images/
│   ├── integrations/           # 46 subdirs (assets de integrações)
│   └── uploads/
├── scripts/                    # 24 utilitários (create-block.ts, create-tool-category.ts,
│   │                           # enable-rls.sql, etc.)
├── src/
│   ├── app/
│   │   ├── (auth)/             # route group: login etc.
│   │   ├── (editor)/
│   │   ├── (forms)/
│   │   ├── (published)/
│   │   ├── admin/              # área autenticada
│   │   ├── api/                # 62 route handlers
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── robots.ts
│   │   └── globals.css
│   ├── components/             # 51 dirs por feature + ui/ (shadcn primitives)
│   ├── lib/                    # 48 dirs: agents/, blocks/, chat/, marketplace/, products/,
│   │                           # tools/, validators/, utils.ts, api-utils.ts, auth.ts, ...
│   ├── stores/                 # 7 stores Zustand (centralizados, não por feature)
│   ├── types/                  # globais apenas (landing-page.ts, index.ts)
│   ├── hooks/                  # 2 hooks customizados
│   ├── generated/              # arquivos gerados
│   └── middleware.ts
├── AGENTS.md                   # arquitetura blocks + tools (CLAUDE.md é symlink/include disso)
├── CLAUDE.md                   # contém apenas `@AGENTS.md`
├── README.md                   # boilerplate de Next.js
├── Dockerfile
├── railway.json
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
├── postcss.config.mjs
├── components.json             # shadcn config
├── prisma.config.ts
├── package.json
├── package-lock.json
├── .env / .env.local / .env.example
├── .dockerignore
└── .gitignore
```

**Comentário sobre organização**: monorepo simples (não Nx/Turborepo), app único Next.js, **feature-based** dentro de cada camada (`src/components/{feature}/`, `src/lib/{feature}/`, `src/app/api/{feature}/`, `.agents/blocks/{block}/`). Há uma camada de meta-organização sob `src/lib/blocks/` (registro de "blocos" — features de domínio) e `src/lib/tools/` (registro de "tools" — categorias de ferramentas que compõem blocos). Cada bloco/categoria tem manifest declarativo + agente Markdown próprio.

**Sobre o subdir `HERD/`**: é um **vault Obsidian inicializado mas vazio** (`Welcome.md` padrão + `.obsidian/` config). Não tem código, schemas, migrations, ou conteúdo de domínio. Inócuo — registro apenas de presença, sem implicação para a Fase 1.

## 3. Padrões de organização de código

- **Como features novas são organizadas hoje** (padrão observado em `products` e `agents`):
  - Componentes UI: `src/components/{feature}/` (PascalCase em `.tsx`, com `types.ts` colocado).
  - Páginas/rotas: `src/app/admin/blocks/{feature}/page.tsx` para o caminho genérico de bloco; algumas features têm rota dedicada (ex.: `src/app/admin/marketplace/`, `src/app/admin/network/`).
  - API: `src/app/api/{feature}/route.ts` + dynamic segments em `[id]/route.ts`.
  - Lógica: `src/lib/{feature}/` (services, helpers, types).
  - Validators: `src/lib/validators/{entity}.ts` (Zod).
  - Manifest: `src/lib/blocks/blocks/{feature}.block.ts` (`BlockManifest` com name, displayName, domain, types, capabilities, actions[], models[], dependencies, paths).
  - Agente Markdown: `.agents/blocks/{feature}/AGENT.md`.
  - Provider para chat: `src/lib/chat/providers/{feature}.provider.ts` (consumido por `data-retrieval.ts`).
- **Onde ficam tipos compartilhados**: `src/types/` (apenas globais — `index.ts`, `landing-page.ts`). Tipos de feature ficam colocados em `src/components/{feature}/types.ts` ou `src/lib/{feature}/types.ts`.
- **Onde ficam services/use-cases**: `src/lib/{feature}/` — não há diretório `services/` único; cada feature mantém o seu. Há um `src/lib/services/` que abriga integrações externas pontuais (ex.: `salesforce.ts`).
- **Onde ficam handlers de API/route handlers**: `src/app/api/**/route.ts` (Next.js Route Handlers). Helpers de resposta padronizados em `src/lib/api-utils.ts` (`apiSuccess`, `apiError`, `parseAndValidate`). Não há server actions extensivamente usadas para CRUD; o padrão é route handler.
- **Onde ficam componentes UI reutilizáveis**: `src/components/ui/` (primitives shadcn — `button.tsx`, `input.tsx`, `dialog.tsx`, `table.tsx`, `tabs.tsx`, `dropdown-menu.tsx`, `popover.tsx`, etc.). `src/components/layout/` para estrutura (sidebar, sub-panel, top-bar, admin-shell).
- **Padrão de nomenclatura de arquivos**: **kebab-case** para arquivos e diretórios (ex.: `package-financials.ts`, `commission-ledger.ts`, `landing-page-editor-store.ts`). Arquivos `.tsx` que exportam um componente também são kebab-case (`data-table.tsx`, `dropdown-menu.tsx`). Stores: `{name}-store.ts`.

## 4. Camada de dados

- **Localização do schema**: `prisma/schema.prisma` (arquivo único, ~40k linhas, 114 modelos + ~30 enums).
- **Como migrations são geradas e aplicadas**: hoje, **`npx prisma db push`** (script `db:push` em `package.json`). **Não há migrations versionadas** — não existe `prisma/migrations/`. **Decisão (Etapa 1.1)**: migrar para `prisma migrate` com baseline `0_init`.
- **Tabelas/modelos atualmente existentes (lista resumida)**: 114 modelos. Agrupados por área:
  - **Catálogo/produto**: `Product`, `ProductImage`, `Package`, `PackageShareLink`, `PackageTierVariant`, `PackageTierProduct`.
  - **Assinatura/tiers**: `SubscriptionTier`, `TierPricingSnapshot`, `SubscriptionRedemptionRule`, `PerformanceTier`, `RankTier`.
  - **Comissão (sistema atual, single-table ledger)**: `CommissionStructure` (legado), `CommissionTierRate`, `CommissionPlan`, `CommissionPlanRate`, `OverrideRule`, `ClawbackRule`, `PartnerAgreement`, `CommissionLedgerEntry`.
  - **Rede / pessoas**: `NetworkProfile`, `NetworkProfileType`, `NetworkProfileAttribute`, `NetworkProfileHierarchyPath`, `NetworkRole`, `NetworkPermission`, `NetworkRolePermission`, `NetworkProfileRole`, `NetworkProfilePermissionOverride`, `NetworkProfileCompensation`, `NetworkProfileRank`, `NetworkPointsLedger`, `NetworkMonthlyPerformance`, `NetworkTeam`, `NetworkTeamMember`, `NetworkCompensationPlan`, `Department`, `DepartmentMember`, `OrgNode`, `D2DPartner`, `PartnerBrand`, `PartnerTierAssignment`.
  - **Marketplace**: `MarketplaceSection`, `MarketplaceSectionScope`.
  - **Deals/CRM**: `Deal`, `Company`, `Contact`.
  - **Marketing/journeys**: `Campaign`, `Experience`, `LandingPage`, `LandingPageVersion`, `LandingPageSection`.
  - **Agents/IA**: `Agent`, `AgentTierAccess`, `AgentKnowledgeItem`, `AgentSkill`, `AgentTool`.
  - **Conhecimento**: `KnowledgeFolder`, `KnowledgeDocument`, `Document`, `KnowledgeImage`, `KnowledgeVideo`, `KnowledgeAudio`, `KnowledgeLink`, `KnowledgeLinkPage`, `KnowledgeTable`, `KnowledgeTableField`, `KnowledgeTableRecord`, `KnowledgeForm`, `KnowledgeFormSection`, `KnowledgeFormField`, `KnowledgeFormResponse`, `KnowledgeApp`, `KnowledgeAppDataPoint`, `KnowledgeAppSyncLog`, `KnowledgeRSSFeed`, `KnowledgeRSSEntry`, `KnowledgeRSSSyncLog`.
  - **Integrações**: `Integration`, `MemberConnection`, `IntegrationTierMapping`, `IntegrationWebhookEvent`, `IntegrationSyncLog`.
  - **Operação**: `Meeting`, `MeetingParticipant`, `MeetingAgentConfig`, `CalendarEventSync`, `CalendarEvent`, `CalendarEventAttendee`, `Task`, `Routine`, `RoutineRun`, `RoutineStep`, `MessageChannel`, `MessageThread`, `Message`.
  - **Mídia/jobs**: `VoiceJob`, `VideoJob`, `FoundationServiceConfig`.
  - **Conteúdo/perks**: `Perk`, `PerkTierAssignment`, `CommunityBenefit`, `CommunityBenefitTierAssignment`, `Note`, `Feedback`, `Service`.
  - **Financeiro/modelagem**: `FinancialSnapshot`, `OpexCategory`, `OpexMilestoneLevel`, `OpexItem`, `OpexMilestone`.
  - **Configuração**: `Setting`, `Location`.
  - **Chat**: `ChatConversation`, `ChatMessage`.
- **Convenções de naming**:
  - Modelos: **PascalCase singular** (`Product`, `NetworkProfile`, `CommissionLedgerEntry`).
  - Tabelas: nome do modelo (default Prisma) ou snake_case via `@@map()` quando necessário (ex.: `@@map("marketplace_sections")`).
  - Colunas: **camelCase** no Prisma (sem `@map()` na maioria dos casos — Prisma converte).
  - Enums: PascalCase com valores UPPER_SNAKE.
- **Uso de UUID, BIGSERIAL, etc.**: PKs são **UUID** Postgres-nativos: `String @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid`. **Não há BIGSERIAL/autoincrement em PKs**. Money atual: `Decimal @db.Decimal(10, 2)` em todos os 22+ campos monetários (`retailPrice`, `memberPrice`, `costOfGoods`, `monthlyPrice`, `annualPrice`, `flatBonusAmount`, `amount` no ledger de comissão, etc.). **Não existe coluna de currency em lugar nenhum** — single-currency implícito (BRL na prática).

## 5. Navegação do app

- **Onde fica a definição da sidebar**: `src/components/layout/sidebar.tsx`. **Top-level é hand-coded** num array estático `navItems: NavItem[]` (linhas ~82-93). Tipos: `NavLink` (href/label/icon) e `NavGroup` (com `children`). Ícones: `lucide-react`.
- **Estrutura atual da sidebar (entradas principais)**:
  1. Dashboard → `/admin`
  2. Chat → `/admin/chat`
  3. Organization → `/admin/organization/profile`
  4. Knowledge → `/admin/organization/knowledge`
  5. Network → `/admin/network`
  6. Marketplace → `/admin/marketplace`
  7. Agents → `/admin/agents`
  8. Tools → `/admin/tools`
  9. Blocks → `/admin/blocks`
  10. Integrations → `/admin/integrations`
- **Padrão de sub-panels**: `src/components/layout/sub-panel.tsx`. Há um `subPanelRegistry` (estático) e um `hrefToSubPanel` (mapping manual de href → ID de panel) (linhas ~195-204). `getSubPanelIdForPath()` infere o panel a partir do pathname. Sub-panels podem ser:
  - **Estáticos** (ex.: Integrations — registry com 13 categorias hard-coded).
  - **Dinâmicos** (ex.: `BlocksSubPanel` carrega categorias de `/api/settings`; `NetworkSubPanel` carrega de `/api/network/sidebar`; `ToolsSubPanel` carrega de `getAllToolCategories()`; `MarketplaceSubPanel` carrega de `/api/marketplace/sections` com SWR-style cache; `KnowledgeSubPanel` lê settings; `OrganizationSubPanel` registry).
  - Exemplo concreto (Integrations): cada link aponta para `/admin/integrations/{categoria-kebab}` (Billing, Payment, CRM, Analytics, Marketing, Communication, Support, Meetings, Project-Management, Social-Media, AI-Models, Other). A página correspondente vive em `src/app/admin/integrations/{categoria}/page.tsx`.
- **Padrão de rotas/URLs**: kebab-case em todos os segmentos; `[id]` para UUIDs; `[slug]` para slugs textuais; route groups `(auth)`, `(editor)`, `(forms)`, `(published)`. Blocks expostos em rota genérica `/admin/blocks/[blockName]`. Tools em `/admin/tools/[categoryName]/[toolName]`.
- **Como features são "registradas" na navegação**:
  - **Blocks**: criando `src/lib/blocks/blocks/{name}.block.ts` + adicionando em `src/lib/blocks/registry.ts`. O sub-panel de Blocks é dinâmico — pega a lista do registry/settings.
  - **Tools**: criando `src/lib/tools/categories/{name}.category.ts` + registrando em `src/lib/tools/registry.ts` + ícone em `category-meta.ts` (script `npx tsx scripts/create-tool-category.ts`).
  - **Top-level (sidebar principal)**: edição manual de `navItems` em `sidebar.tsx`, mais entrada em `hrefToSubPanel` se houver sub-panel.

## 6. Design system

- **Onde ficam os tokens (cores, tipografia, spacing)**: `src/app/globals.css`, dentro de blocos `@theme inline { ... }` (Tailwind v4 — sem `tailwind.config.*` separado). Cores em **oklch**. Tokens principais:
  - Brand: `--color-brand: #FF0000` (Bucked Up Red), com escala 50–900, foreground branco.
  - Indicadores financeiros: `--color-positive: #22C55E`, `--color-caution: #EAB308`, `--color-negative: #EF4444`.
  - Raios: `--radius: 0.625rem` com derivados sm/md/lg/xl/2xl/3xl/4xl.
  - Sombras: `--shadow-card`, `--shadow-modal`.
  - Tipografia: variáveis para peso de heading/body, fator de densidade, velocidade de transição.
  - Tema light vs `.dark` invertem `--background`, `--sidebar`, etc.
- **Onde ficam os componentes primitivos (Button, Input, etc.)**: `src/components/ui/` — primitives baseados em shadcn:
  - `badge.tsx`, `button.tsx`, `card.tsx`, `command.tsx`, `data-table.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`, `input-group.tsx`, `label.tsx`, `popover.tsx`, `scroll-area.tsx`, `select.tsx`, `separator.tsx`, `sheet.tsx`, `skeleton.tsx`, `slider.tsx`, `sonner.tsx`, `switch.tsx`, `table.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`.
- **Padrão de uso (Tailwind? CSS-in-JS? CSS modules?)**: **Tailwind v4** exclusivamente, com `class-variance-authority` + `clsx` + `tailwind-merge` (helper `cn()` em `src/lib/utils.ts`). Sem CSS-in-JS, sem CSS modules.
- **Skills/MDX/Storybook: como o design system é documentado**: **Não há Storybook**, não há MDX de design, não há diretório `.storybook/`. A documentação do design system é implícita — vive nos próprios componentes em `src/components/ui/` e nos tokens em `globals.css`.

## 7. Testes

- **Frameworks de teste em uso**: **nenhum framework configurado**. `playwright ^1.59.1` está nas dependências, mas não há `playwright.config.*`, nem Jest, nem Vitest. Há **um único** arquivo de teste solto: `src/lib/package-financials.test.ts` — provavelmente nunca executado por falta de runner.
- **Localização dos testes (co-located? pasta separada?)**: o único exemplo é **co-located** ao código (`src/lib/package-financials.test.ts` ao lado de `package-financials.ts`).
- **Cobertura observada**: efetivamente **zero**. Sem script `test` em `package.json`. Sem CI rodando. Sem relatórios.
- **CI presente?**: **Não**. `.github/` existe mas `.github/workflows/` está vazio. **Decisão (Etapa 1.1)**: introduzir Vitest + script `test` + primeiro teste real (helper de money/currency). Possível workflow GitHub Actions (lint+test) na Etapa 1.1 ou 1.2.

## 8. Integrações externas presentes

- **Gateway de pagamento (qual? em qual estado?)**: **Nenhum**. Não há Stripe, MercadoPago, Pagar.me, Asaas, ou similar instalado nem referenciado. Será introduzido na Fase 2 (Marketplace + Transações Diretas), conforme briefing.
- **Auth provider**: NextAuth 5 beta com Credentials (email/senha + bcrypt). Sem OAuth social, sem provedores externos.
- **Observability (logs, métricas, tracing)**: **Nenhum**. Sem Sentry, Datadog, OpenTelemetry, PostHog, web-vitals reporting (a lib `web-vitals` está instalada mas seu wiring final não foi identificado — pode estar em uso interno).
- **Filas/eventos (alguma implementação de event bus já?)**: **Nenhuma**. Sem BullMQ, Inngest, Trigger.dev, SQS, Kafka. **Decisão**: implementar **outbox pattern em Postgres** (tabela `domain_events`) na Fase 1.
- **Outras**:
  - `@anthropic-ai/sdk ^0.82` — chat/agentes IA (`src/lib/chat/`, `src/lib/agents/`, rota `/api/chat`).
  - `@deepgram/sdk ^5.0` — transcrição de voz.
  - `playwright ^1.59` — automação de browser (uso provável: scraping/processamento, não teste).
  - `fluent-ffmpeg`, `pdf-lib`, `pdf-parse`, `pdf-to-img`, `mammoth`, `cheerio`, `turndown`, `exceljs`, `xlsx` — pipeline de processamento de mídia/documentos.
  - `cron-parser`, `cronstrue` — agendamento (provável uso em Routines).
  - Salesforce: existe um `src/lib/services/salesforce.ts` referenciando `SalesforceOpportunity`, indicando integração externa parcial com Salesforce (não foi inspecionado a fundo).

## 9. Conceitos do nosso domínio que já existem (parcial ou totalmente)

| Conceito | Estado | Detalhe |
|---|---|---|
| **Block** (entidade fundamental) | **Existe parcialmente** — como **arquitetura**, não como modelo de dados. Manifests em `src/lib/blocks/blocks/*.block.ts` (37 blocks registrados); registry em `src/lib/blocks/registry.ts`. Cada bloco descreve `name`, `displayName`, `domain`, `types[]`, `capabilities[]`, `actions[]` (com JSON Schema), `models[]` (Prisma), `dependencies[]`, `paths{}`. **Não há tabela `blocks`**. Para a nova arquitetura, "Block" como entidade do domínio Marketplace ainda precisa ser modelado — provável colisão de nomes a resolver. |
| **Profile** (perfis da rede) | **Existe completo** — `NetworkProfile` (linha ~1996 do schema) é o modelo unificado de pessoa (usuário/membro/parceiro). Tem `parentId` self-ref + atributos custom (`NetworkProfileAttribute`) + tipo (`NetworkProfileType`) + roles (`NetworkProfileRole`) + permissões (`NetworkProfilePermissionOverride`) + planos (`NetworkProfileCompensation`) + rank (`NetworkProfileRank`) + pontos (`NetworkPointsLedger`) + performance mensal (`NetworkMonthlyPerformance`). |
| **Hierarquia de rede** (níveis Global → Canal) | **Existe parcialmente** — hierarquia genérica via `NetworkProfile.parentId` self-join + tabela materializada `NetworkProfileHierarchyPath` (ancestor/descendant). **Não há entidade explícita "Channel"** ou níveis nomeados (Global/Mercado/Empresa). Os "níveis" hoje vivem implícitos no tipo de profile e nas profundidades da hierarquia. |
| **Marketplace** (como conceito de exposição) | **Existe parcialmente** — `MarketplaceSection` (~linha 2932) com `blockNames String[]`, `layout Json`, status, + `MarketplaceSectionScope` para regras de visibilidade. Página em `src/app/admin/marketplace/`, sub-panel dinâmico, helpers em `src/lib/marketplace/`. **Falta**: o conceito de **transação** sobre o marketplace; itens são agregados via array de nomes de blocos, sem tabela de Listing. |
| **Listing** (exposição com preço/escopo) | **Não existe**. |
| **Offering** (modalidade de transação) | **Não existe**. |
| **Transaction** | **Não existe** como modelo de domínio. Apenas a API `prisma.$transaction()` para atomicidade. |
| **Opportunity** (programa de geração de renda) | **Existe parcialmente** — modelo `Deal` (~linha 3018) é genérico (deal/oportunidade comercial), **sem stages, sem template, sem claims**. A interface `SalesforceOpportunity` em `src/lib/services/salesforce.ts` se refere ao conceito Salesforce, não a um modelo nativo HERD. |
| **OpportunityTemplate** | **Não existe**. |
| **OpportunityStage** | **Não existe** (Deal não tem stages tipadas). |
| **Claim** (engajamento de parceiro) | **Não existe**. |
| **LeadJourney** | **Não existe**. Há `Experience` como journey genérico de usuário, mas não específico para leads. |
| **StageCompletion** | **Não existe**. |
| **CommissionRule** | **Existe parcialmente** — substituído por `CommissionPlan` + `CommissionPlanRate` + `OverrideRule` + `ClawbackRule` (linhas ~845-890). Não é versionado por `effective_date` no padrão que vamos precisar; a versionagem atual é mais leve. |
| **CommissionEntry** | **Existe parcialmente** — `CommissionLedgerEntry` (~linha 895) cobre conceitualmente, mas é **single-table** (sem partidas dobradas). Campos: `amount Decimal(10,2)`, `entryType` (EARNED/HELD/RELEASED/CLAWED_BACK/ADJUSTED), `source` (UPFRONT_BONUS/RESIDUAL/OVERRIDE/ACCELERATOR_BONUS/CLAWBACK/MANUAL_ADJUSTMENT), `periodStart/End`, `metadata Json`. **Não atende ao princípio do briefing**. |
| **Ledger** (accounts, journal_entries, journal_lines) | **Existe parcialmente** — apenas `CommissionLedgerEntry`, single-table. **Não existe** tabela de `accounts`, nem `journal_entries`, nem `journal_lines`. **Não há partidas dobradas, nem constraint de soma-zero, nem versionamento de regras vinculado a entries.** É o gap central a fechar na Fase 1. |
| **Plan** (Plano de parceiro) | **Existe parcialmente, com sobreposição** — três modelos competem pelo termo "Plan": `CommissionPlan` (estrutura de comissão), `NetworkCompensationPlan` (plano de compensação no nível da rede), `SubscriptionTier` (tier de assinatura, conceitualmente "plano" para o cliente). Para a Fase 6, "Plano de Parceiro" provavelmente vai virar `PartnerPlan` ou `PartnershipPlan` para evitar colisão. |
| **Enrollment** (inscrição em plano) | **Não existe** como entidade. Hoje a "inscrição" acontece via `NetworkProfileCompensation` (FK profile→plan) + `PartnerTierAssignment` para tiers. Sem semântica de modalidade aberta/exclusiva, sem inscrições paralelas. |
| **Tier** | **Existe completo, em três variantes** — `SubscriptionTier` (assinatura), `PerformanceTier` (tier de performance), `RankTier` (rank/gamificação), `CommissionTierRate` (taxa por tier de comissão). |

## 10. Pontos de atenção

- **Working tree atualmente sujo** (no momento da geração deste relatório): rename `solutions/` → `tools/`, deletions em `src/app/admin/foundations/` e `src/app/admin/network/` (subpaths), `prisma/schema.prisma` modificado, `package.json` e `next.config.ts` modificados, vários `src/app/admin/integrations/*/page.tsx` modificados. **O usuário vai commitar/limpar isso antes da Etapa 1.1**. Bug latente correlato: `src/components/layout/sidebar.tsx` ainda referencia `foundations` em `openGroups` apesar do diretório ter sido apagado — provavelmente sai no mesmo commit.
- **Money sem currency em todo o projeto**. Conflito com o princípio "Money é tupla" do briefing. Resolvido: o **novo ledger** (Fase 1) usa `amount_cents BIGINT + currency CHAR(3)`; o legado mantém `Decimal(10,2)` e a conversão acontece na borda via helper centralizado (`formatMoney`/`parseMoney`), a ser criado na Etapa 1.1.
- **Migrations schema-only** (`prisma db push`, sem pasta `migrations/`). Inadequado para sistema financeiro auditável. **Decisão**: migrar para `prisma migrate` na Etapa 1.1, com baseline `0_init` capturando o estado atual.
- **`CommissionLedgerEntry` single-table** preexistente. **Decisão**: o novo ledger de partidas dobradas é construído do zero como sistema independente; o antigo continua existindo mas **não recebe novas escritas** a partir da Fase 1 (sunset path, sem migração de dados na Fase 1). Migração eventual fica para fase tardia (8 ou similar).
- **Nenhum event bus instalado**. **Decisão**: outbox pattern em Postgres (`domain_events`) — sem dependência externa nesta fase. Worker simples lê não-processados, dispatcha, marca processado. Idempotência via `idempotency_key` UNIQUE.
- **Nenhum framework de teste configurado**, em conflito direto com a obrigatoriedade de testes de invariante para tudo que toca ledger. **Decisão**: Vitest configurado na Etapa 1.1.
- **Nenhuma CI**. Sem execução automática de testes, princípios de invariante perdem força. Possível workflow GH Actions (lint+test) na Etapa 1.1 ou 1.2.
- **"Plan" sobrecarregado em 5 modelos**: `CommissionPlan`, `NetworkCompensationPlan`, `SubscriptionTier`, `PerformanceTier`, `RankTier`. Colisão a resolver na Fase 6 — provável `PartnerPlan`/`PartnershipPlan` para o conceito novo.
- **`MarketplaceSection.blockNames String[]` é incompatível com `Listing`**. A Fase 2 vai precisar migrar do modelo "seção referencia blocos por nome num array" para "listing com FK para bloco/produto/etc.". Anotado para Fase 2.
- **`Deal` é genérico** (sem stages tipadas, sem template). A Fase 3 (Opportunities) provavelmente vai **reshape** o `Deal` ao invés de depreciar — Deal vira a base sobre a qual `OpportunityTemplate` e `OpportunityStage` são construídos.
- **Subdir `HERD/`** na raiz: **vault Obsidian vazio** (Welcome.md padrão + `.obsidian/`). Inócuo para a arquitetura. Apenas registrado.
- **Sem Node version pinado** (`.nvmrc`/`engines`). Risco baixo, mas vale fixar quando entrarmos em CI.

## 11. Perguntas em aberto

**Todas as 7 perguntas iniciais identificadas durante a descoberta já foram respondidas pelo usuário** no documento `02_ETAPA_0_RESPOSTA_DECISOES.md`. Estão registradas abaixo como **decisões fechadas** (referência, não dúvida):

1. **Ledger novo vs `CommissionLedgerEntry` existente** → **Coexistência com sunset path**. Novo ledger construído do zero; antigo vira read-only de fato (sem novas escritas a partir da Fase 1); sem migração de dados na Fase 1.
2. **`amount_cents BIGINT` vs `Decimal(10,2)`** → **Novo ledger usa `amount_cents BIGINT`**. Resto do projeto mantém `Decimal(10,2)`. Conversão na borda via helper centralizado.
3. **`currency CHAR(3)`** → **Sim, desde a Etapa 1.1**, com default explícito BRL. Constraints de balance por (journal_entry, currency). Nenhuma operação cross-currency sem conversão explícita.
4. **`prisma db push` → `prisma migrate`** → **Sim, na Etapa 1.1**, com baseline `0_init`. CLAUDE.md atualizado para registrar que `db push` está aposentado.
5. **Event bus** → **Outbox pattern em Postgres** (tabela `domain_events`), worker simples. Sem Inngest/Trigger.dev nesta fase.
6. **Test framework** → **Vitest**, configurado na Etapa 1.1.
7. **Subdir `HERD/`** → **Inspecionado**. É um **vault Obsidian vazio** (Welcome.md + .obsidian/). Inócuo.

**Nenhuma pergunta nova surgiu da inspeção do `HERD/`.** Considero a base de descoberta fechada — pronto para receber a Etapa 1.1.
