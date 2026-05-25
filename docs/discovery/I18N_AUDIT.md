# i18n Audit — Estado atual e plano para Fase 1.5

> Etapa 1.5.1 — Discovery. Não inclui implementação. Produzido em 2026-04-30.

## Sumário executivo

- **Sistema i18n existe mas é subutilizado.** A infra própria (`src/lib/i18n/{t,locales,get-locale,locale-context}` + 3 dicionários com 185 keys cada, paridade total) está pronta para receber tradução, mas apenas **2 features** (`routines`, `experiences`) e 6 arquivos esparsos (~25 arquivos no total) realmente chamam `useT()`. Tudo o mais — incluindo o ledger 1.7 que acabei de entregar — está hardcoded em PT-BR.
- **Volume estimado: ~2.422 strings hardcoded** distribuídas em ~45 features admin. Maior concentração: `organization` (217), `knowledge` (215), `tiers` (154), `network` (154), `agents` (142). Com Ledger 1.7 ≈ 1 unidade de trabalho (~30 strings + UI + testes), a Fase 1.5 inteira é **~50 ledgers de trabalho** se for migrar tudo. A Etapa 1.5.6 sozinha vai ter que ser fatiada em ≥3 sub-etapas.
- **Roteamento: recomendação híbrida.** Manter `/admin` e `/api` flat (95% das páginas — autenticadas, single-user, cookie resolve); adicionar `[locale]` apenas em surfaces públicas (`(published)/p/[slug]`, `(forms)/f/[slug]`, `explore/[slug]`, `shared/[token]`) onde SEO e shareability importam — ~10-15 arquivos vs 202 se fizesse global. Fica para a 1.5.3 cravar.
- **3 decisões pendentes para 1.5.2:**
  1. `pt-BR` + `en-US` (full region) ou manter `pt-BR` + `en` (curto)? Hoje é `en` no código mas `en-US` em `Intl.NumberFormat` — inconsistência precisa virar uma só.
  2. ESLint plugin: recomendo `react/jsx-no-literals` (zero deps novas, do `eslint-plugin-react` que já é transitivo). Aplicar **só em código novo** (mirror do pattern de legacy-debt já em `eslint.config.mjs`).
  3. Padrão de chave: sugiro `{domain}.{feature}.{context}.{snake_case}` — ex: `ledger.accounts.list.empty_state`. Exporta tipo `MessageKey` automaticamente do `pt-BR.ts`.
- **Top 3 riscos:** (a) **financials suite** (3 features, ~204 strings, com `toLocaleString` espalhado) — refactor pesado e brand-critical; (b) **landing-page editor + published pages** — exige `locale` *no conteúdo* (per-page), não no platform i18n, classe diferente de problema; (c) **30+ integrations** em `src/lib/services/` retornando texto externo (Salesforce, Stripe etc.) — pattern precisa ser desenhado.

---

## 1. Estado do sistema i18n existente

**Arquivos em `src/lib/i18n/`:**
```
src/lib/i18n/locales.ts
src/lib/i18n/t.ts
src/lib/i18n/get-locale.ts
src/lib/i18n/locale-context.tsx
src/lib/i18n/messages/pt-BR.ts
src/lib/i18n/messages/en.ts
src/lib/i18n/messages/es.ts
```

**Sem dependências externas** — sistema 100% homemade. `package.json` não tem `next-intl`, `i18next`, `react-intl`, `@formatjs`.

**Assinaturas:**
- `t(key: MessageKey, locale: Locale, params?: Record<string, string|number>): string` — server-side. Suporta `{name}` interpolation via regex replace. Fallback: `dict[key] → DICTIONARIES[DEFAULT_LOCALE][key] → key as string`.
- `useT(): (key: MessageKey, params?) => string` — hook React, lê `LocaleContext`.
- `useLocale(): Locale` + `<LocaleProvider locale={...}>` para Server→Client boundary.

**Resolução de locale (cadeia em `getLocale()`):**
1. Header `x-locale-override` (vem do query `?locale=…`, encaminhado pelo middleware).
2. Cookie `locale`.
3. Header `Accept-Language` (primeiro segmento, normalizado).
4. `DEFAULT_LOCALE = "pt-BR"`.

