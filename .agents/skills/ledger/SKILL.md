---
name: ledger-foundation
description: Working with ComeçaAI's double-entry ledger. Use this skill whenever the user mentions accounts, journal entries, journal lines, money operations, balance calculations, reversals, idempotency in financial flows, or modifies code under src/lib/ledger/ or src/lib/money/. Read this BEFORE making any financial change. Do NOT use for non-financial accounting concerns (audit logs of unrelated state, etc.) — this skill is specifically about the double-entry ledger.
license: Apache-2.0
title: Ledger (Double-Entry Bookkeeping)
phase: "1"
etapa: "1.9"
version: "1.1"
last_updated: "2026-04-30"
aggregates:
  - Account
  - JournalEntry
  - JournalLine
status: stable
metadata:
  herd:
    classification_pending: unclassified
    target_path: .agents/skills/feature-foundation-ledger/
    notes: "Migration to feature-{level}-{id}/ layout deferred to backfill etapa."
---

# Ledger — Skill Reference

This document is the canonical reference for the double-entry ledger that
underlies all financial movement in ComeçaAI. It encodes invariants, conventions,
and patterns established across Phase 1 (etapas 1.1 through 1.8). Read it
before making any change that touches `src/lib/ledger/`, the `accounts`,
`journal_entries`, or `journal_lines` tables, or any code that emits financial
movements.

## Mental model

The ledger is **append-only and immutable**. Every monetary movement in the
system is represented as a `JournalEntry` containing two or more `JournalLine`s
that sum to zero per currency. Lines never change. Entries are never deleted.
Corrections happen via compensating entries (reversals).

The ledger is **transactional truth**, not a cache. Saldos are computed from
journal lines on demand. Materialization may be added later when volume
justifies; for Phase 1 it does not exist.

The ledger is **agnostic to business meaning**. It does not know about
products, partners, or commissions — only accounts, debits, credits, and
journal entries linked to a `(sourceKind, sourceId)` polymorphic reference.
Higher layers attach meaning.

## Core invariants

### Invariant 1: Money is a tuple

> Money is always represented as `(amountCents: bigint, currency: CurrencyCode)`.
> Never as `number`. Never as `Decimal`. Never as a single value with currency
> implied by context.

The `Money` type lives in `src/lib/money/`. All arithmetic happens via the
exported helpers (`add`, `subtract`, `applyBasisPoints`, etc.) which reject
mixed-currency operations at runtime.

```ts
import { money, add, applyBasisPoints } from "@/lib/money";

const price = money(10000n, "BRL");           // R$ 100,00
const tax = applyBasisPoints(price, 1000n);   // 10% = R$ 10,00
const total = add(price, tax);                // R$ 110,00
```

The legacy `Decimal(10,2)` columns elsewhere in the schema (Product, Package,
etc.) interoperate via `moneyFromDecimal` / `moneyToDecimalString`. New code
should not accept `Decimal` directly.

### Invariant 2: Every entry balances per currency

> For every `JournalEntry`, the sum of debit lines equals the sum of credit
> lines, separately for each currency in the entry.

Enforced at the database level by `trg_journal_entry_balance` (deferrable
constraint trigger that fires at COMMIT time). Also re-validated in
`postJournalEntry` before the round-trip, for ergonomic error reporting.

The "per currency" qualifier matters: an entry may legitimately contain lines
in BRL and lines in USD; each currency must balance independently. There is no
implicit currency conversion in the ledger.

### Invariant 3: Account currency is fixed

> Every `Account` has a single, immutable `currency`. Every `JournalLine`
> targeting an account must have the same currency as the account.

Enforced by `trg_journal_line_currency_match` (BEFORE INSERT trigger). This
prevents the per-currency balance check from being subverted by mismatching
the line's declared currency from its account's actual currency.

### Invariant 4: Amounts are strictly positive

> `JournalLine.amountCents > 0`. Always. Subtraction is expressed via
> `direction = 'C'` on the appropriate side.

CHECK constraint `chk_journal_line_amount_positive` enforces this. Negative
amounts are not just discouraged — they are illegal.

### Invariant 5: Account codes follow a strict naming pattern

> Account codes match the regex `^[a-z0-9_:-]+$` and use lowercase, with `:`
> as separator. Format: `{ownerKind}:{semanticRole}:{currency}` for platform
> accounts; `profile:{uuid-no-hyphens}:{semanticRole}:{currency}` for
> per-profile (when introduced in later phases).

CHECK constraint `chk_account_code_format` enforces the regex.

```
✓ platform:revenue:brl
✓ platform:partner_payable:usd
✓ external:gateway-stripe:brl
✗ Platform:Revenue:BRL  (uppercase forbidden)
✗ platform/revenue/brl  (slash forbidden)
✗ platform:revenue       (no currency suffix — also forbidden by spec)
```

### Invariant 6: Currency must be supported

> `accounts.currency` ∈ `{ 'BRL', 'USD' }`. Adding a new currency requires
> a coordinated change: update `SUPPORTED_CURRENCIES` in `src/lib/money/`,
> drop and recreate the CHECK constraint with the new code, update tests.

