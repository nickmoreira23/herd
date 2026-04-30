"use client";

import { useState, useMemo } from "react";
import type { PartnerBrand, PartnerTierAssignment, SubscriptionTier } from "@/types";
import { Input } from "@/components/ui/input";
import { toNumber } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { formatNumberAsMoney } from "@/lib/money/format";

type PartnerWithAssignments = PartnerBrand & {
  tierAssignments: (PartnerTierAssignment & { tier: SubscriptionTier })[];
};

interface KickbackEstimatorProps {
  partners: PartnerWithAssignments[];
  locale: Locale;
}

export function KickbackEstimator({ partners, locale }: KickbackEstimatorProps) {
  const t = useT();
  const activePartners = partners.filter(
    (p) => p.isActive && p.kickbackType !== "NONE"
  );

  const [referrals, setReferrals] = useState<Record<string, number>>(() => {
    const r: Record<string, number> = {};
    activePartners.forEach((p) => {
      r[p.id] = 10;
    });
    return r;
  });

  const results = useMemo(() => {
    const partnerResults = activePartners.map((partner) => {
      const monthlyReferrals = referrals[partner.id] || 0;
      const kickbackValue = partner.kickbackValue
        ? toNumber(partner.kickbackValue)
        : 0;

      let monthlyCost = 0;
      if (partner.kickbackType === "PERCENT_OF_SALE") {
        monthlyCost = monthlyReferrals * 50 * (kickbackValue / 100);
      } else if (partner.kickbackType === "FLAT_PER_REFERRAL") {
        monthlyCost = monthlyReferrals * kickbackValue;
      } else if (partner.kickbackType === "FLAT_PER_MONTH") {
        monthlyCost = kickbackValue;
      }

      return {
        partnerId: partner.id,
        partnerName: partner.name,
        kickbackType: partner.kickbackType,
        kickbackValue,
        monthlyReferrals,
        monthlyCost,
        annualCost: monthlyCost * 12,
      };
    });

    const totalMonthly = partnerResults.reduce((s, r) => s + r.monthlyCost, 0);
    const totalAnnual = totalMonthly * 12;
    const totalReferrals = partnerResults.reduce(
      (s, r) => s + r.monthlyReferrals,
      0
    );

    return { partnerResults, totalMonthly, totalAnnual, totalReferrals };
  }, [activePartners, referrals]);

  if (activePartners.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        {t("partners.kickback.empty")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-6">
      {/* Inputs */}
      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="font-semibold">{t("partners.kickback.inputs_title")}</h3>
        <p className="text-xs text-muted-foreground">
          {t("partners.kickback.inputs_description")}
        </p>
        <div className="space-y-3">
          {activePartners.map((partner) => (
            <div key={partner.id} className="flex items-center gap-3">
              <span className="text-sm w-32 truncate">{partner.name}</span>
              <Input
                type="number"
                className="w-24"
                value={referrals[partner.id] || 0}
                onChange={(e) =>
                  setReferrals((prev) => ({
                    ...prev,
                    [partner.id]: parseInt(e.target.value) || 0,
                  }))
                }
              />
              <span className="text-xs text-muted-foreground">
                {t("partners.kickback.referrals_unit")}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Results */}
      <div className="space-y-4 rounded-lg border p-4">
        <h3 className="font-semibold">
          {t("partners.kickback.results_title")}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label={t("partners.kickback.total_referrals")}
            value={String(results.totalReferrals)}
          />
          <MetricCard
            label={t("partners.kickback.monthly_cost")}
            value={formatNumberAsMoney(results.totalMonthly, locale)}
            highlight
          />
          <MetricCard
            label={t("partners.kickback.annual_cost")}
            value={formatNumberAsMoney(results.totalAnnual, locale)}
          />
          <MetricCard
            label={t("partners.kickback.avg_per_referral")}
            value={
              results.totalReferrals > 0
                ? formatNumberAsMoney(
                    results.totalMonthly / results.totalReferrals,
                    locale,
                  )
                : formatNumberAsMoney(0, locale)
            }
          />
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-2">
            {t("partners.kickback.per_partner_breakdown")}
          </p>
          <div className="space-y-1">
            {results.partnerResults.map((r) => (
              <div
                key={r.partnerId}
                className="flex justify-between text-sm border-b pb-1"
              >
                <span>
                  {r.partnerName}
                  {" "}
                  <span className="text-muted-foreground">
                    {"("}
                    {t("partners.kickback.refs_label", {
                      count: r.monthlyReferrals,
                    })}
                    {")"}
                  </span>
                </span>
                <span className="font-medium">
                  {t("partners.kickback.per_month", {
                    value: formatNumberAsMoney(r.monthlyCost, locale),
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "bg-muted/50" : ""}`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold mt-0.5">{value}</p>
    </div>
  );
}
