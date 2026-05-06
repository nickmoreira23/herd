# AUDIT — Meeting Prep com Multi-Agente / Role-Play

Auditoria somente leitura do projeto HERD para guiar a integração de uma nova ferramenta agnóstica de preparação para reuniões com ativação de especialistas e role-play conversacional.

> Branch atual: `dna-talks`. Working tree contém alterações não commitadas em finanças (não relacionadas a esta auditoria).

---

## 1. Stack & Dependências

### Núcleo
- **Next.js 16.2.1** + **React 19.2.4** (App Router; "This is NOT the Next.js you know" — checar `node_modules/next/dist/docs/` antes de assumir API).
- **TypeScript ^5** (strict; alias `@/*` → `./src/*`).
- **Package manager:** npm (lockfile v3).

### Banco & Persistência
- **PostgreSQL** via **Prisma ^7.6.0** (schema único em `prisma/schema.prisma`, ~102KB).
- Workflow oficial: `npm run db:migrate` (nunca `db push`).
- **Outbox de eventos** (`domain_events`) com retry e worker dedicado.

### Autenticação
- **next-auth ^5.0.0-beta.30** (Credentials + JWT). Super-admin shortcut via env. Sessão persistida em cookie `authjs.session-token`.

### IA / LLM
- **@anthropic-ai/sdk ^0.82.0** (único provider — sem Vercel AI SDK, sem LangChain).
- **@modelcontextprotocol/sdk ^1.29.0** (orquestração via MCP, manifesto em `mcp/generated/`).
- **@deepgram/sdk ^5.0.0** (TTS).

### UI
- **shadcn/ui** (radix + `@base-ui/react ^1.3.0`) em `src/components/ui/` (~26 componentes).
- **Tailwind v4** (`@tailwindcss/postcss`); helper `cn()` em `src/lib/utils.ts`.
- **lucide-react ^1.7.0** para ícones.
- **recharts**, **mermaid**, **@xyflow/react** para visualizações.
- **sonner** para toasts (com helpers em `src/lib/i18n/notify.ts`).
- **Tiptap ^3.22.4** (rich text editor já no projeto — útil para briefings).
- **@dnd-kit/\*** para drag-and-drop.
- **playwright ^1.59.1**.

### Estado & Formulários
- **Zustand ^5.0.12** em `src/stores/` (todos `"use client"`).
- Sem `react-hook-form`. Validação via **Zod** (Zod 3 no app; Zod 4 isolado em `schemas/` e `scripts/build-*.ts`).
- Tabelas: **@tanstack/react-table v8** via `src/components/ui/data-table.tsx`.

### Scripts notáveis
`db:migrate`, `db:seed`, `db:seed:ledger`, `worker:domain-events`, `gen:feature`, `gen:schemas`, `gen:mcp`, `gen:xrefmap`, `gen:llms-txt`, `gen:glossary`, `check:invariants`, `check:i18n`, `validate:handbook`, `mcp:dev`.

---

## 2. Arquitetura

### Estrutura (resumo 2 níveis)

```
src/
├── app/
│   ├── (auth)/          # login
│   ├── (editor)/
│   ├── [locale]/        # rotas localizadas
│   ├── admin/           # núcleo do produto (~27 segmentos)
│   ├── api/             # ~64 endpoints REST (route handlers)
│   └── subscribe/
├── components/          # ~58 pastas espelhando domínios
│   ├── ui/              # shadcn primitives
│   ├── layout/          # AdminShell, TopBar, sidebar, sub-panel
│   ├── chat/            # 9 componentes de chat / streaming
│   └── tools/           # category-landing, tool-coming-soon
├── lib/                 # ~53 pastas de domínio
│   ├── agents/          # runtime, prompt-builder, handlers, tools (multimodal)
│   ├── blocks/          # registry + 29 manifests
│   ├── tools/           # registry + categories (legal/marketing/sales/operations/finances)
│   ├── chat/            # action-execution, providers, orchestrator
│   ├── domain-events/   # handler-registry
│   ├── i18n/            # locales, messages, helpers, notify
│   ├── ledger/          # double-entry contábil
│   ├── meetings/        # meeting-summarizer
│   └── auth.ts, prisma.ts
├── stores/              # zustand
├── middleware.ts        # gate /admin + locale prefix
└── ...
.agents/                  # AGENT.md por block + tool category + skills
docs/handbook/            # 5 layers (networks/solutions/tools/blocks/integrations) + _meta
prisma/schema.prisma      # fonte única de verdade do modelo
mcp/generated/            # MCP manifests (gerado)
scripts/                  # gen:feature, create-block, validate-*
```

