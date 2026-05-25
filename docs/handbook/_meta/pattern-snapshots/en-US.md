---
title: "Pattern: Snapshots"
description: "Frozen state photos with configurable period; distinction between progress, balances, positions, and snapshots."
locale: en-US
uid: herd.meta.pattern-snapshots
---

> For AI agents: this pattern is a schema invariant. When creating a state block, consciously decide which suffix to use (`-progress`, `-balances`, `-positions`, `-snapshots`) — each has precise semantics. Snapshot period is always configurable; never hardcode monthly. Decisions settled in the May 2026 architectural session.

# Pattern: Snapshots

Snapshots are **frozen state photos at a point in time**, capturing all relevant fields of an aggregate within a defined period. The critical insight is simple but often missed: **the period is NOT fixed monthly**. Companies have biweekly campaigns, biweekly closings, quarterly rankings, yearly snapshots for fiscal year-end — the system accommodates this flexibility via a configurable `period` field.

Snapshots are part of a larger family of state blocks, each with a canonical suffix that encodes precise semantics: `-progress`, `-balances`, `-positions`, `-snapshots`. Confusing the four produces schemas that look fine but break when the product grows.

## Business

Companies operate on different rhythms. A ranking campaign may last 15 days; financial closing may be biweekly; reseller recognition may be quarterly; the points report for fiscal year-end is yearly. Hardcoding "monthly snapshots" in the schema would mean rewriting tables every time a customer asks for a different period.

The practical consequence is that any "close period and freeze state" logic must carry the period as data, not as an assumption. This enables:

- **Custom-period rankings** with no new code (a special 30-day campaign).
- **Multi-mode financial reports** (monthly view + quarterly view + yearly view over the same history).
- **Reliable year-over-year comparisons** because each snapshot carries its own temporal delimiters.

## Product

### What the profile sees

Profile opens history (Points, Remuneration, Ranking position) and the period selector shows: monthly, biweekly, quarterly, yearly, or custom range. Each option lists the corresponding snapshots. It is not "one page per month" — it is a single view that changes period by selection.

### Canonical examples

- **Biweekly campaign ranking**: a "Summer Promoters" campaign lasts 15 days. The snapshot at the end of the period freezes positions. `period.type: "biweekly"` with `start_date` and `end_date` of the exact range.
- **Standard monthly remuneration**: monthly financial closing — `period.type: "monthly"`. Snapshot captured on the last day of the month containing balance per currency, deductions, final payout.
- **Yearly Points snapshot** for fiscal year-end: `period.type: "yearly"`. Captures total points balance, year's redemptions, projected balance.
- **Special-event ranking** (e.g., 30-day Black Friday): `period.type: "custom"` with start_date and end_date explicitly delimited.

## Architecture

### Canonical snapshot schema

```typescript
snapshot {
  id, profile_id,
  period: {
    type: "monthly" | "weekly" | "biweekly" | "quarterly" | "yearly" | "custom",
    start_date, end_date,
  },
  values: { ... },                           // complete frozen state
  created_at,
}
```

Three inviolable rules:

1. **`period` always present**: never derive period from the block name or a code constant.
2. **`values` captures complete state**: a snapshot is a photo, not a delta. Include every field relevant for state reconstruction at that point.
3. **Snapshot is never modified after creation**: append-only. Correction is via a new snapshot or compensating entries in `-events` (see `pattern-source-attribution`).

### Distinction between state-block types

Common vocabulary conflates "current state" with "history". ComeçaAI distinguishes four formal types — each with its own suffix:

| Suffix | Function | Period? |
|---|---|---|
| `-progress` | Continuous current state (current level + progression history on a track) | NO |
| `-balances` | Dynamic current balance (updates on event) | NO |
| `-positions` | Current ranking + frozen history per period | YES (configurable) |
| `-snapshots` | Generic frozen history per configurable period | YES (configurable) |

Decisive criteria:

