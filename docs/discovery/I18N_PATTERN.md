# i18n Pattern Reference

> Estabelecido na Etapa 1.5.4 (Ledger Internationalization).
> Pattern canônico para internacionalizar features do HERD.
> Versão: 1.7 — última atualização: 2026-05-01 (Etapa 1.5.6d-γ).

Este documento é a referência única de **como** internacionalizar uma feature.
Ele captura as decisões e templates cravados na Etapa 1.5.4 e serve de base
para as etapas 1.5.5 (Admin Shell) e 1.5.6a-e (features restantes).

## Decisões fundacionais

1. **Naming de chave**: `{domain}.{feature}.{context}.{snake_case}`.
   Erros: `error.{domain}.{snake_case}`.
2. **Threading de locale em RSC**: server reads via `getLocale()`, prop down.
3. **Formatadores recebem locale como prop**, não leem de context.
4. **`useT()` é para chaves de tradução** (strings).
5. **`locale` prop é para formatação** (datas, números, money).
6. **Strings adicionadas incrementalmente** ao dicionário durante migração.
7. **Cada error class tem `code: string`** sem prefixo `error.`.
8. **Dados authored pelo usuário não são traduzidos** (descriptions, reasons,
   notes — vão crus para o banco e voltam crus).
9. **Tipos derivados de enums Prisma usam `satisfies` map** para garantir
   type-safety e propagação automática quando o enum cresce.
10. **ESLint estrito (jsx-no-literals) é ativado por path** ao final da
    migração de cada feature, não antes.

## Templates

### Template A: RSC (Server Component) que lê dados e passa para Client

```tsx
import { connection } from "next/server";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/t";

export default async function MyFeaturePage() {
  await connection();
  const locale = await getLocale();

  const data = await loadData();

  return (
    <div>
      <PageHeader
        title={t("myfeature.list.title", locale)}
        description={t("myfeature.list.description", locale)}
      />
      <MyFeatureClient data={data} locale={locale} />
    </div>
  );
}
```

### Template B: Client Component que recebe locale e usa useT

```tsx
"use client";

import { useT } from "@/lib/i18n/locale-context";
import { formatDate } from "@/lib/i18n/format-date";
import type { Locale } from "@/lib/i18n/locales";

interface MyFeatureClientProps {
  data: SerializedData;
  locale: Locale;
}

export function MyFeatureClient({ data, locale }: MyFeatureClientProps) {
  const t = useT();

  return (
    <div>
      <h2>{t("myfeature.detail.title")}</h2>
      <span>{formatDate(new Date(data.createdAt), locale)}</span>
    </div>
  );
}
```

**Quando usar `useT()` vs prop?** `useT()` para chaves de tradução
(strings); `locale` prop para passar para formatadores (date, money,
number). Os dois convivem.

### Template C: Componente utilitário localizável (Money, DateLabel, etc.)

```tsx
"use client";

import { formatDate } from "@/lib/i18n/format-date";
import type { Locale } from "@/lib/i18n/locales";

interface DateLabelProps {
  value: Date | string;
  locale: Locale;
  preset?: "short" | "long" | "dateTime" | "time";
}

export function DateLabel({ value, locale, preset = "short" }: DateLabelProps) {
  const date = typeof value === "string" ? new Date(value) : value;
  return <span>{formatDate(date, locale, preset)}</span>;
}
```

Componentes utilitários **recebem locale como prop** porque são usados
em árvores variadas e benefit de explicit-over-implicit. Exemplo real:
`<Money>` em `src/components/ledger/money.tsx`.

### Template D: Mapa de enum para chave de tradução

```tsx
import type { AccountType } from "@prisma/client";
import type { MessageKey } from "@/lib/i18n/t";

const ACCOUNT_TYPE_KEYS = {
  ASSET: "ledger.account_type.asset",
  LIABILITY: "ledger.account_type.liability",
  EQUITY: "ledger.account_type.equity",
  REVENUE: "ledger.account_type.revenue",
  EXPENSE: "ledger.account_type.expense",
} as const satisfies Record<AccountType, MessageKey>;

const label = t(ACCOUNT_TYPE_KEYS[type]);
```