Comentário em `get-locale.ts` é explícito: **DB lookup de `NetworkProfile.locale` foi deliberadamente evitado no root layout** (Next 15 warning sobre blocking render). Sync cookie ↔ DB seria responsabilidade do login flow — **não foi implementado** (busca por `cookies.set("locale", ...)` em `src/` retorna zero matches).

**Persistência:**
- Cookie `locale` (lado-leitura wired; escrita não implementada).
- DB: `NetworkProfile.locale String @default("pt-BR")` em `prisma/schema.prisma:2013`. Sem enum, sem CHECK, sem zod schema validando.

**Contagem de chaves:**
- `pt-BR.ts`: **185 keys**
- `en.ts`: **185 keys**
- `es.ts`: **185 keys**
- **Discrepâncias: zero.** `diff` entre os 3 retornou todas as chaves presentes em todos os 3 dicionários. Paridade perfeita.

---

## 2. Inventário de strings hardcoded por feature

> Heurística: regex sobre JSX text nodes + props (`placeholder|label|title|aria-label`) + `toast.{success,error,info,warning}`. Filtrando `useT|t("|className|//`. Over-counts JSX com curly-brace expressions; under-counts templates aninhados e arquivos que já usam parcialmente. Use como **ranking relativo**, não valor absoluto.

| Feature | Path | JSX text | Props | Toasts | Total | useT? |
|---|---|---|---|---|---|---|
| organization | `src/components/organization` | 124 | 67 | 26 | **217** | No |
| knowledge | `src/components/knowledge` | 31 | 77 | 107 | **215** | No |
| tiers | `src/components/tiers` | 54 | 62 | 38 | **154** | No |
| network | `src/{components,app/admin}/network` | 45 | 93 | 16 | **154** | No |
| agents | `src/{components,app/admin}/agents` | 64 | 34 | 44 | **142** | No |
| financials | `src/{components,app/admin}/financials` | 3 | 101 | 17 | **121** | No |
| products | `src/components/products` | 47 | 41 | 28 | **116** | No |
| landing-page | `src/components/landing-page` | 5 | 95 | 13 | **113** | No |
| operations | `src/{components,app/admin}/operations` | 18 | 23 | 42 | **83** | No |
| brand-kit | `src/components/brand-kit` | 40 | 19 | 5 | **64** | No |
| blocks | `src/{components,app/admin}/blocks` | 18 | 26 | 9 | **53** | No |
| packages | `src/components/packages` | 11 | 19 | 19 | **49** | No |
| companies | `src/components/companies` | 12 | 37 | 0 | **49** | No |
| meetings | `src/components/meetings` | 23 | 19 | 4 | **46** | No |
| contacts | `src/components/contacts` | 12 | 34 | 0 | **46** | No |
| forms | `src/components/forms` | 6 | 17 | 21 | **44** | No |
| deals | `src/components/deals` | 13 | 29 | 0 | **42** | No |
| tables | `src/components/tables` | 7 | 13 | 21 | **41** | No |
| brands | `src/components/brands` | 21 | 16 | 4 | **41** | No |
| campaigns | `src/components/campaigns` | 7 | 32 | 0 | **39** | No |
| perks | `src/components/perks` | 12 | 15 | 11 | **38** | No |
| routines | `src/components/routines` | 12 | 25 | 0 | **37** | **Yes** (10 files) |
| integrations | `src/{components,app/admin}/integrations` | 18 | 8 | 11 | **37** | No |
| marketplace | `src/{components,app/admin}/marketplace` | 4 | 20 | 8 | **32** | No |
| commissions | `src/{components,app/admin}/commissions` | 2 | 28 | 1 | **31** | No |
| locations | `src/components/locations` | 12 | 18 | 0 | **30** | No |
| apps | `src/components/apps` | 8 | 4 | 18 | **30** | No |
| feeds | `src/components/feeds` | 3 | 14 | 12 | **29** | No |
| community | `src/components/community` | 1 | 17 | 10 | **28** | No |
| documents | `src/components/documents` | 1 | 7 | 14 | **22** | No |
| chat | `src/{components,app/admin}/chat` | 2 | 20 | 0 | **22** | No |
| videos | `src/components/videos` | 1 | 7 | 13 | **21** | No |
| images | `src/components/images` | 1 | 7 | 13 | **21** | No |
| events | `src/components/events` | 14 | 7 | 0 | **21** | No |
| audios | `src/components/audios` | 1 | 7 | 13 | **21** | No |
| services | `src/components/services` | 12 | 8 | 0 | **20** | No |
| partners | `src/{components,app/admin}/partners` | 8 | 9 | 2 | **19** | No |
| tasks | `src/components/tasks` | 10 | 8 | 0 | **18** | No |
| notes | `src/components/notes` | 3 | 13 | 0 | **16** | No |
| links | `src/components/links` | 2 | 8 | 6 | **16** | No |
| ledger | `src/{components,app/admin}/ledger` | 6 | 9 | 0 | **15** | No |
| layout | `src/components/layout` | 6 | 9 | 0 | **15** | No (sub-panel parcial) |
| feedbacks | `src/components/feedbacks` | 8 | 5 | 0 | **13** | No |
| (other: shared, settings, profile, messages, experiences, ui) | various | 8 | 17 | 16 | **41** | partial (ui, experiences) |