### Padrão arquitetural

**Monolito Next.js 16 com camadas explícitas e doc-first:**

1. **Blocks** (29) — módulos auto-contidos com manifesto em `src/lib/blocks/blocks/{name}.block.ts` declarando types, capabilities, actions e schema. Registrados em `src/lib/blocks/registry.ts` com mapas `name→manifest`, `type→manifest`, `action→{block, action}`.
2. **Tools** — camada de composição organizada por categoria (Legal, Marketing, Sales, Operations, Finances). Manifestos em `src/lib/tools/categories/{cat}.category.ts`.
3. **Chat orchestrator** — sistema de runtime em `src/lib/chat/action-execution.ts` que expõe duas tools ao LLM: `search_data` (DataProviders) e `execute_action` (roteia para block/tool actions). System prompt construído em `src/lib/agents/prompt-builder.ts` (base + skills habilitadas + knowledge cap 10 + contexto runtime).
4. **Agent runtime** — em `src/lib/agents/runtime.ts`: `messages.stream()` com detecção de `tool_use`, suporte multimodal (attachments/imagens/docs), tools customizadas via DB (`AgentTool`).
5. **Handlers** — agentes específicos em `src/lib/agents/handlers/` (plan-agent, projections-agent etc.) — pattern de "specialist agent com toolset próprio".
6. **Domain events outbox** — eventos persistidos em transação na mudança de estado, processados por worker (`npm run worker:domain-events`); registry estático em `src/lib/domain-events/handler-registry.ts`.

### Server vs Client; API vs Server Action
- Páginas em `src/app/admin/**/page.tsx` são **server components** por padrão — fetch via Prisma direto; passam dados para client components.
- Client components só onde precisa de hook/state (Zustand, contexto, animação).
- **API routes dominam** (`src/app/api/{domain}/route.ts`); não foram detectadas server actions explícitas (`"use server"`).

### Convenções
- **Nomes de arquivo:** kebab-case (rotas, libs); PascalCase para componentes React.
- **i18n obrigatório** em strings user-facing (`useT()` em client, `t()` em server) — ESLint reforça em paths estritos.
- **Erros tipados** com `code: string` traduzido via `translateError`/`translateErrorWithT`.
- **Toasts** via `notifySuccess/Error/Info/Warning` em vez de `toast.*` direto.
- **Formatadores** sempre via helpers (`formatDate`, `formatNumber`, `formatMoney`, `formatRelativeTime`) — nunca `Intl.*` direto.

### Documentação (Handbook)
4 artefatos por feature: `pt-BR.md` + `en-US.md` + `feature.yml` (canônico) + (opcional) `SKILL.md` + (opcional) MCP tool. UID estável `herd.{level}.{category}.{feature-id}`. Bilingual co-change checado por Danger.js.

---

## 3. Modelo de Dados

### Identidade & multi-tenant (sem `tenantId` explícito — multi-tenancy é grafo via NetworkProfile)

| Modelo | Papel |
|---|---|
| `NetworkProfile` | Usuário humano. `firstName`, `lastName`, `email`, **`locale`**, `parentId` (downline). |
| `NetworkProfileType` | Categoria do profile (ADMIN, REP…). Define rede (INTERNAL/EXTERNAL), papéis padrão. |
| `NetworkRole`, `NetworkProfileRole` | RBAC slug-based (join table). |
| `NetworkPermission`, `NetworkRolePermission`, `NetworkProfilePermissionOverride` | Permissões resource+action; overrides ALLOW/DENY por usuário. |
| `NetworkProfileHierarchyPath` | Caminho ancestral pré-computado. |
| `NetworkTeam`, `Department` | Times/departamentos. |