`satisfies` força exhaustividade: se o enum Prisma ganhar novo valor,
TypeScript reclama. Sempre use este pattern para enum-to-translation
mapping. Exemplo real: `AccountTypeBadge` em
`src/components/ledger/account-type-badge.tsx` e `SourceKindBadge` em
`src/components/ledger/source-kind-badge.tsx`.

### Template E: Tratamento de erros

Server (RSC):

```tsx
import { translateError } from "@/lib/i18n/translate-error";

try {
  // ... operação ...
} catch (err) {
  const message = translateError(err, locale);
  return <ErrorPanel message={message} />;
}
```

Client:

```tsx
"use client";

import { useT } from "@/lib/i18n/locale-context";
import { translateErrorWithT } from "@/lib/i18n/translate-error";
import { toast } from "sonner";

const t = useT();

try {
  await mutation();
} catch (err) {
  toast.error(translateErrorWithT(err, t));
}
```

A classe de erro precisa ter `code` field (sem prefixo `error.`). UI
nunca compõe `"error." + algo` manualmente — usa o helper. Os helpers
extraem automaticamente os campos string/number/bigint da classe e
passam como params para a chave do dicionário, então
`AccountNotFoundError.accountCode` aparece como `{accountCode}` no
template do dicionário.

### Template F: Strings que aparecem em vários lugares

Se a string aparece em ≥3 contextos, vira chave em `common.*`:

```ts
"common.actions.save": "Salvar",
"common.actions.cancel": "Cancelar",
"common.actions.delete": "Excluir",
"common.actions.edit": "Editar",
"common.actions.create": "Criar",
"common.states.loading": "Carregando...",
"common.states.empty": "Nenhum resultado.",
```

Se aparece em 1-2 contextos, vive na chave da feature específica.

### Template G: Toast notifications

Use os helpers `notifySuccess`, `notifyError`, `notifyInfo`, `notifyWarning`
em `src/lib/i18n/notify.ts` em vez de `toast.success/error/info/warning`
direto:

```tsx
"use client";

import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

const t = useT();

// Sucesso simples
notifySuccess("common.feedback.saved_successfully", t);

// Sucesso com params
notifySuccess("knowledge.feedback.uploaded", t, { count: 3 });

// Erro estruturado (com .code) — extrai params automaticamente
try { await mutation(); } catch (err) { notifyError(err, t); }

// Erro custom (sem objeto Error) — primeiro arg é string ⇒ MessageKey
notifyError("error.knowledge.upload_failed", t);
```

Os helpers centralizam o pattern e evitam que cada caller invente seu modo
de compor mensagem traduzida. **`notifyError` discrimina pelo tipo do
primeiro argumento**: string ⇒ trata como MessageKey; outro ⇒ trata como
Error e usa `translateErrorWithT`.

### Template H: Deprecation gradual de funções legacy

Quando uma função do projeto vira legacy mas tem muitos call-sites:

1. Adiciona `@deprecated` JSDoc com mensagem clara apontando para o
   substituto e explicação do motivo.
2. Adiciona ESLint rule `no-restricted-imports` que falha quando a
   função é importada em paths "modernos" (já migrados).
3. Mantém lista de `ignores` com paths que ainda dependem do legacy.
4. Cada migração de feature **remove o path correspondente da
   ignore list** + faz refactor in-place dos call-sites.
5. Capstone final confirma zero references e deleta a função.

Exemplo: `formatCurrency`/`formatPercent`/`formatNumber` em `utils.ts`
foram marcados deprecated em 1.5.6a-bis. Função permanece operacional
para features ainda hardcoded; será deletada em 1.5.7 quando todas
features tiverem migrado.

### Template I: Bridge para number-as-money sem refatorar tipo

Quando você tem `number` raw representando dinheiro mas converter para
`Money` tuple seria refactor invasivo (ex: campo Prisma é Decimal,
retorno de API legacy):

```tsx
import { formatNumberAsMoney } from "@/lib/money/format";

<span>{formatNumberAsMoney(value, locale)}</span>           // default USD
<span>{formatNumberAsMoney(value, locale, "BRL")}</span>    // explicit BRL
```