- **Current state with no period-close dimension?** → `-progress` (level/track) or `-balances` (numeric value).
- **State with closed-period history?** → `-positions` (Ranking-specific, more semantics) or `-snapshots` (generic).
- **Individual events that sum to the state?** → remain in `-events` (see `pattern-block-level`); `-balances` and `-snapshots` are derived projections.

### Cross-tool snapshot semantics

Each progression tool uses the appropriate suffix:

| Tool | State block(s) | Logic |
|---|---|---|
| Recognition | `recognition-progress` | Current level + progression history (no period) |
| Capacitation | `capacitation-progress` | Current state of completed courses (no period) |
| Ranking | `ranking-positions` | Current rank + positions frozen per period |
| Remuneration | `remuneration-balances` + `remuneration-snapshots` | Dynamic balance + frozen periodic history |
| Points | `points-balances` + `points-snapshots` | Dynamic balance + frozen periodic history |

A recurring pattern: tools that involve **money/accruable points** usually need both (a dynamic balance for computation + snapshots for historical audit). Tools of **level-based progression** usually need only `-progress`.

### Snapshot generation

Snapshots are typically generated by a background job at period close:

1. Cron/scheduler detects a period closing.
2. Job iterates over relevant profiles.
3. For each profile, computes state from period events (plus source attribution for auditability).
4. Persists the snapshot append-only.
5. Individual events remain in `-events` — the snapshot is a projection, not a replacement.

## Operations

### Checklist for creating a state block

1. **Decide state nature**: continuous (no closing) or periodic (with closing)?
2. **Choose appropriate suffix**: `-progress` (continuous level/track), `-balances` (continuous numeric balance), `-positions` (periodic rank — Ranking only), `-snapshots` (generic periodic).
3. **If periodic**: define a `period` field with `type` enum + `start_date` + `end_date`. Always configurable.
4. **Complete `values`**: snapshot must allow state reconstruction without rereading events.
5. **Append-only**: a snapshot is never edited after creation. Correction via a new snapshot or compensating events.
6. **Parallel source attribution**: if the snapshot is derived from events, consider recording `source` on the contributing `-events` (cross-checkable).
7. **Background job**: plan periodic generation via a job at the end of each period.

### Anti-patterns to avoid

- **Hardcoding monthly period**: creating `points-monthly-snapshots` instead of `points-snapshots` with a configurable `period.type`. Breaks when a customer asks for a different period.
- **Mutable snapshot**: editing an existing snapshot when source data changes. Wrong: a snapshot is a historical photo; correction is via a compensating entry on the events block.
- **Snapshot as a replacement for events**: discarding events after generating a snapshot. Wrong: events remain the source of truth; the snapshot is a projection.
- **Confusing suffixes**: using `-history` or `-archive` instead of canonical suffixes. Breaks the semantics table and complicates agents/tooling that rely on suffixes.
- **`-positions` outside Ranking**: the `-positions` suffix is Ranking-specific. Other tools use `-snapshots` for generic periodic history.

## Glossary

- **snapshot**: frozen state photo at a point in time, append-only, with explicit period.
- **progress**: continuous current state of progression (current level + history on a track), no periodic close.
- **balance**: dynamic current balance that updates on event, no periodic close.
- **position**: current rank + frozen history per period; specific to the Ranking tool.
- **period**: explicit temporal window of the snapshot, with type enum and start_date/end_date.
- **period-configurable**: a snapshot's ability to accommodate varied periods (monthly, biweekly, quarterly, yearly, custom).
- **current-state**: current state with no periodic-close dimension — dynamic, updates continuously.
- **historical-state**: state captured at a specific point in time — immutable, append-only.

## Changelog

- **2026-05-04 (v1.0)** — Pattern settled in the R2.5 expanded architectural session (May 2026). Establishes the formal distinction between `-progress`, `-balances`, `-positions`, and `-snapshots`. Snapshots have a configurable period (never hardcoded monthly). Snapshots are append-only; correction via compensating events.