### Conversacional / IA (núcleo reutilizável)

| Modelo | Papel | Campos chave |
|---|---|---|
| `Agent` | Definição do agente (persona, system prompt, modelo). | `systemPrompt`, `temperature`, `modelId`, `role` (ORCHESTRATOR\|SPECIALIST\|BLOCK), `agentCategory`, `isConversational` |
| `ChatConversation` | Sessão de chat. | FK `userId` → NetworkProfile, FK `agentId` → Agent, `title`, `model` |
| `ChatMessage` | Mensagem individual. | `role`, `content`, `sources` (JSON), `artifacts` (JSON), `attachments` (JSON), `mediaOutputs` (JSON) |
| `AgentTool` | Tool custom anexada ao agente (HTTP endpoint + auth). | usado em `runtime.ts` |

### Reuniões / eventos (já existe!)

| Modelo | Papel |
|---|---|
| `Meeting` | `title`, `meetingType` (VIRTUAL\|IN_PERSON), `platform` (ZOOM\|GMEET\|…), `status` (SCHEDULED\|RECORDING\|PROCESSING\|READY\|ERROR), `transcript`, `summary`, `actionItems` (JSON), `keyTopics`, `participantCount`, `externalBotId` (Recall.ai). |
| `MeetingParticipant` | Participantes — `name`, `email`, `speakerLabel`, `role`. Cascade. |
| `MeetingAgentConfig` | Configurações globais do agente de meetings (auto-join, transcrição, sumarização, regras). |
| `CalendarEvent`, `CalendarEventAttendee` | Integração de calendário (secundário). |

### Outros
- `DomainEvent` — outbox `(aggregateType, aggregateId, eventType, payload, idempotencyKey, processingState, attempts, lastError)`.

### Reaproveitamento para Meeting Prep
| Status | Modelos |
|---|---|
| **Reusar como está** | `NetworkProfile`, `Agent`, `ChatConversation`, `ChatMessage`, `Meeting`, `MeetingParticipant`, `DomainEvent` |
| **Estender** | `MeetingAgentConfig` (`rolePlayEnabled`, `personaConfig` JSON, `briefingStyle`); `Meeting` (`prepBriefId`, `rolePlayStatus`) |
| **Criar** | `MeetingPrepBrief` (gerado por LLM, vinculado a Meeting); `MeetingPrepRolePlaySession` (Meeting × Agent[] como elenco, transcript do role-play, feedback); opcional `MeetingPrepTemplate` (workflows reutilizáveis) |

---

## 4. Autenticação & Multi-Tenant

- **next-auth 5** com Credentials provider; JWT session strategy; callbacks enriquecem token (role, dbId).
- **Super-admin shortcut**: env vars `ADMIN_EMAIL`/`ADMIN_PASSWORD` cria/atualiza profile no primeiro login.
- **Usuário regular**: bcrypt hash; PENDING ativa no primeiro login.
- **Middleware** (`src/middleware.ts`): `/admin/*` requer login; `/login` redireciona logado para `/admin`. Reescrita de prefixo de locale para superfícies públicas (`/p`, `/f`, `/explore`, `/shared`).
- **Multi-tenancy**: SEM `tenantId`/`workspaceId` em entidades. Isolamento via `NetworkProfile.profileTypeId` e RBAC com permission override por usuário. (Implicação: novas tabelas devem seguir o padrão — vincular a `NetworkProfile` quando relevante; sem coluna `workspaceId` artificial.)
- **Locale persistido em 2 lugares**: cookie `locale` (1 ano) + `NetworkProfile.locale`.

---

## 5. Integrações de IA Existentes

### Padrão geral
- **Anthropic SDK direto** — sem wrapper. Streaming via `messages.stream()`. Tool-use detectado por `stop_reason === "tool_use"`.

### Arquivos load-bearing