Bridge documentado, controlado. NÃO use como solução geral — para tipos
novos, comece com `Money` tuple desde o design. Helper existe para
preservar tipo de dado upstream onde já é `number` por razões legítimas.

### Template J: Multi-step wizard pattern

Wizards com múltiplos steps + shell + progress têm estrutura repetida.
Pattern para internacionalizar:

**Estrutura típica**:

```
src/components/<feature>/wizard/
├── wizard-shell.tsx      # frame principal
├── wizard-progress.tsx   # indicador visual
├── step-1-{name}.tsx     # primeiro step
├── step-2-{name}.tsx
├── ...
└── step-N-review.tsx     # último step (review/confirm)
```

**Naming convention de chaves**:

- `<feature>.wizard.title` — título global do wizard.
- `<feature>.wizard.common.step_indicator` — "Passo {current} de {total}".
- `<feature>.wizard.common.{back|next|finish|cancel|required_field}` — chrome.
- `<feature>.wizard.step{N}.{title|description}` — header de cada step.
- `<feature>.wizard.step{N}.{field}_label` — labels de campos.
- `<feature>.wizard.step{N}.{specific_string}` — strings específicas.

**Threading de locale**:
- Shell e progress recebem `locale` como prop quando precisam formatar.
- Cada step usa `useT()` para strings + recebe `locale` quando precisa.

**Anti-pattern crítico**:
- ❌ Dynamic key construction em runtime: `t(\`<feature>.wizard.step${n}.title\`)`.
  Use `STEP_TITLE_KEYS[n] satisfies Record<StepNumber, MessageKey>` map.

Caso primeiro: 1.5.6b-bis (Network — wizard de profiles, 7 steps).

### Template K: Token Auth Flow (token-paste)

Auth flow via **token-paste** (Personal Access Token / API Key / bridge token),
não OAuth com redirect. Caso primeiro: apps block (oura, whoop, apple-health).

**Estados** (5):
- `disconnected` — conta nunca conectada (sem credencial).
- `paste` — usuário digitando/colando token no input.
- `connecting` — request POST em vôo.
- `connected` — credencial válida + sync inicial concluído.
- `error` — falha (rede ou token inválido).

**Erros** (3):
- `invalid_token` — backend recusa o token.
- `network` — fetch falhou.
- `unknown` — qualquer outro 5xx/4xx.

**Ações** (2): `retry`, `cancel` (mais o `connect` da fase de paste).

**Namespace prescrito**:

```
apps.providers.{slug}.label
apps.providers.{slug}.description
apps.providers.{slug}.token_auth.portal.url
apps.providers.{slug}.token_auth.portal.label
apps.providers.{slug}.token_auth.token.label
apps.providers.{slug}.token_auth.token.placeholder
apps.providers.{slug}.token_auth.steps.{0..N}

apps.token_auth.modal.{connect_title,connect_subtitle,connect_app_title,
                        instructions_title,open_portal,scopes_title,
                        security_note}
apps.token_auth.actions.{connect,connecting,connected,cancel,retry}
```

**Slug → key segment**: dots e dashes em paths de chave são frágeis.
Use **underscore** quando o slug tem dash: `apple-health` → key path
`apps.providers.apple_health.*`. Mantenha o slug original em runtime
(database, URL, identidade do provider) — converta só no momento de
construir a MessageKey, via map satisfies ou helper:

```typescript
// src/lib/apps/provider-catalog.ts
export const APP_PROVIDER_TOKEN_AUTH: Record<AppProviderSlug, AppProviderTokenAuthMeta> = {
  oura: { ... },
  whoop: { ... },
  "apple-health": { ... },  // mas labelKey: "apps.providers.apple_health.label"
};
```

**Catálogo split (Template D + paralelo técnico)**:

Provider catalog deve separar:

1. **Localizable**: `APP_PROVIDER_OPTIONS` (Template D — labelKey,
   descriptionKey, logoUrl, authType, categoryCodes).
2. **Token auth técnico**: `APP_PROVIDER_TOKEN_AUTH` (portalUrlKey,
   portalLabelKey, tokenLabelKey, tokenPlaceholderKey, stepKeys[],
   scopeCodes[]).