**GRAND TOTAL: ~2.422 strings hardcoded** em features admin.

**Top 5 features por volume:**
1. **organization — 217**
2. **knowledge — 215**
3. **tiers — 154**
4. **network — 154**
5. **agents — 142**

### Exemplos concretos das top 3 features

**`src/components/organization/locations-form.tsx` (linhas 61–191):**
```tsx
{ value: "headquarters", label: "Headquarters" },
{ value: "office", label: "Office" },
{ value: "warehouse", label: "Warehouse" },
{ value: "other", label: "Other" },
return parts.join(", ") || "No address provided";
toast.error("Failed to load locations");
toast.error("Location name is required");
toast.error(json.error || "Failed to save location");
toast.success(editingId ? "Location updated" : "Location added");
```

**`src/components/knowledge/knowledge-folder-dialog.tsx` (linhas 130–141):**
```tsx
<div className="space-y-4">
  <div className="space-y-1.5">
    <Label className="text-xs">Name</Label>
    <Input
      value={name}
      onChange={(e) => setName(e.target.value)}
      placeholder="Folder name"
      autoFocus
      onKeyDown={(e) => {
        if (e.key === "Enter" && !saving) handleSave();
      }}
    />
  </div>
```

**`src/components/tiers/tier-create-sheet.tsx` (linhas 118–128):**
```tsx
{/* Tier name */}
<div className="space-y-1.5">
  <Label htmlFor="tier-name">Plan name</Label>
  <Input
    id="tier-name"
    placeholder="e.g. Performance"
    value={name}
    onChange={(e) => setName(e.target.value)}
    autoFocus
  />
```

---

## 3. Mapeamento das features que já usam `useT()`

**25 arquivos** importam de `@/lib/i18n` ou chamam `useT()`. Agrupados por feature:

| Área | Arquivos | Cobertura |
|---|---|---|
| `components/routines/**` | 10 (routines-client, routines-kanban, routine-card, routine-detail-client, routine-run-detail, types.ts, wizard/{schedule-config, routine-wizard-shell}, wizard/steps/{step-flow, step-trigger, step-identity, step-review}) | **full** |
| `components/experiences/**` | 5 (experiences-client, experiences-kanban, experience-detail-client, experience-card, create-experience-dialog) | **full** |
| `components/blocks/**` | 1 (all-blocks-page) | token |
| `components/layout/**` | 1 (sub-panel) | token |
| `components/ui/**` | 1 (sonner) | token |
| `components/knowledge/**` | 1 (manage-knowledge-dialog) | token |
| `lib/blocks/**` | 1 (block-labels) | partial |
| `lib/routines/**` | 1 (events/registry) | partial |
| `app/layout.tsx` | 1 (provider wiring) | n/a |

**Verdict:** adoção concentrada em **routines** e **experiences** (features recentes). Tudo o mais (`admin/**`, ledger UI, financials, meetings, tasks, messages, forms, integrations, network, marketplace, landing-page, agents) é **0% i18n**.

---

## 4. Helpers de formatação localizada (gaps no sistema)

