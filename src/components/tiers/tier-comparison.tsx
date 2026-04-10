"use client";

import type { SubscriptionTier } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star } from "lucide-react";
import { formatCurrency, formatPercent, toNumber } from "@/lib/utils";
import { calculateTierPreview } from "@/lib/financial-engine";

interface TierComparisonProps {
  tiers: SubscriptionTier[];
  settings: {
    redemptionRate: number;
    cogsRatio: number;
    breakageRate: number;
    fulfillment: number;
    shipping: number;
    commissionResidual: number;
    commissionBonus: number;
  };
}

export function TierComparison({ tiers, settings }: TierComparisonProps) {
  const previews = tiers.map((tier) => ({
    tier,
    preview: calculateTierPreview({
      monthlyPrice: toNumber(tier.monthlyPrice),
      quarterlyPrice: toNumber(tier.quarterlyPrice),
      annualPrice: toNumber(tier.annualPrice),
      monthlyCredits: toNumber(tier.monthlyCredits),
      apparelCOGSPerMonth:
        tier.apparelCadence === "MONTHLY"
          ? toNumber(tier.apparelBudget ?? 0)
          : tier.apparelCadence === "QUARTERLY"
            ? toNumber(tier.apparelBudget ?? 0) / 3
            : 0,
      billingDistribution: { monthly: 60, quarterly: 25, annual: 15 },
      creditRedemptionRate: settings.redemptionRate,
      avgCOGSToMemberPriceRatio: settings.cogsRatio,
      breakageRate: settings.breakageRate,
      fulfillmentCost: settings.fulfillment,
      shippingCost: settings.shipping,
      commissionFlatBonus: settings.commissionBonus,
      commissionResidualPercent: settings.commissionResidual,
      operationalOverheadPerSub: 0,
    }),
  }));

  const marginColor = (pct: number) =>
    pct >= 50
      ? "text-green-600 dark:text-green-400"
      : pct >= 30
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  type Row = {
    label: string;
    values: string[];
    type?: "header" | "highlight" | "margin";
    colorFn?: (i: number) => string;
  };

  const rows: Row[] = [
    {
      label: "Monthly Price",
      values: previews.map((p) => formatCurrency(toNumber(p.tier.monthlyPrice))),
    },
    {
      label: "Quarterly Price/mo",
      values: previews.map((p) => formatCurrency(toNumber(p.tier.quarterlyPrice))),
    },
    {
      label: "Annual Price/mo",
      values: previews.map((p) => formatCurrency(toNumber(p.tier.annualPrice))),
    },
    {
      label: "Monthly Credits",
      values: previews.map((p) => formatCurrency(toNumber(p.tier.monthlyCredits))),
    },
    {
      label: "Partner Discount",
      values: previews.map((p) => formatPercent(toNumber(p.tier.partnerDiscountPercent))),
    },
    {
      label: "AI Features",
      values: previews.map((p) => String(p.tier.includedAIFeatures.length)),
    },
    {
      label: "Apparel",
      values: previews.map((p) => p.tier.apparelCadence.toLowerCase()),
    },
    { label: "Unit Economics", values: [], type: "header" },
    {
      label: "Revenue/sub",
      values: previews.map((p) => formatCurrency(p.preview.revenuePerSub)),
    },
    {
      label: "Credit COGS",
      values: previews.map((p) => formatCurrency(p.preview.creditCOGS)),
    },
    {
      label: "Total COGS",
      values: previews.map((p) => formatCurrency(p.preview.totalCOGS)),
    },
    {
      label: "Gross Margin $",
      values: previews.map((p) => formatCurrency(p.preview.grossMarginDollars)),
      type: "highlight",
    },
    {
      label: "Gross Margin %",
      values: previews.map((p) => formatPercent(p.preview.grossMarginPercent)),
      type: "margin",
      colorFn: (i) => marginColor(previews[i].preview.grossMarginPercent),
    },
    {
      label: "Commission Cost",
      values: previews.map((p) => formatCurrency(p.preview.commissionCost)),
    },
    {
      label: "Breakage Profit",
      values: previews.map((p) => formatCurrency(p.preview.breakageProfit)),
    },
    {
      label: "Net Margin $",
      values: previews.map((p) => formatCurrency(p.preview.netMarginDollars)),
      type: "highlight",
    },
    {
      label: "Net Margin %",
      values: previews.map((p) => formatPercent(p.preview.netMarginPercent)),
      type: "margin",
      colorFn: (i) => marginColor(previews[i].preview.netMarginPercent),
    },
  ];

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="p-3 text-left text-[10px] uppercase tracking-wider text-muted-foreground font-semibold w-44">
                  Metric
                </th>
                {previews.map((p) => (
                  <th key={p.tier.id} className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-xs font-semibold">{p.tier.name}</span>
                      {p.tier.isFeatured && (
                        <Star className="h-3 w-3 text-[#FF0000] fill-[#FF0000]" />
                      )}
                    </div>
                    {(p.tier as Record<string, unknown>).status !== "ACTIVE" && (
                      <Badge variant="secondary" className="text-[9px] mt-0.5">
                        {((p.tier as Record<string, unknown>).status as string) || "Draft"}
                      </Badge>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                if (row.type === "header") {
                  return (
                    <tr key={row.label} className="bg-muted/30">
                      <td
                        colSpan={previews.length + 1}
                        className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {row.label}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={row.label} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                    <td
                      className={`px-3 py-2 text-xs ${
                        row.type === "highlight" || row.type === "margin"
                          ? "font-medium"
                          : "text-muted-foreground"
                      }`}
                    >
                      {row.label}
                    </td>
                    {row.values.map((val, i) => (
                      <td
                        key={i}
                        className={`px-3 py-2 text-right text-xs tabular-nums ${
                          row.type === "highlight"
                            ? "font-bold"
                            : row.type === "margin" && row.colorFn
                              ? `font-bold ${row.colorFn(i)}`
                              : ""
                        }`}
                      >
                        {val}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