3. **OAuth técnico** (existente, reservado): `APP_OAUTH_CONFIGS` em
   `src/lib/apps/app-config.ts` — clientId, scopes, redirectUri, etc.
   Não localizado, não vinculado a UI.

Razão do split: portal URLs e códigos de categoria são dados
ortogonais à UI — categorias podem ter ícones/cores próprias e portal
URLs raramente mudam por locale (mas precisam ser MessageKey por
consistência e para lidar com casos onde o portal tem variantes
regionais no futuro).

**Template L (placeholder)**: True OAuth flow com redirect/callback
ainda não foi cravado. Quando o primeiro caso real surgir (provavelmente
integrations block), mapear estados (`disconnected`, `redirecting`,
`callback_pending`, `connected`, `error`) e erros
(`oauth_denied`, `oauth_invalid_state`, `network`, `unknown`).

Caso primeiro: 1.5.6d-γ (apps — oura, whoop, apple-health via PAT/API key).

## Pattern: Extração de sub-panel especializado

Cada feature com sub-panel customizado em `src/components/layout/sub-panel.tsx`
ganha **arquivo próprio** ao ser internacionalizada, removendo a definição
inline do registry.

Procedimento:
1. Crie `src/components/<feature>/<feature>-sub-panel.tsx` com `"use client"`.
2. Mova a função inteira (incluindo tipos locais como `<Feature>SidebarData`).
3. Importe shared types de `src/components/layout/sub-panel-types.ts`
   (`SubPanelLink`, `SubPanelCategory`, `SubPanelConfig`, `SUB_PANEL_WIDTH`).
4. Em `sub-panel.tsx`: substitua a definição inline por
   `import { <Feature>SubPanel } from "@/components/<feature>/<feature>-sub-panel";`.
5. Adicione o arquivo novo ao path estrito de `react/jsx-no-literals`.

Pattern cravado em 1.5.6b-bis (NetworkSubPanel). Replicar para
BlocksSubPanel, KnowledgeSubPanel, MarketplaceSubPanel, ToolsSubPanel,
OrganizationSubPanel em 1.5.6c-e.

### Pattern: `labelKey` em interfaces hierárquicas

Quando uma interface representa hierarquia visível na UI (sidebar items,
sub-panel categorias, sub-panel links, breadcrumbs, etc.), **todos os
níveis** que renderizam texto devem aceitar `labelKey?: MessageKey`
opcional, lado a lado com o `label: string` literal de fallback.

Exemplo do `SubPanelConfig` (cravado em 1.5.5):

```ts
interface SubPanelConfig {
  label: string;
  labelKey?: MessageKey;  // novo (1.5.5)
  categories?: SubPanelCategory[];
  // ...
}

interface SubPanelCategory {
  label: string;
  labelKey?: MessageKey;  // novo (1.5.5)
  links: SubPanelLink[];
}

interface SubPanelLink {
  label: string;
  labelKey?: MessageKey;  // já existia desde 1.5.4
  href: string;
}
```

Renderização: `labelKey ? t(labelKey) : label`. Razão: features migradas
em momentos diferentes precisam coexistir. Sem `labelKey` em todos os
níveis, parte da hierarquia fica em PT-BR hardcoded mesmo após migração
de uma feature; com a opção em todos, cada feature ativa o `labelKey`
quando migrar e a hierarquia inteira passa a falar a língua do usuário.

## Convenções de naming

| Contexto | Pattern | Exemplo |
|---|---|---|
| Página (lista) | `{domain}.{feature}.list.{element}` | `ledger.accounts.list.title` |
| Página (detalhe) | `{domain}.{feature}.detail.{element}` | `ledger.account.detail.balance_label` |
| Coluna de tabela | `{domain}.{feature}.column.{name}` | `ledger.accounts.column.code` |
| Estado vazio | `*.empty_state` | `ledger.accounts.list.empty_state` |
| Erro | `error.{domain}.{name}` | `error.ledger.account_not_found` |
| Tipo/enum | `{domain}.{enum_name}.{value}` | `ledger.account_type.asset` |
| Subpanel/nav | `{domain}.subpanel.{item}` | `ledger.subpanel.chart_of_accounts` |
| Comum | `common.{category}.{name}` | `common.actions.save` |