| Concern | Status | Severidade |
|---|---|---|
| **Currency** | Implementado em `src/lib/money/format.ts` (`formatMoney`, `formatAmount`). Usa `Intl.NumberFormat` com **`meta.locale` por currency** (BRL→pt-BR, USD→en-US…), **NÃO por locale do usuário** — formato fixo pela moeda. Há também legado `formatCurrency` em `src/lib/utils.ts`. | **Médio** — produz símbolo correto mas ignora preferência do usuário. UI em pt-BR mostra `$100.00` em vez de `US$ 100,00`. |
| **Date** | Sem formatador central. `formatDate` / `date-fns format` / `format(new Date(...))` espalhados em 15+ arquivos (ledger, tasks, messages, meetings, events, integrations, landing-page). Locale não é threaded. | **Alto** |
| **Number** | 10+ chamadas raw `toLocaleString` / `Intl.NumberFormat` em financials, blocks, forms. Sem util central. | **Alto** |
| **Plural** | **Nenhum.** Zero `Intl.PluralRules` / `pluralize` no projeto. Strings tipo `"X items"` montadas à mão. | **Médio** |
| **Collation (sort alfabético)** | **Nenhum.** Zero `Intl.Collator`. Sorts usam `<` default. | **Baixo** |
| **Relative time** | **Nenhum.** Zero `Intl.RelativeTimeFormat`. "2 hours ago" via `date-fns formatDistance` ad-hoc. | **Médio** |

**Crítico operacional:** Date é o gap de mais alto tráfego (15+ arquivos). Number formatting é o segundo. Currency precisa apenas de refactor leve (passar locale como param em vez de derivar da currency).

---

## 5. Análise das mensagens de erro

**4 arquivos** em `src/lib/**` definem error classes. **23 classes totais.**

### `src/lib/ledger/errors.ts` — 18 classes

| Classe | `code` proposto |
|---|---|
| `LedgerError` (base) | `ledger.error` |
| `AccountNotFoundError` | `ledger.account_not_found` |
| `AccountArchivedError` | `ledger.account_archived` |
| `InvalidCurrencyError` | `ledger.invalid_currency` |
| `UnsupportedCurrencyError` | `ledger.unsupported_currency` |
| `CurrencyMismatchError` | `ledger.currency_mismatch` |
| `InsufficientLinesError` | `ledger.insufficient_lines` |
| `NonPositiveAmountError` | `ledger.non_positive_amount` |
| `UnbalancedEntryError` | `ledger.unbalanced_entry` |
| `InvalidSourceIdError` | `ledger.invalid_source_id` |
| `InvalidSourceKindError` | `ledger.invalid_source_kind` |
| `IdempotencyConflictError` | `ledger.idempotency_conflict` |
| `EntryNotFoundError` | `ledger.entry_not_found` |
| `InvalidCursorError` | `ledger.invalid_cursor` |
| `StatementLimitExceededError` | `ledger.statement_limit_exceeded` |
| `CannotReverseReversalError` | `ledger.cannot_reverse_reversal` |
| `EntryAlreadyReversedError` | `ledger.entry_already_reversed` |
| `MissingReversalReasonError` | `ledger.missing_reversal_reason` |

### `src/lib/domain-events/errors.ts` — 3 classes

| Classe | `code` proposto |
|---|---|
| `DomainEventError` (base) | `domain_events.error` |
| `IdempotencyConflictError` | `domain_events.idempotency_conflict` |
| `HandlerExecutionError` | `domain_events.handler_execution` |

### `src/lib/money/types.ts` — 2 classes

| Classe | `code` proposto |
|---|---|
| `CurrencyMismatchError` | `money.currency_mismatch` |
| `InvalidMoneyError` | `money.invalid` |

**Padrão atual:** mensagens construídas em **inglês técnico** (mistura de "Account is archived" + "Money is a tuple"). Mensagens não vazam para usuário diretamente — são consumidas pela UI (que ainda não traduz). Para a 1.5.4: adicionar `code` field em cada classe sem mudar a `message` técnica; UI consome `code` via `t()`.

Componentes/services têm `throw new Error(...)` ad-hoc adicional não inventariados aqui.

---

## 6. Roteamento e estrutura de URLs

**Estrutura atual:**
- Route groups (sem segmento URL): `(auth)`, `(editor)`, `(forms)`, `(published)`
- Top-level: `admin`, `api`, `explore`, `shared`
- **144 dynamic segments** (`[id]`, `[slug]`, `[...path]`, `[...nextauth]`)
- **Sem `[locale]` segment.** Sem `i18n` config em `next.config.ts`.

**Resolução de locale hoje:** cookie + Accept-Language (Section 1). URL é locale-agnostic.

**Counts para escopo de migration:**
- Total `page.tsx`: **202**
- Sob `admin/`: **193 (95%)**
- `layout.tsx`: **11**