CHECK constraint `chk_account_currency_supported` enforces the whitelist.

### Invariant 7: Postgres columns are camelCase, not snake_case

> Despite tables being mapped to snake_case (e.g. `journal_entries`), columns
> remain camelCase (`accountId`, `amountCents`, `journalEntryId`). The Prisma
> schema does NOT use `@map` per-field — it relies on Prisma's default
> behavior of preserving the field name as the column name.

This is project-wide convention, observed across all 114 models. SQL written
directly (triggers, raw queries) must quote camelCase identifiers:

```sql
SELECT "amountCents" FROM journal_lines WHERE "journalEntryId" = $1
```

Forgetting the quotes causes Postgres to lowercase the identifier and fail
with "column does not exist".

### Invariant 8: Ledger is append-only; corrections via reversal

> Once posted, a `JournalEntry` is never modified or deleted. To undo, use
> `reverseJournalEntry(originalId, { reason })` which creates a compensating
> entry with `sourceKind: REVERSAL`, `sourceId: <originalId>`, and lines with
> directions flipped.

A reversal is a JournalEntry like any other. Querying `findReversalsOf(id)`
tells you whether an entry has been reversed. The original entry's row never
changes.

```ts
const reversal = await reverseJournalEntry(originalEntry.id, {
  reason: "Cliente solicitou estorno após cancelamento",
});
```

Reversal of a reversal is forbidden. Partial reversal does not exist —
for partial undo, post a new compensating entry shaped to the desired effect.

### Invariant 9: Idempotency precedes double-reversal protection

> When `reverseJournalEntry` is called with an `idempotencyKey` that already
> exists for a reversal of the same original, return the existing reversal
> silently. Without an `idempotencyKey`, double reversal of the same original
> throws `EntryAlreadyReversedError`.

This is a deliberate inversion: idempotency keys are an explicit signal of
"I'm retrying", and they take precedence over the protection that would
otherwise apply. Without a key, double reversal stays protected.

### Invariant 10: postJournalEntry is the only write path

> All writes to `journal_entries` and `journal_lines` go through
> `postJournalEntry()`. Tests that need fixtures call `postJournalEntry()`.
> Seeds that bootstrap state call `postJournalEntry()`. Migrations don't
> populate journal data.

The constraints at the DB level (`trg_journal_entry_balance`, etc.) protect
against bugs in the service layer, but `postJournalEntry` is the ergonomic
boundary: pre-flight validation, idempotency by payload comparison, account
resolution by `code` instead of UUID, and structured error throwing.

### Invariant 11: postedAt drives chronology

> Saldos at a point in time use `postedAt`, not `createdAt`. Statement ordering
> uses `(postedAt ASC, id ASC)`. Backdated entries are rare but legal — they
> represent retroactive corrections within the same fiscal context.

`postedAt` defaults to `now()` when not provided. Use the parameter sparingly
and document when you do.

### Invariant 12: Account natural polarity is type-driven

> Saldos returned by `getAccountBalance` use natural polarity:
> - **ASSET, EXPENSE**: balance = D - C (positive when debited)
> - **LIABILITY, REVENUE, EQUITY**: balance = C - D (positive when credited)

The signed value lives in `result.balance`; the unsigned components are
exposed as `result.rawDebits` and `result.rawCredits`. Callers that need raw
sums use them; callers that want "the saldo" use `balance`.

This is fundamental accounting, not project convention. Codified in
`src/lib/ledger/account-polarity.ts`.

### Invariant 13: User-facing strings are internationalized

> All user-facing strings in the ledger UI go through `t()` (RSC) or `useT()`
> (Client). Error classes have a `code: string` field. Money, dates, and
> numbers use the helpers in `src/lib/i18n/` with `locale` as prop.

Enforced by ESLint rule `react/jsx-no-literals` applied to
`src/components/ledger/**` and `src/app/admin/ledger/**` paths.

The error class `code` field powers `translateError` /
`translateErrorWithT` in `src/lib/i18n/translate-error.ts` — the helpers
look up `error.{code}` in the dictionary and auto-extract
string/number/bigint fields from the error as interpolation params.
Technical messages (`Error.message`) stay in English for logs; user-facing
copy comes from the dictionary. See
`docs/discovery/I18N_PATTERN.md` for the canonical pattern.

Audit: visual smoke test in both pt-BR and en-US.

## Conventions

These are not invariants (no constraint enforces them), but they are project
norms. Deviations create friction.

### Convention A: Service injection of TransactionClient

All ledger services accept `client: PrismaClient | TransactionClient` as the
last parameter, defaulting to the `prisma` singleton.

```ts
postJournalEntry(input, tx);  // inside an open transaction
postJournalEntry(input);      // standalone
```

This pattern lets callers compose multiple ledger operations atomically:

```ts
await prisma.$transaction(async (tx) => {
  const entry = await postJournalEntry(input, tx);
  const reversal = await reverseJournalEntry(entry.id, { reason: "..." }, tx);
  // both operations succeed or both roll back
});
```

### Convention B: PrismaPg adapter for tests