## Procedimento para internacionalizar uma feature

1. **Inventariar**: listar strings hardcoded da feature (grep + olho).
2. **Adicionar ao dicionário** (`pt-BR.ts` e `en-US.ts`) com naming convencional.
3. **Migrar componentes em ordem**: utilitários (`<Money>`, `<Badge>`) → Client
   Components → RSCs.
4. **Threading de locale**: cada RSC chama `getLocale()` e passa como prop.
5. **Mensagens de erro**: classes ganham `code`, UI usa
   `notifyError(err, t)` ou `notifyError("error.feature.specific_key", t)`
   conforme o caso. Em RSC, `translateError(err, locale)`.
6. **Verificar gates**: `npm test`, `npm run lint`, `npm run build`,
   `npm run check:i18n`.
7. **Ativar ESLint estrito**: adicionar paths da feature ao override de
   `react/jsx-no-literals` (com `ignoreProps: true` — props como className
   não são strings de UI).
8. **Validar visualmente** ambas as línguas (smoke mental ou dev server).

## Pattern: Canvas i18n (SVG-based components)

Componentes que renderizam SVG inline têm strings em três categorias:

### Categoria SVG-native
Texto em `<text>` element. Tratamento idêntico a JSX normal:
```tsx
<text x={x} y={y}>{t("network.canvas.empty_state")}</text>
```

### Categoria HTML-overlay
Tooltips/legends posicionados por CSS sobre SVG. Tratamento idêntico a JSX
normal — usar `useT()` no Client Component que renderiza o overlay.

### Categoria Data-driven
Strings geradas por código, possivelmente combinando chrome + dados. Para
chrome com interpolação:
```tsx
// Antes:
const label = `${nome}: ${count} membros`;

// Depois:
const label = t("network.canvas.member_count", { nome, count });
// Dictionary: "network.canvas.member_count": "{nome}: {count} membros"
```

Se a string vem de dado authored (não chrome), preservar cru.

Caso primeiro: 1.5.6b-tris (org-chart-canvas, network-map-canvas).

## Pattern: Sub-tarefa para arquivo grande

Arquivos com >500 linhas e múltiplas seções lógicas (header, toolbar,
filters, rows, footer, modals) merecem migração por agrupamento:

1. Inventariar todas as strings primeiro.
2. Identificar agrupamentos lógicos.
3. Migrar um agrupamento por vez.
4. Validar `npx tsc --noEmit && npm run lint` após cada agrupamento.
5. Se aparecer complexidade não esperada, pausar e reportar.

Caso primeiro: 1.5.6b-tris (user-table.tsx, 690 linhas).

## Pattern: Dedup investigation antes de migrar

Quando sub-feature parece ter cópias de componentes de outra feature:

1. `diff -u arquivo1 arquivo2` line-by-line.
2. Classificar em uma de três categorias:
   - **Categoria 1**: cópias idênticas (>90% mesmo código). PAUSAR e
     reportar — refactor adjacente possivelmente vale a pena.
   - **Categoria 2**: variantes (50-90% sobreposição). Migrar separado,
     anotar para discussão futura.
   - **Categoria 3**: implementações distintas. Migrar separado, sem nota.
3. Pausar é só para Categoria 1 — para 2 e 3, migrar normalmente
   após classificar.

Caso primeiro: 1.5.6b-tris δ.1 (commission-{editor,simulator} forks
in network/promoters/, classified as Category 1, consolidated —
~836 lines of duplicate code eliminated).

## Anti-patterns (evitar)

