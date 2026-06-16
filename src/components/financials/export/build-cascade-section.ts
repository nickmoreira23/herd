// Profit cascade section for XLSX export — mirrors the on-screen cascade
// (projection-spreadsheet accrual / AggregateCohortTable cash). Sourced from
// `profitDistribution.{accrual|cash}` + the matching `totals`. Returns null
// when there are no parties and nothing undistributed (the cascade collapses,
// same gate as the screens).

import type { ScenarioResults } from "@/lib/financial-engine";
import type { ExportRow, ExportSection, ExportTranslate } from "./types";

type DistMonths = ScenarioResults["profitDistribution"]["accrual"];
type PartyTotals = ScenarioResults["profitDistribution"]["totals"]["accrual"];

export function buildCascadeSection(
  dist: DistMonths,
  totals: PartyTotals,
  revenueValues: number[],
  t: ExportTranslate,
): ExportSection | null {
  if (
    dist.length === 0 ||
    (totals.length === 0 && !dist.some((d) => d.undistributed !== 0))
  ) {
    return null;
  }
  const rows: ExportRow[] = [
    { label: t("financials.cascade.revenue"), type: "currency", totalMode: "sum", values: revenueValues },
    { label: t("financials.cascade.shared_costs"), type: "currency", totalMode: "sum", values: dist.map((d) => d.sharedCosts) },
    { label: t("financials.cascade.distributable"), type: "currency", totalMode: "sum", bold: true, values: dist.map((d) => d.distributable) },
  ];
  for (const party of totals) {
    const pid = party.partyId;
    const slice = (key: "amount" | "partyCost" | "net") =>
      dist.map((d) => d.byParty.find((b) => b.partyId === pid)?.[key] ?? 0);
    rows.push({ label: t("financials.pl.party_label", { name: party.name, percent: party.percent }), type: "currency", totalMode: "sum", level: 1, values: slice("net") });
    rows.push({ label: t("financials.cascade.party_gross"), type: "currency", totalMode: "sum", level: 2, values: slice("amount") });
    rows.push({ label: t("financials.cascade.party_cost"), type: "currency", totalMode: "sum", level: 2, values: slice("partyCost") });
  }
  rows.push({ label: t("financials.cascade.undistributed"), type: "currency", totalMode: "sum", values: dist.map((d) => d.undistributed) });
  rows.push({ label: t("financials.cascade.channel_result"), type: "currency", totalMode: "sum", bold: true, values: dist.map((d) => d.channelResult) });
  return { header: t("financials.projection.section.profit_split"), rows };
}
