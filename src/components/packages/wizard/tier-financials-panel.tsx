"use client";

import { useMemo } from "react";
import {
  usePackageWizardStore,
  type TierInfo,
} from "@/stores/package-wizard-store";
import { computeTierFinancials } from "@/lib/package-financials";
import { TierProfitSummary } from "@/components/packages/tier-profit-summary";

interface TierFinancialsPanelProps {
  tier: TierInfo;
}

export function TierFinancialsPanel({ tier }: TierFinancialsPanelProps) {
  const state = usePackageWizardStore((s) => s.tierProducts[tier.id]);
  const products = state?.products ?? [];

  const fin = useMemo(
    () => computeTierFinancials(products, tier),
    [products, tier]
  );

  const footnote =
    products.length === 0
      ? "Add products to see the live P&L for this tier."
      : `Assumes 100% of ${fin.totalUnits} unit${fin.totalUnits === 1 ? "" : "s"} redeemed each month. Fulfillment & processing pulled from plan averages.`;

  return (
    <aside
      data-testid="tier-financials-panel"
      className="sticky top-4 rounded-xl border border-border bg-card p-5"
    >
      <TierProfitSummary fin={fin} variant="prominent" footnote={footnote} />
    </aside>
  );
}