- ❌ `const label = t(\`prefix.${type}\`)` sem `as any` ou map satisfies.
- ❌ Construir chave de erro manualmente: `t("error." + err.code)`.
- ❌ Hardcode de string em error message para usuário.
- ❌ Componente utilitário lendo locale via context (use prop).
- ❌ `Intl.*` direto no código (use os helpers em `src/lib/i18n/`).
- ❌ `Date.now()` ou `new Date().toLocaleString()` sem helper.
- ❌ Esquecer `await connection()` no topo de RSC com Prisma.
- ❌ Adicionar todas as chaves no dicionário sem usar (vira lixo).
- ❌ Traduzir dados authored pelo usuário (`description`, `reason`, `notes`).
- ❌ Traduzir valores authored pelo usuário. Nomes de cenário criados
  via input livre, descriptions, notes, reasons — são dados de domínio,
  vão crus para o banco e voltam crus para a UI. UI strings são apenas
  o chrome ao redor (labels, buttons, headers).
- ❌ Traduzir o `message` técnico das classes de erro — permanece em inglês
  para logs; o que vai à UI vem da chave de dicionário via `translateError*`.
- ❌ Criar chaves `common.*` "para o futuro" sem caso de uso real. Cada
  chave criada e não referenciada vira ruído no `check:i18n` e drift de
  paridade entre dicionários. Espera primeiro caso real e cria no momento.
- ❌ Migrar feature sem rodar backport quando uma chave local vira
  `common.*`. Drift por duplicação aparece se ledger e knowledge têm
  ambos `*.count_one` e `*.count_other` em vez de reusar
  `common.units.*`. Backport é parte do **mesmo commit** que craveu a
  chave em `common.*`.
- ❌ Usar `toast.success/error` direto em código novo. Sempre use os
  helpers `notify*` em `src/lib/i18n/notify.ts`.
- ❌ Configurar `react/jsx-no-literals` com `ignoreProps: false`. O setting
  `false` flagga TODA prop com string (`className`, `variant`, `href`,
  `data-testid`), gerando ~100 falsos positivos por feature. A regra é sobre
  **texto visível ao usuário em JSX content**, não sobre valores técnicos de
  props. Sempre use `ignoreProps: true`.
- ❌ Lógica de matching/comparação usando string visível ao usuário.
  Match por chave traduzida quebra ao trocar locale. Sempre use
  identificador estável (id, enum value, slug). Ex: detectar tipo de
  conta pela label "Ativo" vs "Asset" é frágil; use `account.type ===
  "ASSET"` direto. Pattern emergiu na 1.5.6a-bis (projection-spreadsheet).
- ❌ Dynamic key construction em runtime via template string:
  `t(\`prefix.${variable}\`)`. TypeScript não consegue verificar que a
  string montada existe no dicionário, e refactoring quebra silenciosamente.
  Sempre use map satisfies: `KEYS[variable]` onde `KEYS` é
  `as const satisfies Record<Variable, MessageKey>`. Pattern emergiu na
  1.5.6b-bis (wizard step titles + permission matrix).
- ❌ Exportar configurações com campo `label` literal hardcoded. Separa
  dados (multipliers, options, ids) de apresentação (labels). Forneça
  helper `getXLabel(item, t)` que recebe a função de tradução. Pattern
  emergiu com TIME_PERIOD_CONFIG em Financials.
- ❌ Misturar chrome strings com data-driven labels num mesmo objeto de
  configuração. Quando isso acontece, separar antes de migrar.

## ESLint config recomendada

Para ativar `react/jsx-no-literals` em paths de uma feature já internacionalizada:

```js
{
  files: [
    "src/components/<feature>/**/*.{ts,tsx}",
    "src/app/admin/<feature>/**/*.{ts,tsx}",
  ],
  rules: {
    "react/jsx-no-literals": ["error", {
      noStrings: true,
      ignoreProps: true,            // crítico — ver anti-pattern acima
      allowedStrings: [" ", "·", "—", "/", "-", "…"],
    }],
  },
},
```

## Allowed strings canônica (ESLint react/jsx-no-literals)

A regra `react/jsx-no-literals` não deve flag glyphs visuais e
caracteres sem semântica de tradução. Lista canônica:

```js
allowedStrings: [
  " ", "·", "—", "/", "-",
  ":", "(", ")", "→", "+", "ℹ",
  "…", "D", "C", "%", "$",
],
```

Caracteres adicionados conforme aparecem casos legítimos. Se aparecer
caso novo (símbolo monetário, separador decimal específico, glyph
técnico), adicione à lista global em `eslint.config.mjs` e atualize
este pattern doc.

