# `financial-engine` — Technical map

The CFO-grade projection engine that powers HERD's board-meeting
view. Pure function (`calculateScenario`) over a typed
`FinancialInputs` shape, returning a typed `ScenarioResults`
shape. No I/O, no side effects.

For invariants that must not break: see the `## Financial engine`
section in `AGENTS.md`. For the change procedure: see
`.agents/skills/practice-financial-engine/SKILL.md`.

## Architecture

```
FinancialInputs                   ScenarioResults
─────────────────                 ─────────────────
tiers[], cycles,           ┌──►   mrr, arr*, margins, …
overhead, channels,    ────┤      cohortProjection[36]
commissions, partners      │      cohortLifecycles[≤36]
                           │      ltvCac, profitDistribution
                           ▼
                  PROJECTION LOOP
              (36 months, churn-aware,
               cohort-tracked, accrual)
```

The projection loop emits `cohortProjection[i]` (one entry per
calendar month, summing every active cohort) and
`cohortLifecycles[c]` (one entry per acquisition month, followed
forward — cash-flow attributed). Every aggregate scalar in
`ScenarioResults` is derived **after** the loop from those two
series; standalone `Mo1Subs × something` computations were the
bug class eradicated by Threads A.2 / A.3.2 / D.2 / D.3.2.

## KPI semantics

| Field | Source | Semantics | Test |
|---|---|---|---|
| `mrr` | avg of `cohortProjection.revenue` | period average MRR | `aggregate-scalars [A1]` |
| `mrrExit` | `cohortProjection[N-1].revenue` | run-rate at horizon end | `arr-semantics [12]` |
| `arr` | alias of `arrExit` | SaaS-convention ARR | `arr-semantics [4]` |
| `arrAvg` | `mrr × 12` | avg-MRR annualized (reading α) | `aggregate-scalars [A3]`, `arr-semantics [1,9,11]` |
| `arrExit` | `mrrExit × 12` | exit ARR (reading β) | `arr-semantics [2]` |
| `revenueY1` | Σ `cohortProjection[0..11].revenue` | realized Y1 top-line (γ) | `arr-semantics [3]` |
| `revenueByTier[]` | per-tier avg of monthly revenue | period averages, per-tier | covered by D.2 suite |
| `totalProductCost` | avg of `cogsExpense` | period-avg COGS | `aggregate-scalars` |
| `totalFulfillmentCost` | `avgSubs × (fulfill+ship)` | period-avg fulfillment | `aggregate-scalars` |
| `costPerSubscriber` | per-sub steady-state | time-invariant ratio | `aggregate-scalars` |
| `totalCommissionExpense` | avg of `commissionExpense` | period average | `aggregate-scalars` |
| `commissionPerSubscriber` | per-sub steady-state | time-invariant ratio | `aggregate-scalars` |
| `commissionPercentOfRevenue` | `commission/mrr × 100` | ratio of period averages | `aggregate-scalars` |
| `totalKickbackRevenue` | Σ partner inputs | flat per month (input-driven) | `D.3a diagnostic` (non-bug) |
| `totalBreakageProfit` | avg of `breakageProfit` | period-avg, informational | `breakage` |
| `grossMarginDollars` | `mrr − totalProductCost` | period-avg | `aggregate-scalars` |
| `grossMarginPercent` | ratio | period-avg ratio | `aggregate-scalars` |
| `netMarginDollars` | avg of `netProfit` | period-avg | `aggregate-scalars` |
| `netMarginPercent` | ratio | period-avg ratio | `aggregate-scalars` |
| `chargebacksPerMonth` | avg of `chargebacks` | period average | `aggregate-scalars` |
| `chargebackCostPerMonth` | avg of `chargebackCost` | period average | `aggregate-scalars` |
| `welcomeKitCostPerMonth` | avg of `welcomeKitCost` | period average | `welcome-kit`, `aggregate-scalars` |
| `newSubsFromReps` / `newSubsFromSamplers` / `newSubscribersPerMonth` | Mo 1 acquisition counts | Mo 1 snapshot | covered indirectly |
| `month1Reps` / `month1SamplerSpend` / `month1SamplersDistributed` | Mo 1 only | Mo 1 snapshot | — |
| `ltvCac.{blendedLTV, blendedCAC, ltvCacRatio, monthsToPayback, perTier[]}` | per-sub steady-state | time-invariant per-sub math | `arr-semantics [10]` |
| `tierDetails[].subscribers` | period-avg per-tier subs | average | `aggregate-scalars` |
| `tierDetails[].{revenuePerSub, cogsPerSub, marginPerSub, marginPercent, ltv}` | per-sub steady-state | time-invariant | `aggregate-scalars` |
| `cohortProjection[]` | per-month emissions | accrual basis source-of-truth | every regression file |
| `cohortLifecycles[]` | per-acquisition cohorts | cash-flow attribution | reconciliation |
| `profitDistribution.{accrual[], cash[], totals}` | per-month cascade (shared/party cost attribution + loss handling) + per-party totals | canonical profit split | `profit-distribution` |
| `operationBreakevenMonth` | first month `cumulativeProfit > 0` (sustained) | months until profitable | `stressed-overhead` |
| `commissionBreakdown?` | optional D2D breakdown | snapshot when D2D plan active | — |

