---
name: practice-financial-engine
description: Working with HERD's CFO-grade projection engine. Use this skill whenever the user mentions financial projections, scenario modeling, MRR/ARR, cohort revenue, or modifies code under `src/lib/financial-engine.ts`, `src/components/financials/`, or `src/lib/financial-engine.*.test.ts`. Read this BEFORE making any change to the engine, its KPI surface, or its UI consumers. Do NOT use for unrelated forecasting concerns — this skill is specifically about the projection engine that powers the board-meeting view.
license: Apache-2.0
title: Financial Projection Engine
version: "1.0"
last_updated: "2026-05-08"
status: stable
metadata:
  herd:
    classification: practice
    abstract: Operational guide for any change touching the projection engine. Distills 10 sub-threads of CFO-grade audit (A.1 → D.3.3). Companion to AGENTS.md (principles) and src/lib/financial-engine.README.md (technical map).
---

# Financial Projection Engine — Skill Reference

Procedure for any change touching `src/lib/financial-engine.ts`, the
`ScenarioResults` shape, or its UI consumers
(`src/components/financials/`). Companion to the principles in
`AGENTS.md` and the technical map in
`src/lib/financial-engine.README.md`.

## When to use

Trigger on: modifying `calculateScenario(...)` or any
`ScenarioResults` field; adding an aggregate KPI; touching a UI
consumer (Metrics, Statement, Charts, Summary, Cohort); editing
fixtures or pin values in `financial-engine.*.test.ts`.

## Before touching code

1. Read the KPI semantics table in
   `src/lib/financial-engine.README.md` — the category
   (period-average / per-sub steady-state / Mo-1 snapshot / exit)
   dictates the correct UI consumer pattern.
2. Skim the doc block above `const operationalOverheadMonthly = ...`
   in the engine — the "scalar × multiplier" meta-lesson lives there.
3. Confirm `npm test` is green at baseline so any failure is yours.

## Patterns of fix

- **`scalar × multiplier` smell.** A UI computing `<monthly> × m`
  is wrong unless the scalar is provably constant. Fix: emit
  per-month inside the projection loop using `currentSubs`,
  declare the aggregate post-loop as that series' average,
  rewrite consumers with `sumOver(key)`. References: A.2
  (`91f163d`), A.3.2 (`6aeabf9`), D.2 (`0942215`), D.3.2 (`e7187a3`).
- **Semantic ambiguity.** When one field has several defensible
  readings, expose them all and alias the historical name to the
  SaaS convention (D.3.3 / `5b6c3ec`).
- **"Approximation reasonable" comment.** Red flag — it
  usually justifies the same anti-pattern those fixes erased.

## Invariants that must not break

- **Audit pinned reconciliation.** Σ `cohortProjection[i].revenue`
  in the audit scenario = **$879,956**.
  Σ `cohortLifecycles[].totals.revenue` = **$990,498**. Diff
  ($110,542) is deferred revenue (accrual vs cash).
- **LTV/CAC isolation.** `results.ltvCac.*` uses per-sub
  steady-state math only. Aggregate-scalar refactors must not
  bleed into it.
- **No double-count of breakage.** `totalProductCost` already
  reflects reduced COGS via `creditRedemptionRate ×
  avgCOGSToMemberPriceRatio`. `totalBreakageProfit` is
  informational only.
- **`mrr` is the period average.** Repointing it requires its
  own thread.

## Gates before commit

`npx tsc --noEmit`, `npm run lint` (no new warnings),
`npm test` (≥ 199 passing). `npm run build` currently fails
only at `earnings-client.tsx:145` (Thread C debt) — anything
else is yours.

## Pause-and-report signals

Stop and ask before continuing if any of:

- A regression test fails with `>1000%` magnitude delta.
- An audit pinned value moves ($879,956 / $990,498).
- LTV/CAC values change beyond rounding.
- A microinvestigation premise turns out empirically false
  (D.3.3 case: "audit scenario is flat" was wrong; decision
  may still hold but the justification needs rewrite).

## History

Distills 10 sub-threads (A.1 → D.3.3, commits `91f163d` →
`5b6c3ec`). The audit ran under an external chat-driven spec
protocol with pause-and-report gates; that protocol is **not**
prescribed here as a repo rule — the technical invariants
above stand regardless.