## Namespace `common.*`

Estabelecido na Etapa 1.5.5. Strings reutilizadas em **≥3 features** vivem em
`common.*` com sub-categorias permanentes:

- `common.actions.*` — verbos imperativos (save, cancel, delete, edit, etc.)
- `common.states.*` — estados (loading, error, empty, saving, etc.)
- `common.placeholders.*` — placeholders de input
- `common.confirmations.*` — frases de modal de confirmação genérico
- `common.feedback.*` — mensagens de toast/feedback genérico
- `common.time.*` — labels de tempo (today, yesterday, this_week, etc.)
- `common.units.*` — (futuro — cravado caso-a-caso a partir da 1.5.6)

**Regra dura**: chave `common.*` só é criada se for usada em ≥3 contextos.
Uso em 1-2 lugares fica na chave da feature específica.

## Deferred work — registered for future etapas

### Brand-kit promotion to block

Brand-kit (currently at `src/app/admin/organization/brand-kit/*` and
`src/components/brand-kit/*`) is intentionally NOT internationalized in
Fase 1.5. Reason: needs architectural promotion to a reusable block
(consumable by agents, surfaces, other parts of the system) before
i18n. Doing i18n at the wrong path would create rework when the
promotion happens.

Status: deferred. See `docs/discovery/BRAND_KIT_PROMOTION_TO_BLOCK.md`
for future discovery work.

The ESLint ignore list preserves brand-kit paths through Fase 1.5.
When the promotion etapa runs, those paths get migrated as part of the
new architecture, not as standalone i18n work.

### Network feature

Network feature (`/admin/network/*` + `src/components/network/**` +
network-located files in `src/components/organization/`) was deferred
from 1.5.6b to a dedicated 1.5.6b-bis etapa due to scope explosion
discovered during inventory: ~6.800 lines, ~50 files, ~700-1000
strings. The 1.5.6b-bis spec is calibrated against the actual
surface to support 4-5 internal sub-phases.

### Audit underestimation note

The 1.5.1 audit (line counts and string estimates) systematically
underestimated features with **wizards, matrices, and config-heavy
components** by 3-4x. Examples: Financials (estimated ~120 strings,
actual ~400), Network (estimated ~150 strings, actual ~700-1000).
Future audits should multiply estimates by 3-4x for any feature with
multi-step wizards, permission matrices, profile-types with custom
fields, or scenario builders.

## Regras operacionais

### Commit por fase em etapas multi-fase

Em etapas com múltiplas fases (α/β/γ ou δ/ε), commit ao final de cada
fase. Ordem das mudanças dentro de cada fase deve garantir que a fase
termine self-contained com gates verdes (chaves no dicionário antes do
uso, ESLint config junto com a mudança que precisa).

Se vai precisar consolidar entre fases (ex: shared component que mais
de uma fase modifica), **pausa e reporta** — não improvisa solução
silenciosa. Decisão de consolidar deve ser explícita.

## Quando atualizar este documento

Sempre que uma etapa de internacionalização introduzir um pattern novo
ou refinar um existente, atualize este arquivo:

- Nova convenção descoberta: adicione a tabela de naming.
- Novo template necessário: adicione na seção Templates.
- Anti-pattern identificado: adicione na seção Anti-patterns.
- Pattern obsoleto: marque como `> ⚠ DEPRECATED desde etapa X.Y.Z` mas
  preserve o histórico.

Este é um documento vivo. A última atualização vai estar no header.

## Changelog

### v1.7 — 2026-05-01 (Etapa 1.5.6d-γ)

- Template K (Token Auth Flow) cravado. Pattern para auth via token-paste
  (PAT, API key). Estados: disconnected/paste/connecting/connected/error.
  Erros: invalid_token/network/unknown. Ações: retry/cancel.
- APP_PROVIDER_OPTIONS Template D com APP_PROVIDER_TOKEN_AUTH em estrutura
  paralela (technical: scopes, portal URLs, step counts).
- APP_STATUS_OPTIONS Template D reusando KnowledgeDocumentStatus enum
  (PENDING/PROCESSING/READY/ERROR).