`PROJECTION_MONTHS = 36`. Categories: **period-avg** = aggregated
from `cohortProjection`; **steady-state per-sub** = derived from
tier-level inputs (time-invariant); **Mo-1 snapshot** = explicit
acquisition counts at month 1; **exit** = last-month value.

## Accounting basis

`cohortProjection[].revenue` is **accrual** — biannual/annual
subscriber revenue is smoothed across the cycle. `cohortLifecycles[].months[].revenue`
is **cash flow** — biannual/annual revenue lumps at billing months
(Mo 1, Mo 7, Mo 13 for biannual; Mo 1, Mo 13, Mo 25 for annual).
The `<AccountingBasisBadge>` and `<AccountingBasisReconciliation>`
components surface the difference. Audit pinned values:

| | 36-month sum | Source |
|---|---:|---|
| Accrual revenue | **$879,956** | Σ `cohortProjection[i].revenue` |
| Cash revenue | **$990,498** | Σ `cohortLifecycles[c].totals.revenue` |
| Deferred (cash − accrual) | **$110,542** | upfront prepayments not yet earned |

Asserted by `aggregate-scalars [A4, A5]` and
`arr-semantics [8]`.

## Regression test map

| File | Threads | What it pins |
|---|---|---|
| `financial-engine.stressed-overhead.test.ts` | A.2 | Cumulative & yearly overhead under milestone-scaled config; Mo-1-frozen → sum-of-monthly-series fix |
| `financial-engine.welcome-kit.test.ts` | A.3.2 | Cumulative & yearly welcome-kit cost in growth scenario |
| `financial-engine.aggregate-scalars.test.ts` | D.2 | 19-assertion suite covering 9 scalars (revenue, COGS, commission, fulfillment, chargeback, gross margin, tier subs, revenue-by-tier) |
| `financial-engine.breakage.test.ts` | D.3.2 | Per-month `breakageProfit` aggregation; default-seed = 0 invariant; non-double-count |
| `financial-engine.arr-semantics.test.ts` | D.3.3 | `arrAvg` / `arrExit` / `revenueY1` divergence in growth; alias chain; audit-scenario direction |

## Bug class history

The audit eradicated four interrelated bug classes. Inline doc
blocks in `financial-engine.ts` carry the meta-lesson; commits
below are the canonical fix per class.

| Class | Fix commit | Inline doc |
|---|---|---|
| `resolveOverhead(.., 0)` — Mo-1-frozen overhead lookup | `91f163d` (A.2) | meta-lesson block at `operationalOverheadMonthly` declaration |
| Welcome-kit linearization (`Mo1NewSubs × kitCost × multiplier`) | `6aeabf9` (A.3.2) | block at `welcomeKitCostPerMonth` declaration |
| Aggregate-scalar surface (9 scalars, up to 5,697%/36mo error) | `0942215` (D.2) | "ROOT-CAUSE ERADICATION" block in same doc region |
| Breakage informational disclosure (Mo-1-frozen) | `e7187a3` (D.3.2) | comment at `totalBreakageProfit` post-loop declaration |
| ARR semantic ambiguity | `5b6c3ec` (D.3.3) | "ARR semantic disambiguation" block at `mrrExit` declaration |

UI consumers were rewritten in the same commits to use
`sumOver(key)` (sum-of-first-m-months) instead of
`scalar × multiplier`. Helper present in
`pl-statement.tsx` and `metrics-panel.tsx`.

## Canonical scenarios for diagnosis

**Audit scenario** (`financial-engine.aggregate-scalars.test.ts`,
`buildAuditScenario`): 10 reps × 5 sales/mo, no rep growth,
5%/mo churn, 36mo, no credits, package-COGS only. Σ revenue
= $879,956 exact. Despite "no rep growth", this scenario
**ramps** from ~50 subs (Mo 1) to ~1,000 subs (steady state)
due to acquisitions vs churn — α and β diverge ~1.51×
(documented in `arr-semantics [7]` after the D.3.3
pause-and-report).

**Stressed scenario** (same file, `buildStressedScenario`):
100 reps × 5 sales/mo, 10%/mo rep growth, 36mo, single-milestone
overhead at $5k/mo. Used to exercise the `scalar × multiplier`
class — α/β diverge ~3.54×, growth amplifies every Mo-1-frozen
defect.

To reproduce a quantification or build a diagnostic, copy these
shapes from the corresponding `build*Scenario` helper.