| Arquivo | Função |
|---|---|
| `src/lib/agents/runtime.ts` | Runtime principal: stream + tool-use loop + multimodal. Carrega `Agent` do DB; constrói tools a partir de `AgentTool`. |
| `src/lib/agents/prompt-builder.ts` | Compõe system prompt: base + skills + knowledge (cap 10) + contexto runtime + behavior rules. Suporta tipos ORCHESTRATOR/SPECIALIST/BLOCK. |
| `src/lib/chat/action-execution.ts` | Define a tool `execute_action` exposta ao LLM; roteia para block actions e tool actions; retorna `ActionResult`. |
| `src/lib/blocks/registry.ts` | `buildActionCatalog()` gera resumo textual dos actions para injetar no system prompt. |
| `src/app/api/chat/conversations/[id]/messages/route.ts` | Endpoint que stream Claude e persiste user/assistant messages com sources/artifacts/media. |
| `src/app/api/chat/agents/[agentKey]/messages/route.ts` | Variante por agentKey. |

### Handlers (specialist agents)
`src/lib/agents/handlers/` — `plan-agent.ts` (10+ tools de plans/CRUD), `projections-agent.ts` (financial), entre outros. Cada handler segue padrão "specialist com toolset próprio".

### Tools multimodais
`src/lib/agents/tools/`: `image-generation-tool.ts`, `vision-tool.ts`, `tts-tool.ts` (Deepgram), `video-generation-tool.ts`, `presentation-tool.ts`, `media-processor.ts` (`buildMultimodalContent`).

### Outras integrações
- `src/lib/images/image-describer.ts`
- `src/lib/feeds/rss-filter.ts`
- `src/lib/routines/runner.ts`
- `src/lib/meetings/meeting-summarizer.ts` ⭐ — já existe sumarizador de reuniões; ponto de partida para o "post-meeting" do prep tool.
- `src/lib/documents/text-extractor.ts`
- `src/app/api/financials/remix/route.ts`, `src/app/api/routines/preview/route.ts`, `src/app/api/packages/[id]/ai-*.ts`

### Convenções de prompt
- Sistema modular: base + skills habilitadas + KB items.
- "Behavior rules" injetadas (confirmation tier, navegação, persistência).
- Nenhum prompt caching detectado nas integrações Claude — possível ganho rápido.

---

## 6. UI / Design System

- **shadcn/ui** + **Tailwind v4** + **lucide-react**.
- **Tema** com CSS variables `oklch()` em `globals.css`; dark mode via `@custom-variant`. Tokens custom: brand (Bucked Up Red), positive/caution/negative, sidebar, chart colors.
- **Animação:** apenas CSS (`@keyframes`). Sem framer-motion.

### Layout & navegação
- **AdminShell** em `src/app/admin/layout.tsx`: `<Providers><TooltipProvider><ThemeInitializer><BrandKitProvider><Suspense><AdminShell><TopBar><MainContent>`.
- **`page-header.tsx`** — breadcrumb + title + description + action slot.
- **`sub-panel.tsx`** (~42KB) — painel lateral direito que detecta pathname; usado para drill-down de blocks/tools/handbook.
- Sidebar (`src/components/layout/sidebar.tsx`) tem 3 seções:
  1. **Top:** Dashboard, Chat, Agents, Network, Knowledge, Marketplace, Ledger.
  2. **Tools:** Legal, Marketing, Sales, Operations, Finances (ordem fixa em `nav-config.ts: CATEGORY_ORDER`).
  3. **Bottom:** Blocks, Integrations, Roadmap, Handbook, Help Center.

### Padrão de página
- `page.tsx` server component (async, fetch Prisma) → componente client `*-client.tsx` para interatividade.
- Detalhe: `[id]/page.tsx` aplica mesmo padrão.
- Create/Edit: **Sheet** (drawer) lateral, ex.: `tier-create-sheet.tsx`.

### Chat UI (existente — reusable)
`src/components/chat/`:
- `chat-interface.tsx` — orchestrador principal (message list + streaming + input).
- `chat-message.tsx` — renderiza role + sources + artifacts.
- `chat-input.tsx` — input com model selector.
- `chat-sidebar.tsx` — histórico de conversas.
- `chat-voice-interface.tsx` (~19KB) — modo voz/TTS.
- `thinking-steps.tsx` — render de blocks de thinking.
- `model-selector.tsx`, `chat-empty-state.tsx`.

Streaming usa hooks `streamingContent`, `streamingSources`, `streamingArtifacts`, `streamingSteps` — sem typewriter; render à medida que chega.