**Trade-offs — flat vs `/[locale]/...`:**

**Custo de mover para `/[locale]/...`:**
- 202 pages movem para `src/app/[locale]/`
- 144 dynamic dirs re-rooted
- 11 layouts precisam wiring locale-aware (já feito em root via `LocaleProvider`)
- Middleware cresce: detecta missing locale prefix, redirect/rewrite
- Redirects em `next.config.ts` (commission, channels, program migrations) precisam versão locale-aware
- Cada `<Link>` / `router.push` interno precisa helper de locale
- API routes (`src/app/api/**`) ficam flat — locale não pertence em URL de API
- **SEO**: `/p/[slug]` (published landing pages) e `/explore/[slug]` são públicas — locale-prefixed URLs ajudam indexing e shareability.

**Custo de manter flat (cookie-based):**
- URLs compartilhadas sempre renderizam locale do receiver, não do sender. Doloroso para marketing/support.
- Sem `hreflang` para SEO.
- Cache server-side ao nível de URL mistura locales.

### Recomendação: hybrid

Como **95% das pages vivem sob `/admin`** (auth-walled, single user, cookie funciona), a migração global é principalmente custo para pouco benefício de usuário. O **valor real** está em surfaces públicas: `/p/[slug]`, `/explore/[slug]`, `/f/[slug]`, `/shared/[token]` — ~10-15 page files no total.

**Hybrid proposto:**
- `admin/` + `api/` ficam flat (cookie continua resolvendo locale).
- `[locale]` introduzido **apenas** em route groups públicos: `(published)`, `(forms)`, e `explore/`.
- Migração: ~10-15 arquivos em vez de 202.
- Ganhos de SEO/sharing onde importam.

Não cravando aqui — discussão na 1.5.3.

---

## 7. Padronização de locale identifiers

**Locale strings em uso (i18n source):**
- Canônicos: `pt-BR`, `en`, `es` (em `SUPPORTED_LOCALES`).
- Layer de normalização aceita `pt`, `en-US`, `es-ES` etc. → mapeia via `startsWith` para os 3 canônicos.

**`src/middleware.ts`:** zero referências a literais de locale. Middleware não toca em locale (apenas encaminha override via header).

**Cookie reads/writes:**
- **Read:** `getLocale` lê `cookies().get("locale")` em `src/lib/i18n/get-locale.ts`.
- **Write:** **busca por `cookies.set(..."locale"...)` em `src/` retorna ZERO matches.** O comentário em `get-locale.ts` afirma que login flow é responsável, mas a implementação não foi encontrada. **Gap real.**

**Prisma — `NetworkProfile.locale` (`prisma/schema.prisma:2013`):**
```prisma
locale String @default("pt-BR")
```
- Sem enum, sem CHECK, sem zod validation.
- Default `"pt-BR"` bate com código.
- Permite qualquer string crua entrar no DB.

**Inconsistências:**
- DB default `pt-BR` ✓ bate com código.
- App usa `en` (curto) mas `Intl.NumberFormat` é chamado com `en-US` (full region) internamente em `money/format.ts`. Funciona, mas é inconsistência semântica.
- Nenhum write path mantém cookie ↔ `NetworkProfile.locale` em sync — gap a fechar.

**Decisão pendente:** `pt-BR` + `en-US` (full region, internamente já é) ou `pt-BR` + `en` (curto, fica como está)? **Recomendo full region** para consistência com `Intl.*` APIs. Migration: trivial — `UPDATE network_profiles SET locale = 'en-US' WHERE locale = 'en'` + atualizar `SUPPORTED_LOCALES` + atualizar dicionário (rename `en.ts` → `en-US.ts` ou alias).

---

## 8. Linter e enforcement

**Estado de `eslint.config.mjs`:** zero rules de i18n. Carrega `nextVitals` + `nextTs` + override de legacy debt. Sem `react/jsx-no-literals`, sem `i18next`, sem `formatjs`.

**`package.json`:** zero plugins de i18n eslint (`grep -E "eslint-plugin|i18next|formatjs"` retornou zero).

**Plugin options para flag JSX literals:**