- Template L (true OAuth flow com redirect/callback) reservado como
  placeholder para futuro (integrations block).
- Convenção: dashes em slugs viram underscores em MessageKey paths
  (`apple-health` → `apps.providers.apple_health.*`).

### v1.6 — 2026-04-30 (Etapa 1.5.6b-tris)

- Pattern: Canvas i18n (3 categorias: SVG-native, HTML-overlay,
  Data-driven). Caso primeiro: org-chart-canvas, network-map-canvas.
- Pattern: Sub-tarefa para arquivo grande (>500 linhas, migração por
  agrupamento). Caso primeiro: user-table.tsx (690 linhas).
- Pattern: Dedup investigation antes de migrar (3 categorias com PAUSE
  em Categoria 1). Caso primeiro: δ.1 (commission-{editor,simulator}
  forks consolidados).
- Anti-pattern: chrome strings misturadas com data-driven labels em
  config compartilhado.
- Regra operacional: commit por fase em etapas multi-fase.

### v1.5 — 2026-04-30 (Etapa 1.5.6b-bis)

- Pattern de extração de sub-panel especializado documentado como seção
  própria. NetworkSubPanel é o caso primeiro.
- Template J adicionado: multi-step wizard pattern com naming convention
  de chaves, threading de locale, e anti-pattern de dynamic key construction.
- Anti-pattern: dynamic key construction em runtime via template string
  (use map satisfies).
- `src/components/layout/sub-panel-types.ts` extraído para shared types,
  evitando dependência circular entre sub-panel.tsx e sub-panels específicos.

### v1.4 — 2026-04-30 (Etapa 1.5.6b)

- Template I added: `formatNumberAsMoney` bridge for number-as-money
  without refactoring upstream type (cravado em 1.5.6a-bis;
  documentado oficialmente aqui).
- Anti-pattern: matching logic using user-visible strings (use stable
  identifier).
- Anti-pattern: exporting configs with hardcoded label fields.
- Allowed strings list canonicalized.
- Brand-kit deferral registered with rationale.
- Network deferral to 1.5.6b-bis registered with rationale.
- Audit underestimation note (3-4x for wizards/matrices/configs).

### v1.3 — 2026-04-30 (Etapa 1.5.6a-bis)

- `common.units.*` cravado oficialmente (chaves para months, models, scenarios, of_total com forms one/other).
- Pattern de deprecation gradual de funções legacy documentado como Template H:
  `@deprecated` JSDoc + `no-restricted-imports` ESLint + ignore list por path,
  com remoção progressiva da ignore list a cada feature migrada. Final delete na 1.5.7 Capstone.
- Anti-pattern adicionado: traduzir valores authored pelo usuário.
- Bridge helper `formatNumberAsMoney(amount, locale, currency?)` em `@/lib/money/format`
  para legacy code com `number` representando dinheiro USD/BRL sem refatorar para Money tuple.

### v1.2 — 2026-04-30 (Etapa 1.5.6a)

- Template G adicionado: helpers de toast (`notifySuccess`, `notifyError`,
  `notifyInfo`, `notifyWarning`) em `src/lib/i18n/notify.ts`.
- Pattern de `labelKey` em interfaces hierárquicas documentado como
  template explícito.
- Anti-patterns adicionados: criar chaves `common.*` "para o futuro",
  esquecer backport quando chave local vira `common.*`, usar
  `toast.success/error` direto.
- Procedimento passo 5 atualizado para mencionar `notifyError`.

### v1.1 — 2026-04-30 (Etapa 1.5.5)

- Anti-pattern: `ignoreProps: false` em `react/jsx-no-literals` cria falsos
  positivos massivos. Sempre use `true`.
- Seção "ESLint config recomendada" adicionada com config canônica.
- Seção "Namespace `common.*`" adicionada documentando as 7 sub-categorias
  permanentes e a regra de ≥3 contextos.

### v1.0 — 2026-04-30 (Etapa 1.5.4)

- Publicação inicial: 6 templates (A-F), tabela de naming conventions,
  procedimento de internacionalização, anti-patterns.