### Forms & tables
- Forms: state + Zod (sem react-hook-form). Padrão em `src/components/organization/locations-form.tsx`.
- Tables: TanStack Table v8 via `data-table.tsx`.

---

## 7. Pontos de Integração para a Nova Feature

### Onde plugar (paths canônicos)

| Artefato | Caminho |
|---|---|
| Rotas admin | `src/app/admin/tools/meeting-prep/page.tsx`, `[id]/page.tsx`, `new/page.tsx` |
| UI components | `src/components/tools/meeting-prep/` |
| Tool manifest | `src/lib/tools/tools/meeting-prep.tool.ts` (a criar) **ou** registrar em `src/lib/tools/categories/operations.category.ts` |
| Registro | `src/lib/tools/registry.ts` (add ao mapa de operations) |
| API endpoints | `src/app/api/tools/meeting-prep/...` |
| Agent definition | `.agents/tools/operations/AGENT.md` (já existe) — adicionar seção; ou skill em `.agents/skills/feature-tool-meeting-prep/SKILL.md` |
| Handbook | `docs/handbook/tools/operations/meeting-prep/{feature.yml, pt-BR.md, en-US.md}` |
| Prisma | adicionar models ao `prisma/schema.prisma` + `npm run db:migrate` |
| Domain events | adicionar event types + handler em `src/lib/domain-events/handler-registry.ts` |

### Reaproveitamento (alto valor)
1. **`Meeting` + `MeetingParticipant`** já existem. Brief & role-play vinculam a `Meeting` via FK.
2. **`Agent`** com `role: SPECIALIST` é o veículo para personas de role-play. Cada participante simulado = um `Agent` configurado.
3. **`ChatConversation` + `ChatMessage`** servem tanto pro chat de geração de brief quanto pro role-play multi-agente.
4. **Runtime `src/lib/agents/runtime.ts`** já suporta multimodal e tool-use — basta criar handlers/personas. **Multi-agent** é fácil pois orchestrator pode invocar specialists via `execute_action`.
5. **`src/lib/chat/action-execution.ts`** estende com novas actions (`generate_meeting_brief`, `start_role_play`, `summarize_role_play`, `extract_followups`).
6. **UI de chat (`src/components/chat/*`)** reutilizável — adicionar variantes `role-play-interface.tsx` que aceita lista de personas e turn-taking.
7. **`src/lib/meetings/meeting-summarizer.ts`** → modelo para post-prep summarizer (extração de action items).
8. **Tiptap** disponível para editor do brief (rich text).
9. **i18n + notify helpers + page-header + sub-panel + data-table** prontos.

### O que precisa ser criado
- **Models Prisma**: `MeetingPrepBrief`, `MeetingPrepRolePlaySession`, `MeetingPrepRolePlayMessage` (ou reusar `ChatMessage` com FK polimórfica), opcional `MeetingPrepTemplate`.
- **Lógica multi-agente**: turn-taking entre N personas com regras (rodízio, mediação, terminator); orquestração no runtime ou em `src/lib/orchestrator/` novo.
- **Persona library**: catálogo de personas configuráveis (ex.: "CFO cético", "compliance officer", "early adopter") como `Agent` records seedados ou template-based.
- **Brief template engine**: prompt prebuilt + tool-use para fetchar contexto (network profile, meeting metadata, knowledge base).
- **UI**: editor de prep, seletor de elenco, transcript de role-play, painel de feedback/insights pós-sessão.
- **Domain events**: `meeting-prep.brief-generated`, `meeting-prep.role-play-completed`, `meeting-prep.followups-extracted`.

---

## 8. Riscos & Débito Técnico