| Plugin | Pros | Cons |
|---|---|---|
| `react/jsx-no-literals` (de `eslint-plugin-react`) | **Já é dep transitiva** via `eslint-config-next`. Zero deps novas. Flagua qualquer JSX text literal. Configurável (`allowedStrings`, `ignoreProps`). Funciona com TS. | Não entende o sistema i18n específico — só bane literais. Sem autofix. Falsos positivos em ícones / chars únicos requerem `allowedStrings` config. |
| `eslint-plugin-i18next` | Targetado a i18n. Flagua chaves missing em `t("key")`. Entende i18next. | Acoplado a i18next library; ComeçaAI não usa. Precisaria wrapper ou custom resolver. |
| `eslint-plugin-formatjs` | Validação ICU excelente, missing-id detection, locale parity checks. | Acoplado a `react-intl` / FormatJS. ComeçaAI não usa. Custo de adoção alto. |

### Recomendação para 1.5.2: `react/jsx-no-literals`

- **Zero deps novas** (já é transitiva).
- Caminho mais rápido para enforcement.
- Agnóstico ao runtime (funciona com helper homemade).
- Configurar com `allowedStrings: [" ", "·", "—"]` etc. e `ignoreProps: true` inicialmente.
- **Aplicar só em código novo** (mirror do pattern legacy-debt já em `eslint.config.mjs` — features antigas em `warn` ou ignoradas, código novo em `error`).
- Pareado com **script lightweight** em `scripts/check-i18n-keys.ts` que verifica que toda chave em `t("…")` no código existe em `messages/pt-BR.ts` (single source of truth do tipo `MessageKey`).

---

## 9. Riscos e features problemáticas

| Feature | Path | Dificuldade | Notas |
|---|---|---|---|
| **Public landing page metadata** | `src/app/(published)/p/[slug]/page.tsx` | médio | Único arquivo com `generateMetadata`. Precisa locale-aware title/description e `alternates.languages` para SEO. |
| **Salesforce + 30 outras integrations** | `src/lib/services/{salesforce,airtable,asana,attio,clickup,hubspot,jira,linear,monday,notion-tasks,slack,gmail,gorgias,intercom,zoom,plaud,...}.ts` | médio | Strings externas (status labels, error mapping). Pattern precisa ser desenhado: traduzir labels conhecidos? Passar texto cru? |
| **Money formatting** | `src/lib/money/format.ts` | trivial | Já é locale-aware via `Intl`; só precisa receber `Locale` como param em vez de derivar da currency. |
| **Ledger admin UI** | `src/components/ledger/{entry-detail-client,entries-list-client,account-statement-table}.tsx` | médio | Date strings hardcoded + labels PT-BR. High call volume. Brand-critical. |
| **Financials projections / P&L** | `src/components/financials/{pl-statement,projection-spreadsheet,models-list,metrics-panel,executive-summary,scenario-builder}.tsx` | **complexo** | Heavy `toLocaleString`, table headers, computed labels, scenario names. |
| **Landing-page builder + published pages** | `src/components/landing-page/**` + `src/app/(editor)/editor/[pageId]` + `src/app/(published)/p/[slug]` | **complexo** | User-authored prose — precisa **per-page `locale` field**, não platform i18n. **Classe diferente de problema**. |
| **Markdown rendering (agent output)** | `src/components/agents/shared/markdown-content.tsx` | trivial | Renderiza output de LLM; locale tratado upstream via prompting. |
| **Routine wizard** | `src/components/routines/wizard/**` | trivial | Já migrada para `useT()`. |
| **Email templates** | nenhum encontrado | n/a | Zero `sendgrid`/`resend`/`nodemailer`/`emailTemplate` em `src/`. Sem infra de email ainda. |
| **PDF/Excel generation** | nenhum encontrado | n/a | Zero `pdf-lib`/`jspdf`/`exceljs.workbook` em `src/app/api`. (`pdf-to-img` é input parsing, não output.) |
| **Block labels registry** | `src/lib/blocks/block-labels.ts` | trivial | Já importa de `@/lib/i18n`; central. |

**Top 3 riscos a priorizar:**
1. **Financials suite** — complexo, alto tráfego (P&L é core do produto).
2. **Ledger admin UI** — médio, brand-critical, segunda surface a ser vista por cliente americano.
3. **Landing-page editor (per-page locale)** — *separadamente* da platform i18n. Não é "adicionar `useT()`"; é mudar schema de `LandingPage` para suportar variantes por locale, ou repensar como user authora multilíngua.

---

## 10. Estimativa por etapa

