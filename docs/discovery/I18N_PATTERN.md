# i18n Pattern Reference

> Estabelecido na Etapa 1.5.4 (Ledger Internationalization).
> Pattern canônico para internacionalizar features do HERD.
> Última atualização: 2026-04-30.

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
5. **Mensagens de erro**: classes ganham `code`, UI usa `translateError*`.
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
- ❌ Traduzir o `message` técnico das classes de erro — permanece em inglês
  para logs; o que vai à UI vem da chave de dicionário via `translateError*`.

## Quando atualizar este documento

Sempre que uma etapa de internacionalização introduzir um pattern novo
ou refinar um existente, atualize este arquivo:

- Nova convenção descoberta: adicione a tabela de naming.
- Novo template necessário: adicione na seção Templates.
- Anti-pattern identificado: adicione na seção Anti-patterns.
- Pattern obsoleto: marque como `> ⚠ DEPRECATED desde etapa X.Y.Z` mas
  preserve o histórico.

Este é um documento vivo. A última atualização vai estar no header.