1. **Versão pré-release**: `next-auth 5.0.0-beta.30` e `Next.js 16` muito recentes — APIs podem mudar; AGENTS.md alerta para checar `node_modules/next/dist/docs/`.
2. **Zod 3 vs 4 split**: cuidar imports — código novo de schemas/scripts usa `"zod/v4"`; código de validação app continua `"zod"` (Zod 3).
3. **Lint debt em legacy paths** (`src/app/admin/**`, `src/components/**`, `src/lib/services/**`) com regras downgraded a warn. **Não adicionar `meeting-prep` ao override** — código novo é strict.
4. **Multi-tenancy implícito (sem `tenantId`)**: qualquer model novo precisa decidir conscientemente o vínculo a `NetworkProfile` (ex.: `ownerProfileId`). Sem isso, leak entre redes é possível.
5. **`MeetingAgentConfig` parece global**: confirmar se é por-network ou single-row antes de estender.
6. **Sem prompt caching** nas integrações Claude — adicionar logo na criação evita refactor depois (system prompts longos compartilhados entre invocações).
7. **CI gates do Handbook** falham PR sem `feature.yml` válido + bilingual co-change. Planejar artefatos antes do código.
8. **Domain events handler registry estático** — adicionar handler exige import explícito; não esquecer.
9. **Sem testes E2E aparentes para chat/streaming**: regressões em multi-agente difícil pegar; planejar testes mesmo que mínimos.
10. **`buckCost` e outros campos financeiros estão em mudança ativa** na branch `dna-talks` — não bloqueia o prep tool, mas evite tocar `financial-engine.ts`.

---

## 9. Recomendação de Abordagem

1. **Comece pelo Handbook**: rode `npm run gen:feature` para `tools/operations/meeting-prep` e preencha `feature.yml` + perspectivas Business/Architecture em pt-BR e en-US **antes** de código. CI vai exigir.
2. **Modele os dados primeiro**: 3 tabelas mínimas — `MeetingPrepBrief`, `MeetingPrepRolePlaySession`, `MeetingPrepRolePlayParticipant` (Agent×Session com `personaName`, `personaPrompt`, `seatOrder`). Migration via `db:migrate`.
3. **Reuse `Agent` para personas**: crie `Agent` records com `role: SPECIALIST` e `agentCategory: "meeting-prep-persona"`. Templates seedados via `prisma/seed.ts` (ex.: "Buyer skeptic", "Technical lead", "End user").
4. **Estenda `execute_action`**: adicione actions `prepare_brief`, `start_role_play`, `next_turn`, `end_role_play`, `extract_followups` em `src/lib/chat/action-execution.ts` e registre em manifest do tool. Permite que o orquestrador conduza tudo via natural language.
5. **Componha UI a partir do existente**: copie/adapte `chat-interface.tsx` para `role-play-interface.tsx` aceitando array de personas e renderizando avatar + label por turno. Reuse `chat-message.tsx`, `thinking-steps.tsx`, `chat-input.tsx`.
6. **Turn-taking simples primeiro**: round-robin com possibilidade de "ceder a palavra" via tool-use. Mediador (orchestrator) decide quando encerrar. Evite máquina de estados complexa no MVP.
7. **Brief generator com prompt caching**: quando tudo já estiver streamando, ative cache de system prompt (skills+KB são longas e estáveis) — fácil ganho de latência/custo no Anthropic SDK.
8. **Hook em domain-events**: emita `meeting-prep.role-play-completed` no fim da sessão; handler gera resumo + action items reutilizando `meeting-summarizer.ts`.
9. **Vincule a `Meeting` quando existir**: prep tool aceita ou cria um `Meeting` (status `PREP`) — assim já entra no fluxo padrão (post-meeting summarizer, action items, transcript).
10. **i18n e a11y desde o início**: toda string via `useT()`, formatação via helpers `src/lib/i18n/`, toasts via `notify*`. Multi-idioma das personas: campo `locale` no `MeetingPrepRolePlaySession` direciona o tom.
11. **Nav placement**: registre em `src/lib/tools/categories/operations.category.ts` (ordem 4 em `CATEGORY_ORDER`). UI cai automaticamente sob "Tools → Operations".
12. **Gate via permissões**: criar `NetworkPermission` `meeting-prep:read`/`:write` e atribuir aos roles padrão.

---

**Ferramenta no encaixe certo?** Sim — `Tools → Operations` (já tem Milestones; "Meeting Prep" combina perfeitamente com o tema de produtividade operacional). Se a categoria evoluir, `solutions/sales-department/meeting-prep` pode existir como solution composing this tool.