**Unidade:** Ledger 1.7 ≈ 1 unidade ≈ ~30 strings + UI work + tests + revisão (~3-4h trabalho concentrado).

| Etapa | Conteúdo | Tamanho estimado | Justificativa |
|---|---|---|---|
| **1.5.2** | Hardening + lint rule + formatadores localizados (date, number, plural, relative-time) + cookie-write helper + sync com `NetworkProfile.locale` | **~Ledger × 0.7** | Quase só infra. ESLint config + 4-5 helpers + 1 utility de cookie + tests pure. |
| **1.5.3** | UX switching (dropdown no profile / settings) + locale prefix em `(published)` / `(forms)` / `explore/` (hybrid routing) + persistência | **~Ledger × 0.8** | UI nova pequena + ~10-15 file moves + Link helpers. |
| **1.5.4** | Ledger i18n (15 strings UI + 23 error classes ganham `code` + UI consome `t(error.code)`) | **~Ledger × 1.0** | Esperado — é literalmente o ledger. |
| **1.5.5** | Admin shell (sidebar, sub-panel, breadcrumbs, top-bar, profile menu) + layout strings | **~Ledger × 1.5** | Touched em todas as pages — qualidade alta exigida. |
| **1.5.6** | Migration de **2.300+ strings restantes** em ~40 features admin | **~Ledger × 35-40** | **Precisa fatiar** — ver abaixo. |
| **1.5.7** | Capstone: validation, regression suite, docs (`SKILL.md` de i18n) | **~Ledger × 0.4** | Documentação + testes E2E. |

**Total Fase 1.5: ~Ledger × 40-45.** Conservadoramente, **45-50 ledgers de trabalho**.

### Sub-divisão proposta da Etapa 1.5.6

Com 2.300+ strings, 1.5.6 não cabe em uma etapa só. Proposta de fatiamento por **volume + criticidade**:

| Sub-etapa | Conteúdo | Strings aprox | Tamanho |
|---|---|---|---|
| **1.5.6a** | Top 5 features (organization + knowledge + tiers + network + agents) | ~882 | ~Ledger × 10-12 |
| **1.5.6b** | Tier 2: financials + products + landing-page-shell + operations + brand-kit + blocks (NÃO inclui content authoring) | ~571 | ~Ledger × 7-9 |
| **1.5.6c** | Tier 3: ~16 features médias (packages, companies, meetings, contacts, forms, deals, tables, brands, campaigns, perks, integrations, marketplace, commissions, locations, apps, feeds) | ~622 | ~Ledger × 8-10 |
| **1.5.6d** | Tier 4: ~14 features pequenas (community, documents, chat, videos, images, events, audios, services, partners, tasks, notes, links, ledger surfaces, layout, feedbacks, others) | ~308 | ~Ledger × 4-5 |

Cada sub-etapa pode ser PR isolado, mergeable independentemente desde que a 1.5.2 (hardening + helpers) esteja pronta.

**Alternativa:** quebrar 1.5.6a em ainda mais granular (1 feature por etapa para os top 5) se a interrupção interna em uma feature for muito pesada para revisar de uma vez.

---

## 11. Recomendações para 1.5.2 em diante

### Helpers que devem entrar na 1.5.2

1. **`formatDate(date, locale, opts?)`** em `src/lib/i18n/format-date.ts` — wrapper de `Intl.DateTimeFormat` com presets (`short`, `long`, `dateTime`, `time-only`, `relative`).
2. **`formatNumber(n, locale, opts?)`** — `Intl.NumberFormat` com presets (`integer`, `decimal`, `percent`, `compact`).
3. **`formatRelativeTime(date, locale)`** — `Intl.RelativeTimeFormat` para "há 2 horas" / "in 2 hours".
4. **`pluralize(count, locale, forms)`** — wrapper de `Intl.PluralRules`. Forms = `{one, other, zero?, two?, few?, many?}` strings.
5. **`compareCollation(a, b, locale)`** — wrapper de `Intl.Collator` para sort.
6. **`formatMoney(money, locale)`** — refactor do existente para receber `locale` em vez de derivar da currency.
7. **`setLocaleCookie(locale)`** server action — fecha o gap de cookie write.
8. **`syncProfileLocale(profileId, locale)`** — sync DB ↔ cookie em login.

### Padrão de chave nos dicionários

