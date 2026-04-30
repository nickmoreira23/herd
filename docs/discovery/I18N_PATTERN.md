# i18n Pattern Reference

> Estabelecido na Etapa 1.5.4 (Ledger Internationalization).
> Pattern canônico para internacionalizar features do HERD.
> Versão: 1.3 — última atualização: 2026-04-30 (Etapa 1.5.6a-bis).

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