Integration tests instantiate `new PrismaClient({ adapter: new PrismaPg(connectionString) })`
where `connectionString` is `process.env.DIRECT_URL || process.env.DATABASE_URL`.
**Positional argument**, not object form. Object form (`PrismaPg({ connectionString })`)
does not work with the project's Supabase configuration.

### Convention C: dotenv at the top of CLI scripts

CLI scripts (`prisma/seeds/seed-ledger.ts`, `src/scripts/check-invariants.ts`,
`src/scripts/worker-domain-events.ts`, etc.) **must** start with
`import "dotenv/config";`. `tsx` running outside of Next.js does not load
`.env` automatically; without this import, the prisma singleton's Proxy falls
into its no-op fallback and silently returns empty data instead of erroring.

### Convention D: await connection() in every RSC

React Server Components that call ledger services must call `await connection()`
before any Prisma operation. Without it, Next.js may pre-render the page
statically and the prisma singleton's Proxy will return no-op fallback data.

```tsx
import { connection } from "next/server";

export default async function LedgerPage() {
  await connection();
  const balances = await listAccountsWithBalance();
  // ...
}
```

### Convention E: Integration tests use `.integration.test.ts` suffix

Tests that require a live database use the suffix `.integration.test.ts`. The
default `npm test` excludes them; `npm run test:ledger` (and any future
DB-aware test command) targets them via inclusion.

### Convention F: Anti-flake — fixed timestamps in test seeds

Tests that involve `postedAt` filtering must use **fixed absolute timestamps**
(e.g. `new Date("2024-01-15T10:00:00.000Z")`) for seed entries. **Never** use
`Date.now()` minus an interval — millisecond-level drift between rapid test
runs causes flakiness.

```ts
// ✗ Flaky:
const past = new Date(Date.now() - 60 * 60 * 1000);

// ✓ Stable:
const earlierPosted = new Date("2024-01-15T10:00:00.000Z");
const laterPosted = new Date("2024-06-15T10:00:00.000Z");
```

### Convention G: Vitest 4 — fileParallelism: false for integration

Vitest 4 parallelizes test files by default. Integration tests that share
the same database tables must opt out via `fileParallelism: false` at the top
level of the config (NOT inside `poolOptions`, which was removed in Vitest 4).

### Convention H: BlockListPage props (when listing accounts)

The shared `<BlockListPage>` wrapper requires:
- `key` (not `id`) on filter definitions
- `blockName: string`
- `getId: (item) => string`
- For nested fields, `filterFn: (row, value) => ...` instead of relying on
  flat key access
- `id + accessorFn` instead of dotted `accessorKey` strings

These are observed conventions of `src/components/shared/block-list-page/`,
documented after the 1.7 etapa adapted to them.

### Convention I: BigInt and Date serialization at RSC→Client boundary

Client Components cannot receive `BigInt` or `Date` props directly. The RSC
layer serializes via the helpers in `src/lib/ledger/serialize.ts`:

```ts
const balance = await getAccountBalance(code);
return <ClientComponent balance={serializeAccountBalance(balance)} />;
```

The serialized type uses `string` for both, with the receiver parsing back
to `bigint` / `Date` only when necessary (rare for display-only paths).

## Computable invariants

The script `npm run check:invariants` runs three SQL-level invariant checks
against the database and reports violations. Use as operational audit (e.g.,
after restoring from backup, after a major schema change, periodically). Not
wired into CI because CI does not provision a database.

The three checks:

1. **Every entry balances per currency** — finds entries where `SUM(D) ≠ SUM(C)` for any currency.
2. **Every account code matches the regex** — finds accounts violating the format.
3. **Every line currency matches its account** — finds lines whose currency differs from its account's.

If all three return zero violations, exit 0. Any violation causes exit 1
with the offending IDs printed.

The constraints at the DB level should make these violations impossible, but
the script exists as defense-in-depth: detects drift if someone bypasses
constraints (direct SQL, partial backup restore, broken migration).

## How to update this skill

When a future etapa changes ledger behavior or introduces a new invariant:

1. **Document the change in the changelog section below.** Date, etapa, what
   changed and why.
2. **Bump the `version` in front matter.**
   - Adding/clarifying invariant: minor bump (1.0 → 1.1).
   - Removing/contradicting invariant: major bump (1.0 → 2.0).
3. **Update `last_updated`** in front matter (ISO date).
4. **If contradicting a previous invariant**, mark the old one as
   `> ⚠ DEPRECATED since etapa X.Y` rather than deleting. Preserves the
   historical record.
5. **Update the SKILL atomically with the etapa that introduces the change.**
   Don't merge the etapa code without the SKILL update.

## Changelog

### v1.1 — 2026-04-30 (Etapa 1.5.4)

- Added Invariant 13: ledger UI strings internationalized via t()/useT().
- Error classes (ledger + domain-events + money — 23 total) gained
  `code: string` field, consumed by `translateError*` helpers.
- Sub-panel labels use translation keys via `SubPanelLink.labelKey`.

### v1.0 — 2026-04-30 (Etapa 1.9)
Initial publication, codifying invariants and conventions established in
Phase 1, etapas 1.1 through 1.8.