**Convenção sugerida:** `{domain}.{feature}.{context}.{snake_case_string}`

Exemplos:
- `ledger.accounts.list.empty_state` — empty state na página de plano de contas
- `ledger.accounts.detail.balance_label` — label "Saldo atual" no card
- `ledger.entries.list.empty_state`
- `error.ledger.account_not_found` — mensagem para o code de erro
- `error.ledger.unbalanced_entry`
- `nav.sidebar.ledger` — entrada de sidebar
- `common.actions.save`, `common.actions.cancel`, `common.actions.delete` — botões reutilizados

**Tipo `MessageKey`** continua derivado de `pt-BR.ts` (single source of truth). Se uma chave faltar em `pt-BR`, build falha — útil.

### Strings que aparecem em vários lugares

**Regra:** se aparece em ≥3 contextos, vira chave `common.{context}.{string}` (ex: `common.actions.save`). Se aparece em 1-2, vive na chave da feature.

**Exemplos prováveis para `common`:**
- `common.actions.{save,cancel,delete,edit,create,close,confirm,back}`
- `common.states.{loading,error,empty,success}`
- `common.placeholders.{search,select,type_to_filter}`

### Pluralização — uma chave com `{count}` ou múltiplas?

**Use o helper `pluralize`**, com chaves separadas por forma:

```ts
// pt-BR.ts
"ledger.entries.count.one": "{count} entrada",
"ledger.entries.count.other": "{count} entradas",
```

```tsx
const text = pluralize(count, locale, {
  one: t("ledger.entries.count.one", { count }),
  other: t("ledger.entries.count.other", { count }),
});
```

Mais verboso que `t("ledger.entries.count", { count })` interpolado, mas correto para línguas com mais formas (ár, pl, ru) que entrarem futuramente.

### Contexto idiomático (mesma palavra, contextos diferentes)

**Não compartilhe chave entre contextos diferentes** mesmo que a tradução PT-BR coincida. "Save" como botão (`common.actions.save`) ≠ "Save" como atalho de teclado (`common.shortcuts.save_action`) ≠ "Save" como conceito de balanço (`finance.savings`). Dialetos podem divergir.

### Naming convention para mensagens de erro

**Pattern:** `error.{domain}.{snake_case_error_name}`

```
error.ledger.account_not_found
error.ledger.unbalanced_entry
error.domain_events.idempotency_conflict
error.money.currency_mismatch
error.common.network          # erro genérico de rede
error.common.unknown           # fallback final
```

**Cada error class no `src/lib/**/errors.ts` ganha campo `code` correspondente.** UI consome `code` via `t()`. Quando o erro vaza de runtime sem code conhecido, fallback para `error.common.unknown`.

### URL routing — recomendação cravada para 1.5.3

**Hybrid:**
- `admin/` + `api/` mantêm flat (cookie resolve).
- `[locale]` introduzido em `(published)/`, `(forms)/`, `explore/`, `shared/[token]` (route group ou layout intermediário).
- Migration de ~10-15 arquivos.
- API routes nunca prefixadas com locale.
- `Link` helper que respeita locale para surfaces públicas.

### Locale identifier — recomendação cravada para 1.5.2

**Adotar `pt-BR` + `en-US` (full region).**
- Update `SUPPORTED_LOCALES = ["pt-BR", "en-US"]`.
- Rename `messages/en.ts` → `messages/en-US.ts` (ou manter `en.ts` e ajustar import).
- Migration SQL: `UPDATE network_profiles SET locale = 'en-US' WHERE locale = 'en'`.
- Adicionar enum no Prisma OU CHECK constraint em `prisma migrate` (preferência: CHECK, mais flexível para adicionar locales futuros sem migration de tipo).
- `es` fica como template experimental (decisão fechada).

### ESLint enforcement — recomendação cravada para 1.5.2

- Adotar `react/jsx-no-literals` de `eslint-plugin-react`.
- Configurar com `allowedStrings` mínimo (espaço, hífens, símbolos) e `ignoreProps: true` inicialmente.
- **Apenas em código novo** (paths não listados em legacy-debt). Mirror do pattern já existente em `eslint.config.mjs`.
- Pareado com script `scripts/check-i18n-keys.ts` que valida que toda chave em `t("…")` existe em `messages/pt-BR.ts`.
- Considerar adicionar à CI workflow uma vez que estiver estável.
