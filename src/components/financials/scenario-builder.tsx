"use client";

import { createContext, useContext, useState } from "react";
import { useFinancialStore } from "@/stores/financial-store";
import type { CostRubric, LeadershipCompPlan, LeadershipLevel } from "@/lib/financial-engine";
// (calculateCreditCOGS / calculateTotalCOGSPerSub no longer needed here —
// the per-sub cost calc lives entirely in the engine. The plan card no
// longer duplicates a per-tier "Est. cost" preview.)

const ReadOnlyContext = createContext(false);
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import type { DataSourceMeta, TierDisplayMeta } from "@/app/admin/financials/data";
import {
  DollarSign,
  Building2,
  Layers,
  HelpCircle,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Link2,
  Lock,
  RotateCcw,
  PieChart,
  Plus,
  Trash2,
  ShieldAlert,
  Cpu,
  Gift,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { formatNumberAsMoney } from "@/lib/money/format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package as PackageIcon } from "lucide-react";
import { formatNumber } from "@/lib/i18n/format-number";

type TFunction = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

// Cost rubrics surfaced in the Cost Attribution card (S3.5). Mirrors the 8
// rubrics the engine attributes (financial-engine `CostRubric`).
const COST_RUBRICS: { key: CostRubric; labelKey: MessageKey }[] = [
  { key: "cogs", labelKey: "financials.builder.attribution.rubric_cogs" },
  { key: "commission", labelKey: "financials.builder.attribution.rubric_commission" },
  { key: "chargeback", labelKey: "financials.builder.attribution.rubric_chargeback" },
  { key: "operationalOverhead", labelKey: "financials.builder.attribution.rubric_overhead" },
  { key: "buckPlatform", labelKey: "financials.builder.attribution.rubric_buck" },
  { key: "addOn", labelKey: "financials.builder.attribution.rubric_addon" },
  { key: "welcomeKit", labelKey: "financials.builder.attribution.rubric_welcomeKit" },
  { key: "leadershipCommission", labelKey: "financials.builder.attribution.rubric_leadership_commission" },
];

const LOSS_BEARER_NONE = "__none__";

export function ScenarioBuilder({
  readOnly = false,
  defaultOpen = true,
  dataSourceMeta,
  tierDisplayMeta,
  packagesCatalog,
  locale,
}: {
  readOnly?: boolean;
  defaultOpen?: boolean;
  dataSourceMeta?: DataSourceMeta;
  tierDisplayMeta?: TierDisplayMeta[];
  packagesCatalog?: import("@/app/admin/financials/data").PackageCatalogEntry[];
  locale: Locale;
}) {
  const t = useT();
  const { inputs, setInputs } = useFinancialStore();

  // Cost attribution + loss-handling read/write (S3.5). Orphaned partyId (party
  // removed) reads back as "shared"/none — mirrors the engine's read-time guard.
  const partyIds = new Set(inputs.profitSplitParties.map((p) => p.id));
  const rubricTarget = (rubric: CostRubric): string => {
    const tgt = inputs.costAttribution?.[rubric];
    return tgt && tgt !== "shared" && partyIds.has(tgt.partyId) ? tgt.partyId : "shared";
  };
  const setRubricTarget = (rubric: CostRubric, value: string) =>
    setInputs({
      costAttribution: {
        ...inputs.costAttribution,
        [rubric]: value === "shared" ? "shared" : { partyId: value },
      },
    });
  const lossMode = inputs.lossHandling ?? "absorbed";
  const lossBearer =
    inputs.lossBearerPartyId && partyIds.has(inputs.lossBearerPartyId)
      ? inputs.lossBearerPartyId
      : LOSS_BEARER_NONE;
  const partyName = (id: string) =>
    inputs.profitSplitParties.find((p) => p.id === id)?.name ||
    t("financials.builder.profit_split.unnamed");

  // Leadership commission plan (S8). The levels array is BOTTOM-UP (index 0 =
  // closest to reps) — the activation threshold is the cumulative product of
  // spans up to each level, so the card renders/edits in array order to keep
  // that semantics intact (no top-down inversion).
  const leadershipPlan: LeadershipCompPlan =
    inputs.leadershipCompPlan ?? { enabled: false, base: "revenue", levels: [] };
  const setLeadershipPlan = (patch: Partial<LeadershipCompPlan>) =>
    setInputs({ leadershipCompPlan: { ...leadershipPlan, ...patch } });
  const updateLevel = (idx: number, next: LeadershipLevel) =>
    setLeadershipPlan({
      levels: leadershipPlan.levels.map((lvl, i) => (i === idx ? next : lvl)),
    });

  const billingTotal =
    inputs.billingCycleDistribution.monthly +
    inputs.billingCycleDistribution.biannual +
    inputs.billingCycleDistribution.annual;

  return (
    <ReadOnlyContext.Provider value={readOnly}>
    <TooltipProvider>
      <div className="space-y-3">
        {/* Overhead — category-based with subscriber milestones. Each
            category (Marketing, Tech, Operations, …) carries one or more
            milestones; the engine picks the highest milestone whose
            threshold ≤ active subscribers and uses that monthly cost.
            Total overhead at any month = sum across categories. */}
        <InputCard
          icon={<Building2 className="h-3.5 w-3.5" />}
          title={t("financials.builder.overhead.title")}
          description={t("financials.builder.overhead.description_fixed")}
          tooltip={t("financials.builder.overhead.tooltip")}
          defaultOpen={defaultOpen}
        >
          <OverheadCategoriesEditor
            overhead={inputs.operationalOverhead}
            onChange={(updates) =>
              setInputs({
                operationalOverhead: { ...inputs.operationalOverhead, ...updates },
              })
            }
            locale={locale}
          />
        </InputCard>

        {/* Sales Representatives */}
        <InputCard
          icon={<UserPlus className="h-3.5 w-3.5" />}
          title={t("financials.builder.sales_reps.title")}
          description={t("financials.builder.sales_reps.description")}
          tooltip={t("financials.builder.sales_reps.tooltip")}
          defaultOpen={defaultOpen}
        >
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2">
              <NumberField
                label={t("financials.builder.sales_reps.field_starting_reps")}
                tooltip={t("financials.builder.sales_reps.field_starting_reps_tooltip")}
                value={inputs.salesRepChannel.startingReps}
                step={1}
                onChange={(v) =>
                  setInputs({
                    salesRepChannel: { ...inputs.salesRepChannel, startingReps: v },
                  })
                }
              />
              {/* Sales/rep + monthly growth — disabled when an override
                  is active (the schedule below replaces them entirely
                  for both projection math AND the headline summary). */}
              <NumberField
                label={t("financials.builder.sales_reps.field_sales_per_rep")}
                tooltip={t("financials.builder.sales_reps.field_sales_per_rep_tooltip")}
                value={inputs.salesRepChannel.salesPerRepPerMonth}
                step={1}
                readOnly={!!inputs.salesRepChannel.override}
                onChange={(v) =>
                  setInputs({
                    salesRepChannel: { ...inputs.salesRepChannel, salesPerRepPerMonth: v },
                  })
                }
              />
              <NumberField
                label={t("financials.builder.sales_reps.field_growth_rate")}
                tooltip={t("financials.builder.sales_reps.field_growth_rate_tooltip")}
                value={inputs.salesRepChannel.monthlyGrowthRate}
                step={1}
                max={100}
                readOnly={!!inputs.salesRepChannel.override}
                onChange={(v) =>
                  setInputs({
                    salesRepChannel: { ...inputs.salesRepChannel, monthlyGrowthRate: v },
                  })
                }
              />
            </div>
            {/* The legacy "Mo 1 / Mo 12" example was removed — the
                Override editor below already previews the rep count at
                the end of each period, which is more useful and
                matches whichever frequency the user has chosen. */}
            {/* Override — when active, replaces the two scalars above
                with a per-period schedule. Frequency picks the period
                length (quarterly = 3 mo · biannual = 6 mo · annual =
                12 mo); the engine compounds reps iteratively so the
                ramp can step at every period boundary. */}
            <SalesRepOverride
              channel={inputs.salesRepChannel}
              onChange={(updates) =>
                setInputs({
                  salesRepChannel: { ...inputs.salesRepChannel, ...updates },
                })
              }
              locale={locale}
            />
          </div>
        </InputCard>

        {/* Commission Structure has moved to PER-PLAN. Each tier card
            below carries its own commission editor (upfront, residual,
            accelerator, payout delay). The scenario-level fallback
            (`inputs.commissionStructure`) remains as a default seed for
            new tiers but is no longer surfaced here. */}

        {/* Plans */}
        {inputs.tiers.length > 0 && (
          <InputCard
            icon={<Layers className="h-3.5 w-3.5" />}
            title={t("financials.builder.plans.title")}
            description={t("financials.builder.plans.description")}
            tooltip={t("financials.builder.plans.tooltip")}
            defaultOpen={false}
            linkedBadge={
              dataSourceMeta?.linked.tierPricing ? (
                <LinkedBadge
                  label={t("financials.builder.linked_badge.plans_linked", {
                    count: dataSourceMeta.sources.tierCount ?? 0,
                  })}
                />
              ) : undefined
            }
          >
            <div className="space-y-3">
              {/* Global Defaults */}
              <div className="rounded-md bg-muted/30 px-2.5 py-2.5 space-y-2">
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  {t("financials.builder.plans.global_defaults")}
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <NumberField
                    label={t("financials.builder.plans.field_monthly_pct")}
                    tooltip={t("financials.builder.plans.field_monthly_pct_tooltip")}
                    value={inputs.billingCycleDistribution.monthly}
                    step={5}
                    max={100}
                    onChange={(v) =>
                      setInputs({
                        billingCycleDistribution: { ...inputs.billingCycleDistribution, monthly: v },
                      })
                    }
                  />
                  <NumberField
                    label={t("financials.builder.plans.field_biannual_pct")}
                    tooltip={t("financials.builder.plans.field_biannual_pct_tooltip")}
                    value={inputs.billingCycleDistribution.biannual}
                    step={5}
                    max={100}
                    onChange={(v) =>
                      setInputs({
                        billingCycleDistribution: { ...inputs.billingCycleDistribution, biannual: v },
                      })
                    }
                  />
                  <NumberField
                    label={t("financials.builder.plans.field_annual_pct")}
                    tooltip={t("financials.builder.plans.field_annual_pct_tooltip")}
                    value={inputs.billingCycleDistribution.annual}
                    step={5}
                    max={100}
                    onChange={(v) =>
                      setInputs({
                        billingCycleDistribution: { ...inputs.billingCycleDistribution, annual: v },
                      })
                    }
                  />
                </div>
                {billingTotal !== 100 && (
                  <p className="text-[10px] text-red-500">
                    {t("financials.builder.plans.must_total_100", {
                      current: formatNumber(billingTotal / 100, locale, "percent"),
                    })}
                  </p>
                )}
                {/* Credit Redemption % moved to per-plan configuration —
                    each plan declares its own redemption rate, no global
                    default needed at the scenario level. */}
              </div>
              {/* Reference Package selector — anchors COGS/sub for every
                  tier to the real per-tier products in a chosen package
                  (vs. the apparelBudget heuristic). Drives every margin
                  calculation downstream. */}
              {packagesCatalog && packagesCatalog.length > 0 && (
                <ReferencePackageSelector
                  packagesCatalog={packagesCatalog}
                  inputs={inputs}
                  setInputs={setInputs}
                  readOnly={readOnly}
                  locale={locale}
                />
              )}
              {/* Per-tier cards */}
              {inputs.tiers.map((tier, idx) => {
                const meta = tierDisplayMeta?.find((m) => m.tierId === tier.tierId);
                const hasBillingOverride = !!tier.billingDistribution;
                const hasRedemptionOverride = tier.creditRedemptionRate != null;
                const billingOverrideTotal = hasBillingOverride
                  ? (tier.billingDistribution!.monthly + tier.billingDistribution!.biannual + tier.billingDistribution!.annual)
                  : 100;
                // No "estimated cost" calc here — the per-sub cost is fully
                // owned by the package's per-tier COGS card above (and the
                // engine's projection). Showing a separate "Est. cost"
                // here was misleading because it added the global
                // fulfillment heuristic on top of the package COGS,
                // disagreeing with both the package detail card and the
                // projection's actual blended cost.
                return (
                  <div key={tier.tierId} className="rounded-lg border bg-background p-2.5 space-y-2.5">
                    {/* Tier header */}
                    <div className="flex items-center gap-1.5">
                      {meta && (
                        <span
                          className="h-2 w-2 rounded-full shrink-0"
                          style={{ backgroundColor: meta.colorAccent }}
                        />
                      )}
                      <p className="text-xs font-semibold">{tier.tierId}</p>
                    </div>
                    {/* Plan Structure — read-only.
                        Cost composition is sourced from the PLAN
                        (shipping + handling + processing) and the
                        selected PACKAGE (product COGS). Apparel-budget
                        and free-trial fields are intentionally NOT
                        shown — neither feeds the projection's cost
                        math anymore, so surfacing them here would
                        suggest they do. */}
                    <div className="rounded-md bg-muted/50 px-2.5 py-2 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {t("financials.builder.plans.plan_structure")}
                        </span>
                        <LinkedBadge label={t("financials.builder.linked_badge.from_plans")} />
                      </div>
                      {/* Per-billing-cycle variations — each row is an
                          expandable disclosure showing the per-sub
                          cost breakdown for that cadence. */}
                      <div className="space-y-1">
                        <PlanVariationRow
                          label="Monthly"
                          months={1}
                          ratePerMonth={tier.monthlyPrice}
                          tier={tier}
                          globalFulfillment={inputs.fulfillmentCostPerOrder}
                          globalShipping={inputs.shippingCostPerOrder}
                          locale={locale}
                        />
                        {tier.biannualPricePerMonth > 0 && (
                          <PlanVariationRow
                            label="Biannual"
                            months={6}
                            ratePerMonth={tier.biannualPricePerMonth}
                            tier={tier}
                            globalFulfillment={inputs.fulfillmentCostPerOrder}
                            globalShipping={inputs.shippingCostPerOrder}
                            locale={locale}
                          />
                        )}
                        {tier.annualPricePerMonth > 0 && (
                          <PlanVariationRow
                            label="Annual"
                            months={12}
                            ratePerMonth={tier.annualPricePerMonth}
                            tier={tier}
                            globalFulfillment={inputs.fulfillmentCostPerOrder}
                            globalShipping={inputs.shippingCostPerOrder}
                            locale={locale}
                          />
                        )}
                      </div>
                      {(tier.monthlyCredits > 0 || (meta && meta.setupFee > 0)) && (
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground pt-0.5">
                          {tier.monthlyCredits > 0 && (
                            <span>
                              {t("financials.builder.plans.credits_per_month", {
                                amount: formatNumberAsMoney(tier.monthlyCredits, locale),
                              })}
                            </span>
                          )}
                          {meta && meta.setupFee > 0 && (
                            <span>
                              {t("financials.builder.plans.setup_fee", {
                                amount: formatNumberAsMoney(meta.setupFee, locale),
                              })}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {/* Performance Assumptions — editable */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                        {t("financials.builder.plans.performance_section")}
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        <NumberField
                          label={t("financials.builder.plans.field_subscriber_mix")}
                          tooltip={t("financials.builder.plans.field_subscriber_mix_tooltip")}
                          value={tier.subscriberPercent}
                          step={5}
                          max={100}
                          onChange={(v) => {
                            const newTiers = [...inputs.tiers];
                            newTiers[idx] = { ...newTiers[idx], subscriberPercent: v };
                            setInputs({ tiers: newTiers });
                          }}
                        />
                        <NumberField
                          label={t("financials.builder.plans.field_monthly_churn")}
                          tooltip={t("financials.builder.plans.field_monthly_churn_tooltip")}
                          value={tier.churnRateMonthly}
                          step={0.5}
                          max={50}
                          onChange={(v) => {
                            const newTiers = [...inputs.tiers];
                            newTiers[idx] = { ...newTiers[idx], churnRateMonthly: v };
                            setInputs({ tiers: newTiers });
                          }}
                        />
                        <NumberField
                          label={t("financials.builder.plans.field_min_commit")}
                          tooltip={t("financials.builder.plans.field_min_commit_tooltip")}
                          value={tier.minimumCommitMonths ?? 1}
                          step={1}
                          max={24}
                          onChange={(v) => {
                            const newTiers = [...inputs.tiers];
                            newTiers[idx] = { ...newTiers[idx], minimumCommitMonths: v };
                            setInputs({ tiers: newTiers });
                          }}
                        />
                      </div>
                    </div>
                    {/* Commission Structure — per-plan (each tier can pay
                        a different upfront / residual / payout). Engine
                        resolves commission per-tier; this is the single
                        source of truth for editing it. */}
                    <TierCommission
                      tier={tier}
                      locale={locale}
                      onUpdateTier={(updates) => {
                        const newTiers = [...inputs.tiers];
                        newTiers[idx] = { ...newTiers[idx], ...updates };
                        setInputs({ tiers: newTiers });
                      }}
                    />
                    {/* Add-ons — collapsible, above Overrides */}
                    <TierAddOns
                      tier={tier}
                      onUpdateTier={(updates) => {
                        const newTiers = [...inputs.tiers];
                        newTiers[idx] = { ...newTiers[idx], ...updates };
                        setInputs({ tiers: newTiers });
                      }}
                      locale={locale}
                    />
                    {/* Advanced Overrides — collapsible */}
                    <TierAdvancedOverrides
                      t={t}
                      locale={locale}
                      tier={tier}
                      tierIdx={idx}
                      globalBilling={inputs.billingCycleDistribution}
                      globalRedemptionRate={inputs.creditRedemptionRate}
                      hasBillingOverride={hasBillingOverride}
                      hasRedemptionOverride={hasRedemptionOverride}
                      billingOverrideTotal={billingOverrideTotal}
                      onUpdateTier={(updates) => {
                        const newTiers = [...inputs.tiers];
                        newTiers[idx] = { ...newTiers[idx], ...updates };
                        setInputs({ tiers: newTiers });
                      }}
                      onResetBilling={() => {
                        const newTiers = [...inputs.tiers];
                        const { billingDistribution: _, ...rest } = newTiers[idx];
                        newTiers[idx] = rest as typeof newTiers[number];
                        setInputs({ tiers: newTiers });
                      }}
                      onResetRedemption={() => {
                        const newTiers = [...inputs.tiers];
                        const { creditRedemptionRate: _, ...rest } = newTiers[idx];
                        newTiers[idx] = rest as typeof newTiers[number];
                        setInputs({ tiers: newTiers });
                      }}
                    />
                  </div>
                );
              })}
            </div>
          </InputCard>
        )}

        {/* Welcome Kit — one-time freebie cost shipped to every new
            subscriber on signup. Adds to acquisition cost (rolls into
            CAC and the month's net margin). */}
        <InputCard
          icon={<Gift className="h-3.5 w-3.5" />}
          title="Welcome Kit"
          description="One-time freebie shipped to every new subscriber"
          tooltip="Cost of the welcome kit given free to every new subscriber at signup. Rolls into CAC and lands as an acquisition expense in the month each cohort joins."
          defaultOpen={defaultOpen}
        >
          <div className="grid grid-cols-1 gap-1.5">
            <NumberField
              label="Cost / new subscriber ($)"
              tooltip="Total cost of the welcome kit per new sub. Charged once when each new subscriber joins (paid on gross new subs, since the kit ships before any chargeback could occur)."
              value={inputs.welcomeKitCostPerSub ?? 0}
              step={1}
              max={1000}
              onChange={(v) => setInputs({ welcomeKitCostPerSub: v })}
            />
          </div>
          {(inputs.welcomeKitCostPerSub ?? 0) > 0 && (
            <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground mt-1.5">
              {t("financials.scenario_builder.welcome_kit.description", {
                cost: formatNumberAsMoney(inputs.welcomeKitCostPerSub ?? 0, locale),
              })}
            </div>
          )}
        </InputCard>

        {/* Buck — platform fees per active subscriber. Flat license + AI
            tokens, charged every month for every active sub. */}
        <InputCard
          icon={<Cpu className="h-3.5 w-3.5" />}
          title="Buck Platform"
          description="Per-subscriber monthly cost paid to the platform provider"
          tooltip="Flat license fee plus estimated AI token consumption per active subscriber per month. Applied to every active sub each month."
          defaultOpen={defaultOpen}
        >
          <div className="grid grid-cols-2 gap-1.5">
            <NumberField
              label="License $/sub/mo"
              tooltip="Flat fee paid to the Buck provider per active subscriber per month."
              value={inputs.buckPlatformFeePerSub ?? 0}
              step={0.5}
              max={500}
              onChange={(v) => setInputs({ buckPlatformFeePerSub: v })}
            />
            <NumberField
              label="Tokens $/sub/mo"
              tooltip="Estimated AI token consumption cost per active subscriber per month."
              value={inputs.buckTokenCostPerSub ?? 0}
              step={0.5}
              max={500}
              onChange={(v) => setInputs({ buckTokenCostPerSub: v })}
            />
          </div>
          {((inputs.buckPlatformFeePerSub ?? 0) + (inputs.buckTokenCostPerSub ?? 0)) > 0 && (
            <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground mt-1.5">
              {t("financials.scenario_builder.buck_platform.description", {
                cost: formatNumberAsMoney(
                  (inputs.buckPlatformFeePerSub ?? 0) + (inputs.buckTokenCostPerSub ?? 0),
                  locale,
                ),
              })}
            </div>
          )}
        </InputCard>

        {/* Chargebacks */}
        <InputCard
          icon={<ShieldAlert className="h-3.5 w-3.5" />}
          title={t("financials.builder.chargebacks.title")}
          description={t("financials.builder.chargebacks.description")}
          tooltip={t("financials.builder.chargebacks.tooltip")}
          defaultOpen={defaultOpen}
        >
          <div className="grid grid-cols-2 gap-1.5">
            <NumberField
              label={t("financials.builder.chargebacks.field_rate")}
              tooltip={t("financials.builder.chargebacks.field_rate_tooltip")}
              value={inputs.chargebackPercent ?? 0}
              step={0.5}
              max={100}
              onChange={(v) => setInputs({ chargebackPercent: v })}
            />
            <NumberField
              label={t("financials.builder.chargebacks.field_fee")}
              tooltip={t("financials.builder.chargebacks.field_fee_tooltip")}
              value={inputs.chargebackFee ?? 15}
              step={5}
              max={100}
              onChange={(v) => setInputs({ chargebackFee: v })}
            />
          </div>
          {(inputs.chargebackPercent ?? 0) > 0 && (() => {
            const grossSubs = Math.round(
              inputs.salesRepChannel.startingReps * inputs.salesRepChannel.salesPerRepPerMonth,
            );
            const cbs = Math.round(grossSubs * ((inputs.chargebackPercent ?? 0) / 100));
            return (
              <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground mt-1.5">
                {t("financials.builder.chargebacks.summary", {
                  cbs: formatNumber(cbs, locale, "integer"),
                  gross: formatNumber(grossSubs, locale, "integer"),
                  net: formatNumber(grossSubs - cbs, locale, "integer"),
                })}
              </div>
            );
          })()}
        </InputCard>

        {/* Profit Split */}
        <InputCard
          icon={<PieChart className="h-3.5 w-3.5" />}
          title={t("financials.builder.profit_split.title")}
          description={t("financials.builder.profit_split.description")}
          tooltip={t("financials.builder.profit_split.tooltip")}
          defaultOpen={defaultOpen}
        >
          <div className="space-y-2">
            {inputs.profitSplitParties.length === 0 && (
              <div className="rounded-lg bg-muted/30 px-2.5 py-2 text-[11px] text-muted-foreground">
                {t("financials.builder.profit_split.empty")}
              </div>
            )}
            {inputs.profitSplitParties.map((party, idx) => (
              <div key={party.id} className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-[11px] text-muted-foreground mb-0.5 block">
                    {t("financials.builder.profit_split.party_name_label")}
                  </Label>
                  {readOnly ? (
                    <div className="h-8 flex items-center text-sm font-medium">{party.name}</div>
                  ) : (
                    <Input
                      type="text"
                      value={party.name}
                      placeholder={t("financials.builder.profit_split.party_name_placeholder")}
                      onChange={(e) => {
                        const updated = [...inputs.profitSplitParties];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setInputs({ profitSplitParties: updated });
                      }}
                      className="h-8 text-sm"
                    />
                  )}
                </div>
                <div className="w-[80px]">
                  <NumberField
                    label={t("financials.builder.profit_split.split_percent_label")}
                    tooltip={t("financials.builder.profit_split.split_percent_tooltip")}
                    value={party.percent}
                    step={5}
                    max={100}
                    onChange={(v) => {
                      const updated = [...inputs.profitSplitParties];
                      updated[idx] = { ...updated[idx], percent: v };
                      setInputs({ profitSplitParties: updated });
                    }}
                  />
                </div>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      const updated = inputs.profitSplitParties.filter((_, i) => i !== idx);
                      setInputs({ profitSplitParties: updated });
                    }}
                    className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
            {!readOnly && (
              <button
                type="button"
                onClick={() => {
                  const newParty = {
                    id: crypto.randomUUID(),
                    name: "",
                    percent: 0,
                  };
                  setInputs({
                    profitSplitParties: [...inputs.profitSplitParties, newParty],
                  });
                }}
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50 w-full justify-center border border-dashed border-border/50"
              >
                <Plus className="h-3 w-3" />
                {t("financials.builder.profit_split.add_party")}
              </button>
            )}
            {/* Summary */}
            {inputs.profitSplitParties.length > 0 && (() => {
              const totalPercent = inputs.profitSplitParties.reduce((s, p) => s + p.percent, 0);
              const isValid = totalPercent === 100;
              return (
                <div className={cn(
                  "rounded-lg px-2.5 py-1.5 text-[11px] flex items-center gap-1.5",
                  isValid
                    ? "bg-muted/30 text-muted-foreground"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}>
                  <PieChart className="h-3 w-3 shrink-0" />
                  <span>
                    {inputs.profitSplitParties.map((p) => (
                      <span key={p.id}>
                        <strong className={isValid ? "text-foreground" : ""}>
                          {p.name || t("financials.builder.profit_split.unnamed")}
                        </strong>
                        {": "}
                        {formatNumber(p.percent / 100, locale, "percent")}
                        {" · "}
                      </span>
                    ))}
                    {t("financials.builder.profit_split.total_label")}:{" "}
                    <strong className={isValid ? "text-foreground" : ""}>
                      {formatNumber(totalPercent / 100, locale, "percent")}
                    </strong>
                    {!isValid && (
                      <span> {t("financials.builder.profit_split.must_be_100")}</span>
                    )}
                  </span>
                </div>
              );
            })()}

            {/* Loss handling (S3.5) — how channel losses split (proportional vs absorbed) */}
            <div className="pt-2 mt-1 border-t border-border/50 space-y-2">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-0.5 block">
                  {t("financials.builder.loss_handling.label")}
                </Label>
                {readOnly ? (
                  <div className="h-8 flex items-center text-sm font-medium">
                    {t(
                      lossMode === "proportional"
                        ? "financials.builder.loss_handling.proportional"
                        : "financials.builder.loss_handling.absorbed",
                    )}
                  </div>
                ) : (
                  <Select
                    value={lossMode}
                    onValueChange={(v) =>
                      setInputs({ lossHandling: v as "proportional" | "absorbed" })
                    }
                  >
                    <SelectTrigger className="h-8 w-full text-sm">
                      <SelectValue>
                        {(v) =>
                          t(
                            v === "proportional"
                              ? "financials.builder.loss_handling.proportional"
                              : "financials.builder.loss_handling.absorbed",
                          )
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="absorbed">
                        {t("financials.builder.loss_handling.absorbed")}
                      </SelectItem>
                      <SelectItem value="proportional">
                        {t("financials.builder.loss_handling.proportional")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              {lossMode === "absorbed" && (
                <div>
                  <Label className="text-[11px] text-muted-foreground mb-0.5 block">
                    {t("financials.builder.loss_handling.bearer_label")}
                  </Label>
                  {readOnly ? (
                    <div className="h-8 flex items-center text-sm font-medium">
                      {lossBearer === LOSS_BEARER_NONE
                        ? t("financials.builder.loss_handling.bearer_none")
                        : partyName(lossBearer)}
                    </div>
                  ) : (
                    <Select
                      value={lossBearer}
                      onValueChange={(v) =>
                        setInputs({
                          lossBearerPartyId:
                            v === LOSS_BEARER_NONE ? undefined : v,
                        })
                      }
                    >
                      <SelectTrigger className="h-8 w-full text-sm">
                        <SelectValue>
                          {(v) =>
                            v === LOSS_BEARER_NONE
                              ? t("financials.builder.loss_handling.bearer_none")
                              : partyName(v)
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={LOSS_BEARER_NONE}>
                          {t("financials.builder.loss_handling.bearer_none")}
                        </SelectItem>
                        {inputs.profitSplitParties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name || t("financials.builder.profit_split.unnamed")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              )}
            </div>
          </div>
        </InputCard>

        {/* Cost Attribution (S3.5) — each rubric shared vs. attributed to a party */}
        <InputCard
          icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          title={t("financials.builder.attribution.title")}
          description={t("financials.builder.attribution.description")}
          tooltip={t("financials.builder.attribution.tooltip")}
          defaultOpen={defaultOpen}
        >
          <div className="space-y-2">
            {COST_RUBRICS.map(({ key, labelKey }) => (
              <div key={key} className="flex items-center gap-2">
                <Label className="text-[11px] text-muted-foreground flex-1">
                  {t(labelKey)}
                </Label>
                <div className="w-[170px]">
                  {readOnly ? (
                    <div className="h-8 flex items-center justify-end text-sm font-medium">
                      {rubricTarget(key) === "shared"
                        ? t("financials.builder.attribution.shared")
                        : partyName(rubricTarget(key))}
                    </div>
                  ) : (
                    <Select
                      value={rubricTarget(key)}
                      onValueChange={(v) => setRubricTarget(key, v)}
                    >
                      <SelectTrigger className="h-8 w-full text-sm">
                        <SelectValue>
                          {(v) =>
                            v === "shared"
                              ? t("financials.builder.attribution.shared")
                              : partyName(v)
                          }
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="shared">
                          {t("financials.builder.attribution.shared")}
                        </SelectItem>
                        {inputs.profitSplitParties.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name || t("financials.builder.profit_split.unnamed")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            ))}
          </div>
        </InputCard>

        {/* Leadership Commission (S8) — configures the engine's
            leadershipCompPlan. The cost flows through the cascade as the
            attributable `leadershipCommission` rubric (routed shared/party in
            the Cost Attribution card above). Levels are bottom-up (base → top);
            each activates when activeReps crosses its cumulative span. */}
        <InputCard
          icon={<Layers className="h-3.5 w-3.5" />}
          title={t("financials.builder.leadership_commission.title")}
          description={t("financials.builder.leadership_commission.description")}
          tooltip={t("financials.builder.leadership_commission.tooltip")}
          defaultOpen={false}
        >
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px] text-muted-foreground mb-0.5 block">
                  {t("financials.builder.leadership_commission.enabled_label")}
                </Label>
                {readOnly ? (
                  <div className="h-8 flex items-center text-sm font-medium">
                    {t(
                      leadershipPlan.enabled
                        ? "financials.builder.leadership_commission.enabled_on"
                        : "financials.builder.leadership_commission.enabled_off",
                    )}
                  </div>
                ) : (
                  <Select
                    value={leadershipPlan.enabled ? "on" : "off"}
                    onValueChange={(v) => setLeadershipPlan({ enabled: v === "on" })}
                  >
                    <SelectTrigger className="h-8 w-full text-sm">
                      <SelectValue>
                        {(v) =>
                          t(
                            v === "on"
                              ? "financials.builder.leadership_commission.enabled_on"
                              : "financials.builder.leadership_commission.enabled_off",
                          )
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="off">
                        {t("financials.builder.leadership_commission.enabled_off")}
                      </SelectItem>
                      <SelectItem value="on">
                        {t("financials.builder.leadership_commission.enabled_on")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground mb-0.5 block">
                  {t("financials.builder.leadership_commission.base_label")}
                </Label>
                {readOnly ? (
                  <div className="h-8 flex items-center text-sm font-medium">
                    {leadershipPlan.base === "margin"
                      ? t("financials.builder.leadership_commission.base_margin")
                      : leadershipPlan.base === "repCommission"
                        ? t("financials.builder.leadership_commission.base_rep_commission")
                        : t("financials.builder.leadership_commission.base_revenue")}
                  </div>
                ) : (
                  <Select
                    value={leadershipPlan.base}
                    onValueChange={(v) =>
                      setLeadershipPlan({ base: v as LeadershipCompPlan["base"] })
                    }
                  >
                    <SelectTrigger className="h-8 w-full text-sm">
                      <SelectValue>
                        {(v) =>
                          v === "margin"
                            ? t("financials.builder.leadership_commission.base_margin")
                            : v === "repCommission"
                              ? t("financials.builder.leadership_commission.base_rep_commission")
                              : t("financials.builder.leadership_commission.base_revenue")
                        }
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="revenue">
                        {t("financials.builder.leadership_commission.base_revenue")}
                      </SelectItem>
                      <SelectItem value="margin">
                        {t("financials.builder.leadership_commission.base_margin")}
                      </SelectItem>
                      <SelectItem value="repCommission">
                        {t("financials.builder.leadership_commission.base_rep_commission")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground">
              {t("financials.builder.leadership_commission.order_hint")}
            </div>

            {/* Hierarchy pyramid: the reps base, then each level climbing up.
                Levels are indented progressively to convey the chain, and each
                shows the active-rep threshold at which it turns on. */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 rounded-md border border-border/50 bg-muted/40 px-2.5 py-2">
                <UserPlus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <div className="text-xs font-medium">
                    {t("financials.builder.leadership_commission.reps_base_label")}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {t("financials.builder.leadership_commission.reps_base_hint", {
                      n: inputs.salesRepChannel.startingReps,
                    })}
                  </div>
                </div>
              </div>

              {leadershipPlan.levels.map((lvl, idx) => {
                // Cumulative-span activation threshold = Π spans[0..idx].
                const threshold = leadershipPlan.levels
                  .slice(0, idx + 1)
                  .reduce((p, l) => p * (l.span > 0 ? l.span : 1), 1);
                // Span counts units of the level directly below (level 1 = reps).
                const prevName =
                  idx > 0
                    ? leadershipPlan.levels[idx - 1]?.name?.trim() ||
                      t("financials.builder.leadership_commission.level_span_prev_fallback", { n: idx })
                    : null;
                const spanHelp =
                  idx === 0
                    ? t("financials.builder.leadership_commission.span_help_base")
                    : t("financials.builder.leadership_commission.span_help_nested", { unit: prevName ?? "" });
                return (
                  <div
                    key={lvl.id}
                    style={{ marginLeft: `${(idx + 1) * 0.85}rem` }}
                    className="rounded-md border border-border/60 bg-card overflow-hidden"
                  >
                    {/* Header — level number on the left, delete on the right */}
                    <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-2.5 py-1.5">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                        <Layers className="h-3 w-3 text-muted-foreground" />
                        {t("financials.builder.leadership_commission.level_name_label", { n: idx + 1 })}
                      </span>
                      {!readOnly && (
                        <button
                          type="button"
                          onClick={() =>
                            setLeadershipPlan({
                              levels: leadershipPlan.levels.filter((_, i) => i !== idx),
                            })
                          }
                          className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="p-2.5 space-y-3">
                      {/* Role — one field per line, label + tooltip */}
                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <Label className="text-[11px] text-muted-foreground">
                            {t("financials.builder.leadership_commission.role_label")}
                          </Label>
                          <Tooltip>
                            <TooltipTrigger className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                              <HelpCircle className="h-3 w-3" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px] text-xs">
                              {t("financials.builder.leadership_commission.role_tooltip")}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {readOnly ? (
                          <div className="h-8 flex items-center text-sm font-medium truncate">
                            {lvl.name || t("financials.builder.leadership_commission.level_name_placeholder")}
                          </div>
                        ) : (
                          <Input
                            type="text"
                            value={lvl.name}
                            placeholder={t("financials.builder.leadership_commission.level_name_placeholder")}
                            onChange={(e) => updateLevel(idx, { ...lvl, name: e.target.value })}
                            className="h-8 text-sm"
                          />
                        )}
                      </div>

                      {/* Span — activation badge inside the field (right), per-unit help below */}
                      <div>
                        <div className="flex items-center gap-1 mb-0.5">
                          <Label className="text-[11px] text-muted-foreground">
                            {t("financials.builder.leadership_commission.level_span_label")}
                          </Label>
                          <Tooltip>
                            <TooltipTrigger className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                              <HelpCircle className="h-3 w-3" />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-[220px] text-xs">
                              {t("financials.builder.leadership_commission.level_span_tooltip")}
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        {readOnly ? (
                          <div className="h-8 flex items-center justify-between gap-2 text-sm">
                            <span className="font-medium tabular-nums">{lvl.span}</span>
                            <span className="text-[10px] font-medium text-violet-600 dark:text-violet-400 whitespace-nowrap">
                              {t("financials.builder.leadership_commission.level_activates_at", { n: Math.round(threshold) })}
                            </span>
                          </div>
                        ) : (
                          <div className="relative">
                            <Input
                              type="number"
                              step={1}
                              min={1}
                              value={lvl.span}
                              onChange={(e) => updateLevel(idx, { ...lvl, span: parseFloat(e.target.value) || 0 })}
                              className="h-8 text-sm pr-44 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-violet-600 dark:text-violet-400 whitespace-nowrap">
                              {t("financials.builder.leadership_commission.level_activates_at", { n: Math.round(threshold) })}
                            </span>
                          </div>
                        )}
                        <p className="mt-1 text-[10px] text-muted-foreground">{spanHelp}</p>
                      </div>

                      {/* Divider before qualifications */}
                      <div className="border-t border-border/40" />

                      <Label className="block text-[10px] uppercase tracking-wider text-muted-foreground">
                        {t("financials.builder.leadership_commission.qualifications_label")}
                      </Label>

                      <div className="space-y-2">
                        {/* Base — the no-qualification default, shown as the first container */}
                        <div className="rounded-md border border-border/50 bg-muted/20">
                          <div className="border-b border-border/40 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {t("financials.builder.leadership_commission.base_header")}
                          </div>
                          <div className="p-2 space-y-2">
                            <NumberField
                              label={t("financials.builder.leadership_commission.base_rate_label")}
                              tooltip={t("financials.builder.leadership_commission.base_rate_tooltip")}
                              value={lvl.baseRatePct}
                              step={0.5}
                              max={100}
                              onChange={(v) => updateLevel(idx, { ...lvl, baseRatePct: v })}
                            />
                            {/* Base Mix % is only meaningful once a qualification splits the level. */}
                            {lvl.qualifications.length > 0 && (
                              <NumberField
                                label={t("financials.builder.leadership_commission.base_mix_label")}
                                tooltip={t("financials.builder.leadership_commission.base_mix_tooltip")}
                                value={lvl.baseMixPct}
                                step={1}
                                onChange={(v) => updateLevel(idx, { ...lvl, baseMixPct: v })}
                              />
                            )}
                          </div>
                        </div>

                        {/* Each qualification — its own container: header (name + delete) then fields */}
                        {lvl.qualifications.map((q, qi) => (
                          <div key={q.id} className="rounded-md border border-border/50 bg-muted/20">
                            <div className="flex items-center gap-1.5 border-b border-border/40 px-2 py-1">
                              {readOnly ? (
                                <span className="flex-1 text-[11px] font-semibold truncate">
                                  {q.name || t("financials.builder.leadership_commission.qual_name_placeholder")}
                                </span>
                              ) : (
                                <Input
                                  type="text"
                                  value={q.name}
                                  placeholder={t("financials.builder.leadership_commission.qual_name_placeholder")}
                                  onChange={(e) =>
                                    updateLevel(idx, {
                                      ...lvl,
                                      qualifications: lvl.qualifications.map((x, j) =>
                                        j === qi ? { ...x, name: e.target.value } : x,
                                      ),
                                    })
                                  }
                                  className="h-7 flex-1 border-0 bg-transparent px-0 text-sm font-medium focus-visible:ring-0"
                                />
                              )}
                              {!readOnly && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateLevel(idx, {
                                      ...lvl,
                                      qualifications: lvl.qualifications.filter((_, j) => j !== qi),
                                    })
                                  }
                                  className="h-6 w-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors shrink-0"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                            <div className="p-2 space-y-2">
                              <NumberField
                                label={t("financials.builder.leadership_commission.qual_rate_label")}
                                tooltip={t("financials.builder.leadership_commission.qual_rate_tooltip")}
                                value={q.ratePct}
                                step={0.5}
                                max={100}
                                onChange={(v) =>
                                  updateLevel(idx, {
                                    ...lvl,
                                    qualifications: lvl.qualifications.map((x, j) =>
                                      j === qi ? { ...x, ratePct: v } : x,
                                    ),
                                  })
                                }
                              />
                              <NumberField
                                label={t("financials.builder.leadership_commission.qual_mix_label")}
                                tooltip={t("financials.builder.leadership_commission.qual_mix_tooltip")}
                                value={q.mixPct}
                                step={1}
                                onChange={(v) =>
                                  updateLevel(idx, {
                                    ...lvl,
                                    qualifications: lvl.qualifications.map((x, j) =>
                                      j === qi ? { ...x, mixPct: v } : x,
                                    ),
                                  })
                                }
                              />
                            </div>
                          </div>
                        ))}

                        {lvl.qualifications.length === 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            {t("financials.builder.leadership_commission.no_qualifications")}
                          </p>
                        )}

                        {!readOnly && (
                          <button
                            type="button"
                            onClick={() =>
                              updateLevel(idx, {
                                ...lvl,
                                qualifications: [
                                  ...lvl.qualifications,
                                  { id: crypto.randomUUID(), name: "", ratePct: 0, mixPct: 0 },
                                ],
                              })
                            }
                            className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors px-1.5 py-1.5 rounded-md hover:bg-muted/50 w-full justify-center border border-dashed border-border/40"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            {t("financials.builder.leadership_commission.add_qualification")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {!readOnly && (
              <button
                type="button"
                onClick={() =>
                  setLeadershipPlan({
                    levels: [
                      ...leadershipPlan.levels,
                      { id: crypto.randomUUID(), name: "", baseRatePct: 0, baseMixPct: 100, qualifications: [], span: 1 },
                    ],
                  })
                }
                className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-md hover:bg-muted/50 w-full justify-center border border-dashed border-border/50"
              >
                <Plus className="h-3 w-3" />
                {t("financials.builder.leadership_commission.add_level")}
              </button>
            )}
          </div>
        </InputCard>
      </div>
    </TooltipProvider>
    </ReadOnlyContext.Provider>
  );
}

/* ─── Sub-components ─── */

function LinkedBadge({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-semibold px-1.5 py-0.5 uppercase tracking-wider">
      <Link2 className="h-2.5 w-2.5" />
      {label}
    </span>
  );
}

/**
 * Per-tier add-ons (Path Scale and future hardware/services that introduce
 * cohort-aware unit economics). Collapsible, with mode selector (None /
 * Lease / Sale) and the corresponding fields.
 */
function TierAddOns({
  tier,
  onUpdateTier,
  locale,
}: {
  tier: import("@/lib/financial-engine").TierFinancialInput;
  onUpdateTier: (updates: Partial<import("@/lib/financial-engine").TierFinancialInput>) => void;
  locale: Locale;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const readOnly = useContext(ReadOnlyContext);
  const pathScale = tier.addOns?.pathScale;
  const hasPathScale = !!pathScale;

  const setPathScaleMode = (mode: "none" | "purchase" | "lease") => {
    if (mode === "none") {
      onUpdateTier({ addOns: undefined });
      return;
    }
    if (mode === "purchase") {
      onUpdateTier({
        addOns: {
          pathScale: {
            mode: "purchase",
            purchaseAmount:
              pathScale && pathScale.mode === "purchase"
                ? pathScale.purchaseAmount
                : 100,
          },
        },
      });
    } else {
      onUpdateTier({
        addOns: {
          pathScale: {
            mode: "lease",
            monthlyFee: pathScale && pathScale.mode === "lease" ? pathScale.monthlyFee : 12,
            leaseMonths: pathScale && pathScale.mode === "lease" ? pathScale.leaseMonths : 12,
          },
        },
      });
    }
  };

  return (
    <div className="border-t border-border/50 pt-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <ChevronRight className={cn("h-3 w-3 transition-transform duration-150", open && "rotate-90")} />
        <span className="font-medium uppercase tracking-wider">{t("financials.scenario_builder.add_ons.title")}</span>
        {hasPathScale && (
          <span className="ml-auto text-[9px] rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 px-1.5 py-0.5 font-semibold">
            {t("financials.scenario_builder.path_scale.label")}
            <span className="mx-1">·</span>
            {pathScale!.mode === "purchase" ? "Purchase" : "Lease"}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-2.5">
          <div className="rounded-md border border-border/60 p-2.5 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-semibold leading-tight">{t("financials.scenario_builder.path_scale.label")}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
                  {t("financials.scenario_builder.path_scale.description")}
                </p>
              </div>
              {!readOnly && (
                <div className="flex items-center gap-0.5 rounded-md bg-muted/40 p-0.5 shrink-0">
                  {(["none", "purchase", "lease"] as const).map((m) => {
                    const active =
                      m === "none" ? !hasPathScale : pathScale?.mode === m;
                    return (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPathScaleMode(m)}
                        className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-medium transition-colors capitalize",
                          active
                            ? "bg-foreground text-background"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        {m}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {pathScale?.mode === "purchase" && (
              <div className="grid grid-cols-1 gap-1.5">
                <NumberField
                  label="Purchase $/sub"
                  tooltip="One-time amount we pay the supplier per new subscriber to acquire the Path Scale unit at signup. Sunk cost — applies on every net new sub regardless of subsequent churn."
                  value={pathScale.purchaseAmount}
                  step={10}
                  max={5000}
                  readOnly={readOnly || undefined}
                  onChange={(v) =>
                    onUpdateTier({
                      addOns: {
                        pathScale: { mode: "purchase", purchaseAmount: v },
                      },
                    })
                  }
                />
              </div>
            )}

            {pathScale?.mode === "lease" && (
              <div className="grid grid-cols-2 gap-1.5">
                <NumberField
                  label="Monthly fee $"
                  tooltip="Lease fee Bucked Up pays per active subscriber every month during the lease window."
                  value={pathScale.monthlyFee}
                  step={1}
                  max={500}
                  readOnly={readOnly || undefined}
                  onChange={(v) =>
                    onUpdateTier({
                      addOns: {
                        pathScale: { mode: "lease", monthlyFee: v, leaseMonths: pathScale.leaseMonths },
                      },
                    })
                  }
                />
                <NumberField
                  label="Lease months"
                  tooltip="Number of months the lease runs. After this period the scale becomes Bucked Up's property — no further payments."
                  value={pathScale.leaseMonths}
                  step={1}
                  max={36}
                  readOnly={readOnly || undefined}
                  onChange={(v) =>
                    onUpdateTier({
                      addOns: {
                        pathScale: { mode: "lease", monthlyFee: pathScale.monthlyFee, leaseMonths: v },
                      },
                    })
                  }
                />
              </div>
            )}

            {pathScale?.mode === "purchase" && (
              <p className="text-[10px] text-muted-foreground">
                {t("financials.scenario_builder.path_scale.purchase_description", {
                  amount: formatNumberAsMoney(pathScale.purchaseAmount, locale),
                })}
              </p>
            )}
            {pathScale?.mode === "lease" && (
              <p className="text-[10px] text-muted-foreground">
                {t("financials.scenario_builder.path_scale.lease_description", {
                  fee: formatNumberAsMoney(pathScale.monthlyFee, locale),
                  months: pathScale.leaseMonths,
                })}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Per-tier Commission Structure. Each plan can pay a different upfront
// (flat or % of plan), residual, payout delay, and accelerator. The
// projection engine resolves commission per-tier; this component is the
// single source of truth for editing it.
function TierCommission({
  tier,
  onUpdateTier,
  locale,
}: {
  tier: import("@/lib/financial-engine").TierFinancialInput;
  onUpdateTier: (
    updates: Partial<import("@/lib/financial-engine").TierFinancialInput>,
  ) => void;
  locale: Locale;
}) {
  const t = useT();
  const readOnly = useContext(ReadOnlyContext);
  const [open, setOpen] = useState(false);
  // Defaults if a tier somehow lacks the structure (older snapshots
  // missed by migration). Keeps the UI editable without crashing.
  const cs = tier.commissionStructure ?? {
    upfrontType: "flat" as const,
    flatBonusPerSale: 50,
    upfrontPercent: 15,
    residualPercent: 5,
    residualDelayMonths: 0,
    tierBonuses: [],
    percentHittingAccelerator: 20,
    acceleratorMultiplier: 1.5,
    acceleratorThreshold: 1.5,
    clawbackWindowDays: 60,
    payoutDelayMonths: 0,
  };
  const update = (
    patch: Partial<import("@/lib/financial-engine").CommissionCalcInput>,
  ) => onUpdateTier({ commissionStructure: { ...cs, ...patch } });

  const isPercent = (cs.upfrontType ?? "flat") === "percent";

  return (
    <div className="space-y-1.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 w-full text-left hover:opacity-80 transition-opacity"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-3 w-3 text-muted-foreground" />
        )}
        <DollarSign className="h-3 w-3 text-muted-foreground" />
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {t("financials.builder.commission.title")}
        </span>
        <span className="text-[10px] text-muted-foreground/70 ml-auto">
          {isPercent
            ? formatNumber((cs.upfrontPercent ?? 15) / 100, locale, "percent")
            : formatNumberAsMoney(cs.flatBonusPerSale, locale)}
          {cs.residualPercent > 0 && (
            <>
              {" + "}
              {formatNumber(cs.residualPercent / 100, locale, "percent")}
            </>
          )}
        </span>
      </button>
      {open && (
        <div className="rounded-md bg-muted/30 px-2.5 py-2 space-y-2.5">
          {/* Upfront */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("financials.builder.commission.upfront_section")}
            </span>
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => update({ upfrontType: "flat" })}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                    !isPercent
                      ? "bg-foreground text-background border-foreground font-semibold"
                      : "bg-background text-muted-foreground border-input hover:bg-muted/50",
                  )}
                >
                  {t("financials.builder.commission.type_flat")}
                </button>
                <button
                  type="button"
                  onClick={() => update({ upfrontType: "percent" })}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                    isPercent
                      ? "bg-foreground text-background border-foreground font-semibold"
                      : "bg-background text-muted-foreground border-input hover:bg-muted/50",
                  )}
                >
                  {t("financials.builder.commission.type_percent")}
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              {!isPercent ? (
                <NumberField
                  label={t("financials.builder.commission.field_bonus_per_sale")}
                  tooltip={t("financials.builder.commission.field_bonus_per_sale_tooltip")}
                  value={cs.flatBonusPerSale}
                  step={5}
                  onChange={(v) => update({ flatBonusPerSale: v })}
                />
              ) : (
                <NumberField
                  label={t("financials.builder.commission.field_percent_of_plan")}
                  tooltip={t("financials.builder.commission.field_percent_of_plan_tooltip")}
                  value={cs.upfrontPercent ?? 15}
                  step={5}
                  max={500}
                  onChange={(v) => update({ upfrontPercent: v })}
                />
              )}
              <NumberField
                label={t("financials.builder.commission.field_payout_delay")}
                tooltip={t("financials.builder.commission.field_payout_delay_tooltip")}
                value={cs.payoutDelayMonths ?? 0}
                step={1}
                max={12}
                onChange={(v) => update({ payoutDelayMonths: v })}
              />
            </div>
          </div>
          {/* Residual */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("financials.builder.commission.residual_section")}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <NumberField
                label={t("financials.builder.commission.field_residual_percent")}
                tooltip={t("financials.builder.commission.field_residual_percent_tooltip")}
                value={cs.residualPercent}
                step={0.5}
                max={100}
                onChange={(v) => update({ residualPercent: v })}
              />
              <NumberField
                label={t("financials.builder.commission.field_residual_delay")}
                tooltip={t("financials.builder.commission.field_residual_delay_tooltip")}
                value={cs.residualDelayMonths ?? 0}
                step={1}
                max={12}
                onChange={(v) => update({ residualDelayMonths: v })}
              />
            </div>
          </div>
          {/* Accelerator */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t("financials.builder.commission.accelerator_section")}
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <NumberField
                label={t("financials.builder.commission.field_percent_hitting")}
                tooltip={t("financials.builder.commission.field_percent_hitting_tooltip")}
                value={cs.percentHittingAccelerator}
                step={5}
                max={100}
                onChange={(v) => update({ percentHittingAccelerator: v })}
              />
              <NumberField
                label={t("financials.builder.commission.field_multiplier")}
                tooltip={t("financials.builder.commission.field_multiplier_tooltip")}
                value={cs.acceleratorMultiplier}
                step={0.1}
                onChange={(v) => update({ acceleratorMultiplier: v })}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Suppress unused-var warning — `tierIdx` kept on the prop list for future use.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function TierAdvancedOverrides({
  t,
  locale,
  tier,
  tierIdx: _tierIdx,
  globalBilling,
  globalRedemptionRate,
  hasBillingOverride,
  hasRedemptionOverride,
  billingOverrideTotal,
  onUpdateTier,
  onResetBilling,
  onResetRedemption,
}: {
  t: TFunction;
  locale: Locale;
  tier: import("@/lib/financial-engine").TierFinancialInput;
  tierIdx: number;
  globalBilling: import("@/lib/financial-engine").BillingDistribution;
  globalRedemptionRate: number;
  hasBillingOverride: boolean;
  hasRedemptionOverride: boolean;
  billingOverrideTotal: number;
  onUpdateTier: (updates: Partial<import("@/lib/financial-engine").TierFinancialInput>) => void;
  onResetBilling: () => void;
  onResetRedemption: () => void;
}) {
  const [open, setOpen] = useState(false);
  const readOnly = useContext(ReadOnlyContext);
  const hasAnyOverride = hasBillingOverride || hasRedemptionOverride;

  return (
    <div className="border-t border-border/50 pt-1.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors w-full"
      >
        <ChevronRight className={cn("h-3 w-3 transition-transform duration-150", open && "rotate-90")} />
        <span className="font-medium uppercase tracking-wider">
          {t("financials.builder.overrides.title")}
        </span>
        {hasAnyOverride && (
          <span className="ml-auto text-[9px] rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 font-semibold">
            {[
              hasBillingOverride && t("financials.builder.overrides.tag_billing"),
              hasRedemptionOverride && t("financials.builder.overrides.tag_redemption"),
            ]
              .filter(Boolean)
              .join(", ")}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-3">
          {/* Billing Mix Override */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {hasBillingOverride
                  ? t("financials.builder.overrides.billing_mix")
                  : t("financials.builder.overrides.billing_mix_global")}
              </span>
              {hasBillingOverride && !readOnly && (
                <button
                  type="button"
                  onClick={onResetBilling}
                  className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> {t("common.actions.reset")}
                </button>
              )}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <NumberField
                label={t("financials.builder.overrides.field_mo")}
                tooltip={t("financials.builder.overrides.field_mo_tooltip")}
                value={hasBillingOverride ? tier.billingDistribution!.monthly : globalBilling.monthly}
                step={5}
                max={100}
                readOnly={readOnly || undefined}
                onChange={(v) => {
                  const base = tier.billingDistribution ?? { ...globalBilling };
                  onUpdateTier({ billingDistribution: { ...base, monthly: v } });
                }}
              />
              <NumberField
                label={t("financials.builder.overrides.field_qtr")}
                tooltip={t("financials.builder.overrides.field_qtr_tooltip")}
                value={hasBillingOverride ? tier.billingDistribution!.biannual : globalBilling.biannual}
                step={5}
                max={100}
                readOnly={readOnly || undefined}
                onChange={(v) => {
                  const base = tier.billingDistribution ?? { ...globalBilling };
                  onUpdateTier({ billingDistribution: { ...base, biannual: v } });
                }}
              />
              <NumberField
                label={t("financials.builder.overrides.field_ann")}
                tooltip={t("financials.builder.overrides.field_ann_tooltip")}
                value={hasBillingOverride ? tier.billingDistribution!.annual : globalBilling.annual}
                step={5}
                max={100}
                readOnly={readOnly || undefined}
                onChange={(v) => {
                  const base = tier.billingDistribution ?? { ...globalBilling };
                  onUpdateTier({ billingDistribution: { ...base, annual: v } });
                }}
              />
            </div>
            {hasBillingOverride && billingOverrideTotal !== 100 && (
              <p className="text-[10px] text-red-500">
                {t("financials.builder.plans.must_total_100", {
                  current: formatNumber(billingOverrideTotal / 100, locale, "percent"),
                })}
              </p>
            )}
          </div>

          {/* Credit Redemption Override */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                {hasRedemptionOverride
                  ? t("financials.builder.overrides.credit_redemption")
                  : t("financials.builder.overrides.credit_redemption_global")}
              </span>
              {hasRedemptionOverride && !readOnly && (
                <button
                  type="button"
                  onClick={onResetRedemption}
                  className="flex items-center gap-0.5 text-[9px] text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="h-2.5 w-2.5" /> {t("common.actions.reset")}
                </button>
              )}
            </div>
            <div className="max-w-[140px]">
              <NumberField
                label={t("financials.builder.overrides.field_redemption")}
                tooltip={t("financials.builder.overrides.field_redemption_tooltip")}
                value={hasRedemptionOverride ? Math.round(tier.creditRedemptionRate! * 100) : Math.round(globalRedemptionRate * 100)}
                step={5}
                max={100}
                readOnly={readOnly || undefined}
                onChange={(v) => {
                  onUpdateTier({ creditRedemptionRate: v / 100 });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Quarterly schedule editor for the Sales Rep channel. Renders 12 rows
 * (Q1 → Q12, covering months 1-3 through 34-36). Each row carries an
 * optional growth-rate and sales/rep override; empty cells inherit the
 * scenario-level defaults shown above the schedule.
 *
 * The editor is collapsed by default — most users start with a flat
 * ramp and only steer per-quarter once they're stress-testing year 2/3
 * realism.
 */
function SalesRepOverride({
  channel,
  onChange,
  locale,
}: {
  channel: import("@/lib/financial-engine").SalesRepChannel;
  onChange: (
    updates: Partial<import("@/lib/financial-engine").SalesRepChannel>,
  ) => void;
  locale: Locale;
}) {
  const t = useT();
  const readOnly = useContext(ReadOnlyContext);
  const override = channel.override;
  const active = !!override;

  // Period length per frequency. Drives both the row count (window /
  // periodMonths) and the engine's lookup; the two MUST agree.
  const periodMonthsByFreq: Record<
    import("@/lib/financial-engine").SalesRepOverrideFrequency,
    number
  > = { quarterly: 3, biannual: 6, annual: 12 };
  const PROJECTION_MONTHS = 36;

  // Build (or rebuild) a fully-populated periods array for a frequency.
  // Behavior depends on what we're transitioning from:
  //   • OFF → ON: seed each period with a PERIOD-rate equivalent of the
  //     scalar's per-month rate, so the projection is preserved at the
  //     moment of toggling. periodRate = (1 + monthly)^periodMonths − 1.
  //   • ON → ON (different freq): keep period values as-is — the user
  //     wants the math to change (10% biannual ≠ 10% annual once the
  //     period rate semantic is in play).
  const buildPeriods = (
    freq: import("@/lib/financial-engine").SalesRepOverrideFrequency,
    existing: import("@/lib/financial-engine").SalesRepChannel["override"],
  ) => {
    const periodMonths = periodMonthsByFreq[freq];
    const count = Math.ceil(PROJECTION_MONTHS / periodMonths);
    const existingByPeriod = new Map(
      (existing?.periods ?? []).map((p) => [p.period, p]),
    );
    // Seed-from-scalar conversion (used only when there's no prior
    // override entry). Compound the monthly scalar across the period
    // so growth math stays equivalent at toggle time.
    const monthlyScalar = channel.monthlyGrowthRate / 100;
    const seededPeriodRate =
      (Math.pow(1 + monthlyScalar, periodMonths) - 1) * 100;
    return Array.from({ length: count }, (_, i) => {
      const period = i + 1;
      const prior = existingByPeriod.get(period);
      return {
        period,
        monthlyGrowthRate:
          prior?.monthlyGrowthRate ??
          Math.round(seededPeriodRate * 100) / 100,
        salesPerRepPerMonth:
          prior?.salesPerRepPerMonth ?? channel.salesPerRepPerMonth,
      };
    });
  };

  const turnOn = (
    freq: import("@/lib/financial-engine").SalesRepOverrideFrequency,
  ) => {
    onChange({
      override: {
        frequency: freq,
        periods: buildPeriods(freq, override),
      },
    });
  };

  const turnOff = () => {
    onChange({ override: undefined });
  };

  const switchFrequency = (
    freq: import("@/lib/financial-engine").SalesRepOverrideFrequency,
  ) => {
    onChange({
      override: { frequency: freq, periods: buildPeriods(freq, override) },
    });
  };

  const updatePeriod = (
    periodIdx: number, // 1-based
    field: "monthlyGrowthRate" | "salesPerRepPerMonth",
    value: number,
  ) => {
    if (!override) return;
    const next = override.periods.map((p) =>
      p.period === periodIdx ? { ...p, [field]: value } : p,
    );
    onChange({ override: { ...override, periods: next } });
  };

  // Compute the rep count at the END of each period, mirroring the
  // engine's iterative compounding so the user sees what the schedule
  // actually projects without leaving the card. Walks month-by-month,
  // applying each period's PER-PERIOD rate compounded down to monthly
  // (matches the engine's resolveGrowth formula).
  const repsByPeriodEnd: number[] = (() => {
    if (!override) return [];
    const periodMonths = periodMonthsByFreq[override.frequency];
    const out: number[] = [];
    let reps = channel.startingReps;
    for (let m = 1; m <= PROJECTION_MONTHS; m++) {
      if (m > 1) {
        const period = Math.floor((m - 1) / periodMonths) + 1;
        const entry = override.periods.find((p) => p.period === period);
        const periodRate =
          (entry?.monthlyGrowthRate ?? channel.monthlyGrowthRate) / 100;
        const monthlyRate = Math.pow(1 + periodRate, 1 / periodMonths) - 1;
        reps = reps * (1 + monthlyRate);
      }
      // Push at the end of each period.
      if (m % periodMonths === 0) out.push(Math.round(reps));
    }
    // Handle a window that doesn't divide evenly (won't happen at 36 mo
    // / 3-6-12, but defensive).
    if (out.length < Math.ceil(PROJECTION_MONTHS / periodMonths)) {
      out.push(Math.round(reps));
    }
    return out;
  })();

  // Frequency label helpers — consistent shorthand throughout.
  const periodLabel = (
    freq: import("@/lib/financial-engine").SalesRepOverrideFrequency,
    period: number,
  ) => {
    if (freq === "annual") return `Y${period}`;
    if (freq === "biannual") return `H${period}`;
    return `Q${period}`;
  };
  const monthRange = (
    freq: import("@/lib/financial-engine").SalesRepOverrideFrequency,
    period: number,
  ) => {
    const len = periodMonthsByFreq[freq];
    const start = (period - 1) * len + 1;
    const end = Math.min(period * len, PROJECTION_MONTHS);
    return `Months ${start}–${end}`;
  };

  return (
    <div className="space-y-1.5">
      {/* Header — title row + a dedicated toggle row beneath. The
          toggle is always rendered (so the user can SEE which mode
          they're in even in read-only); buttons are simply disabled
          and not clickable when readOnly is true. */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {t("financials.scenario_builder.rep_schedule.override")}
        </span>
        <span className="text-[10px] text-muted-foreground/70">
          {!active
            ? "Using defaults above"
            : `${override.frequency} · ${override.periods.length} periods`}
        </span>
      </div>
      <div className="flex items-center gap-1 flex-wrap">
        <button
          type="button"
          onClick={turnOff}
          disabled={readOnly}
          className={cn(
            "text-[11px] px-2 py-0.5 rounded-md border transition-colors",
            !active
              ? "bg-foreground text-background border-foreground font-semibold"
              : "bg-background text-muted-foreground border-input hover:bg-muted/50",
            readOnly && "opacity-60 cursor-not-allowed",
          )}
        >
          {t("financials.scenario_builder.rep_schedule.off")}
        </button>
        {(["annual", "biannual", "quarterly"] as const).map((freq) => {
          const isOn = active && override.frequency === freq;
          return (
            <button
              key={freq}
              type="button"
              disabled={readOnly}
              onClick={() =>
                isOn ? turnOff() : active ? switchFrequency(freq) : turnOn(freq)
              }
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-md border transition-colors capitalize",
                isOn
                  ? "bg-foreground text-background border-foreground font-semibold"
                  : "bg-background text-muted-foreground border-input hover:bg-muted/50",
                readOnly && "opacity-60 cursor-not-allowed",
              )}
            >
              {freq}
            </button>
          );
        })}
      </div>
      {active && (
        <div className="rounded-md bg-muted/30 px-2.5 py-2 space-y-1">
          <div className="grid grid-cols-[60px_1fr_1fr_80px] gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
            <span>{t("financials.scenario_builder.rep_schedule.column_period")}</span>
            <span title="% growth across the whole period — the engine compounds it into a per-month rate based on the frequency.">
              {t("financials.scenario_builder.rep_schedule.column_growth")}
            </span>
            <span>{t("financials.scenario_builder.rep_schedule.column_sales_per_rep")}</span>
            <span className="text-right">{t("financials.scenario_builder.rep_schedule.column_reps_end")}</span>
          </div>
          {override.periods.map((p) => (
            <div
              key={p.period}
              className="grid grid-cols-[60px_1fr_1fr_80px] gap-1.5 items-center"
            >
              <span
                className="text-[11px] text-muted-foreground tabular-nums"
                title={monthRange(override.frequency, p.period)}
              >
                {periodLabel(override.frequency, p.period)}
              </span>
              <input
                type="number"
                step={1}
                min={0}
                max={100}
                disabled={readOnly}
                defaultValue={p.monthlyGrowthRate}
                onBlur={(e) =>
                  updatePeriod(p.period, "monthlyGrowthRate", Number(e.target.value) || 0)
                }
                className="text-[11px] tabular-nums px-1.5 py-0.5 rounded border bg-background hover:bg-muted/30 transition-colors w-full"
              />
              <input
                type="number"
                step={1}
                min={0}
                disabled={readOnly}
                defaultValue={p.salesPerRepPerMonth}
                onBlur={(e) =>
                  updatePeriod(p.period, "salesPerRepPerMonth", Number(e.target.value) || 0)
                }
                className="text-[11px] tabular-nums px-1.5 py-0.5 rounded border bg-background hover:bg-muted/30 transition-colors w-full"
              />
              <span className="text-[11px] tabular-nums text-muted-foreground text-right">
                {formatNumber(repsByPeriodEnd[p.period - 1] ?? 0, locale, "integer")}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Overhead editor — category list, each with subscriber-milestone-based
 * monthly costs. The engine picks the highest milestone whose threshold
 * is ≤ active subscribers, so a category like "Tech: $6k @ 0 subs,
 * $12k @ 1k subs" reads as "we run on $6k until we cross 1,000 active
 * subscribers, then jump to $12k."
 *
 * Each category is collapsible (we usually have 3-5 of them and don't
 * want every milestone list visible at once).
 */
function OverheadCategoriesEditor({
  overhead,
  onChange,
  locale,
}: {
  overhead: import("@/lib/financial-engine").OperationalOverhead;
  onChange: (
    updates: Partial<import("@/lib/financial-engine").OperationalOverhead>,
  ) => void;
  locale: Locale;
}) {
  const t = useT();
  const readOnly = useContext(ReadOnlyContext);
  const categories = overhead.categories ?? [];

  const updateCategories = (
    next: import("@/lib/financial-engine").OverheadCategoryInput[],
  ) => onChange({ categories: next, mode: "categories" });

  const addCategory = () => {
    // Math.random in an event handler runs only at click time, never during
    // render — React Compiler can't prove this statically, so disable the
    // purity rule for this line.
    // eslint-disable-next-line
    const id = `cat-${Math.random().toString(36).slice(2, 8)}`;
    updateCategories([
      ...categories,
      {
        id,
        name: "New category",
        milestones: [{ memberCount: 0, monthlyCost: 0 }],
      },
    ]);
  };

  const removeCategory = (id: string) => {
    updateCategories(categories.filter((c) => c.id !== id));
  };

  const updateCategory = (
    id: string,
    patch: Partial<import("@/lib/financial-engine").OverheadCategoryInput>,
  ) => {
    updateCategories(categories.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  // Total at 0 subscribers (pre-launch baseline). Helps the user sanity-
  // check the headline before scaling kicks in.
  const baselineMonthly = categories.reduce((s, c) => {
    const sorted = [...c.milestones].sort((a, b) => a.memberCount - b.memberCount);
    return s + (sorted[0]?.monthlyCost ?? 0);
  }, 0);

  return (
    <div className="space-y-2">
      {categories.length === 0 ? (
        <div className="rounded-md bg-muted/30 px-2.5 py-3 text-[11px] text-muted-foreground">
          {t("financials.scenario_builder.overhead.empty_state")}
        </div>
      ) : (
        categories.map((cat) => (
          <OverheadCategoryRow
            key={cat.id}
            category={cat}
            onUpdate={(patch) => updateCategory(cat.id, patch)}
            onRemove={() => removeCategory(cat.id)}
            readOnly={readOnly}
            locale={locale}
          />
        ))
      )}
      {!readOnly && (
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={addCategory}
            className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded-md border border-dashed text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
            {t("financials.scenario_builder.overhead.add_category")}
          </button>
          {categories.length > 0 && (
            <span className="text-[11px] text-muted-foreground">
              {t("financials.scenario_builder.overhead.pre_launch_baseline")}{" "}
              <strong className="text-foreground tabular-nums">
                {formatNumberAsMoney(baselineMonthly, locale)}
              </strong>{" "}
              {t("financials.scenario_builder.tier_summary.per_month_suffix")}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * A single overhead category — header (name + total + remove) plus a
 * collapsible list of (memberCount, monthlyCost) milestones. The lowest
 * milestone is the pre-launch budget; each next milestone replaces it
 * once active subs cross its threshold.
 */
function OverheadCategoryRow({
  category,
  onUpdate,
  onRemove,
  readOnly,
  locale,
}: {
  category: import("@/lib/financial-engine").OverheadCategoryInput;
  onUpdate: (
    patch: Partial<import("@/lib/financial-engine").OverheadCategoryInput>,
  ) => void;
  onRemove: () => void;
  readOnly: boolean;
  locale: Locale;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const sortedMilestones = [...category.milestones].sort(
    (a, b) => a.memberCount - b.memberCount,
  );
  const baseline = sortedMilestones[0]?.monthlyCost ?? 0;
  const top = sortedMilestones[sortedMilestones.length - 1]?.monthlyCost ?? 0;

  const setMilestones = (
    ms: { memberCount: number; monthlyCost: number }[],
  ) => onUpdate({ milestones: ms });

  const updateMilestone = (
    idx: number,
    patch: Partial<{ memberCount: number; monthlyCost: number }>,
  ) => {
    const next = [...category.milestones];
    next[idx] = { ...next[idx], ...patch };
    setMilestones(next);
  };

  const addMilestone = () => {
    // Default new milestone to a step above the highest current threshold.
    const lastSubs = sortedMilestones[sortedMilestones.length - 1]?.memberCount ?? 0;
    const lastCost = sortedMilestones[sortedMilestones.length - 1]?.monthlyCost ?? 0;
    setMilestones([
      ...category.milestones,
      { memberCount: lastSubs > 0 ? lastSubs * 2 : 1000, monthlyCost: lastCost },
    ]);
  };

  const removeMilestone = (idx: number) => {
    if (category.milestones.length <= 1) return; // keep at least one
    setMilestones(category.milestones.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-md border bg-background">
      <div className="flex items-center gap-1.5 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1 hover:opacity-80 transition-opacity flex-1 min-w-0"
        >
          {open ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
          )}
          <input
            type="text"
            value={category.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            disabled={readOnly}
            onClick={(e) => e.stopPropagation()}
            className="text-[12px] font-medium bg-transparent border-0 outline-none focus:bg-muted/50 px-1 py-0.5 rounded min-w-0 flex-1"
          />
        </button>
        <span className="text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
          {formatNumberAsMoney(baseline, locale)}
          {top !== baseline && (
            <>
              {" → "}
              <span className="text-foreground">{formatNumberAsMoney(top, locale)}</span>
            </>
          )}
          <span className="text-muted-foreground"> {t("financials.scenario_builder.tier_summary.per_month_suffix")}</span>
        </span>
        {!readOnly && (
          <button
            type="button"
            onClick={onRemove}
            title="Remove category"
            className="text-muted-foreground hover:text-red-500 transition-colors p-1"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
      {open && (
        <div className="border-t bg-muted/20 px-2 py-2 space-y-1.5">
          <div className="grid grid-cols-[1fr_1fr_24px] gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider px-1">
            <span>{t("financials.scenario_builder.overhead.milestones.column_at_subs")}</span>
            <span>{t("financials.scenario_builder.overhead.milestones.column_monthly_cost")}</span>
            <span />
          </div>
          {category.milestones
            .map((m, idx) => ({ m, idx }))
            // Stable ascending order by memberCount for display, but
            // mutate via the original idx so duplicates don't collide.
            .sort((a, b) => a.m.memberCount - b.m.memberCount)
            .map(({ m, idx: sourceIdx }) => (
              <div
                key={sourceIdx}
                className="grid grid-cols-[1fr_1fr_24px] gap-1.5 items-center"
              >
                <input
                  type="number"
                  step={100}
                  min={0}
                  disabled={readOnly}
                  defaultValue={m.memberCount}
                  onBlur={(e) =>
                    updateMilestone(sourceIdx, {
                      memberCount: Number(e.target.value) || 0,
                    })
                  }
                  className="text-[11px] tabular-nums px-1.5 py-0.5 rounded border bg-background hover:bg-muted/30 transition-colors w-full"
                />
                <input
                  type="number"
                  step={500}
                  min={0}
                  disabled={readOnly}
                  defaultValue={m.monthlyCost}
                  onBlur={(e) =>
                    updateMilestone(sourceIdx, {
                      monthlyCost: Number(e.target.value) || 0,
                    })
                  }
                  className="text-[11px] tabular-nums px-1.5 py-0.5 rounded border bg-background hover:bg-muted/30 transition-colors w-full"
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeMilestone(sourceIdx)}
                    disabled={category.milestones.length <= 1}
                    title={
                      category.milestones.length <= 1
                        ? "At least one milestone is required"
                        : "Remove milestone"
                    }
                    className="text-muted-foreground hover:text-red-500 transition-colors p-1 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          {!readOnly && (
            <button
              type="button"
              onClick={addMilestone}
              className="text-[11px] inline-flex items-center gap-1 px-1.5 py-0.5 rounded border border-dashed text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              {t("financials.scenario_builder.overhead.milestones.add")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function InputCard({
  icon,
  title,
  description,
  tooltip,
  error,
  defaultOpen = true,
  linkedBadge,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  tooltip: string;
  error?: string;
  defaultOpen?: boolean;
  linkedBadge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    // Card surface intentionally white (bg-card) instead of bg-muted/30 —
    // the tinted gray was reading as "secondary content" against the
    // white sub-panel background, blurring section boundaries. White
    // surfaces with the standard border give cleaner, more readable
    // separation for each assumption block.
    <div className="rounded-lg border bg-card">
      {/* Collapsible header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } }}
        className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-muted/30 transition-colors rounded-lg cursor-pointer select-none"
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-muted-foreground shrink-0">{icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider">
                {title}
              </span>
              {linkedBadge}
            </div>
            {description && (
              <span className="text-[11px] text-muted-foreground truncate block">
                {description}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Tooltip>
            <TooltipTrigger
              onClick={(e) => e.stopPropagation()}
              className="text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[240px]">
              {tooltip}
            </TooltipContent>
          </Tooltip>
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180"
            )}
          />
        </div>
      </div>

      {/* Collapsible content. With the outer card now white, we no
          longer need an inner contrast surface — just padding and a
          top divider so the body reads as a continuation of the
          header rather than a nested element. */}
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-border/40">
          {children}
          {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  step = 1,
  min = 0,
  max,
  onChange,
  tooltip,
  readOnly: readOnlyProp,
}: {
  label: string;
  value: number;
  step?: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
  tooltip?: string;
  readOnly?: boolean;
}) {
  const readOnlyCtx = useContext(ReadOnlyContext);
  const readOnly = readOnlyProp ?? readOnlyCtx;
  const [displayValue, setDisplayValue] = useState<string>(
    String(Math.round(value * 100) / 100)
  );
  const [focused, setFocused] = useState(false);

  // Sync display when value changes externally (and field isn't focused)
  const rounded = String(Math.round(value * 100) / 100);
  if (!focused && displayValue !== rounded) {
    setDisplayValue(rounded);
  }

  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <Label className="text-[11px] text-muted-foreground">
          {label}
        </Label>
        {tooltip && (
          <Tooltip>
            <TooltipTrigger className="text-muted-foreground/40 hover:text-muted-foreground transition-colors">
              <HelpCircle className="h-3 w-3" />
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-[220px] text-xs">
              {tooltip}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {readOnly ? (
        <div className="h-8 flex items-center text-sm font-medium tabular-nums">
          {displayValue}
        </div>
      ) : (
        <Input
          type="number"
          step={step}
          min={min}
          max={max}
          value={displayValue}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false);
            const v = parseFloat(displayValue);
            if (isNaN(v) || displayValue === "") {
              setDisplayValue("0");
              onChange(0);
            } else {
              const clamped = Math.round(v * 100) / 100;
              setDisplayValue(String(clamped));
              onChange(clamped);
            }
          }}
          onChange={(e) => {
            setDisplayValue(e.target.value);
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.round(v * 100) / 100);
          }}
          className="h-8 text-sm"
        />
      )}
    </div>
  );
}

/**
 * Reference Package selector — anchors COGS-per-sub to a real package from
 * the catalog. When the user picks a package, every tier's
 * `packageCOGSPerSub` is set to that package's per-tier variant total
 * (sum of qty × costOfGoods over the products attached to the variant).
 * Cleared = back to the apparelBudget heuristic. Critical: this is the
 * authoritative input for tier margin from this point forward, so the
 * onChange must atomically update BOTH `referencePackageId` AND every
 * affected tier in a single setInputs call.
 */
function ReferencePackageSelector({
  packagesCatalog,
  inputs,
  setInputs,
  readOnly,
  locale,
}: {
  packagesCatalog: import("@/app/admin/financials/data").PackageCatalogEntry[];
  inputs: import("@/lib/financial-engine").FinancialInputs;
  setInputs: (next: Partial<import("@/lib/financial-engine").FinancialInputs>) => void;
  readOnly: boolean;
  locale: Locale;
}) {
  const NONE = "__none";
  const t = useT();
  const selected = inputs.referencePackageId ?? NONE;
  const onChange = (next: string) => {
    if (next === NONE) {
      // Clear reference package — strip packageCOGSPerSub from every tier.
      const tiers = inputs.tiers.map((t) => {
        const { packageCOGSPerSub: _drop, ...rest } = t;
        void _drop;
        return rest as typeof t;
      });
      setInputs({ referencePackageId: undefined, tiers });
      return;
    }
    const pkg = packagesCatalog.find((p) => p.id === next);
    if (!pkg) return;
    const tiers = inputs.tiers.map((t) => ({
      ...t,
      // Per-tier variant COGS from the chosen package. If a particular tier
      // has no variant in this package, fall back to keeping any existing
      // value (or undefined if there was none) — that signals "missing
      // configuration" without silently zeroing out the COGS.
      packageCOGSPerSub: pkg.perTierCOGS[t.tierId] ?? t.packageCOGSPerSub,
    }));
    setInputs({ referencePackageId: next, tiers });
  };

  const activePkg = packagesCatalog.find((p) => p.id === selected);

  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-2.5 space-y-2">
      <div className="flex items-center gap-2">
        <PackageIcon className="h-3.5 w-3.5 text-muted-foreground" />
        <p className="text-[11px] font-semibold leading-tight">
          {t("financials.scenario_builder.product_pack.title")}
        </p>
      </div>
      <p className="text-[10px] text-muted-foreground leading-snug">
        {t("financials.scenario_builder.reference_package.description")}
      </p>
      <Select value={selected} onValueChange={onChange} disabled={readOnly}>
        <SelectTrigger className="h-8 text-xs border-dashed">
          {/* Render the human label, not the raw value (which is a UUID).
              Base UI's <SelectValue /> with no children renders the raw
              value as fallback text — providing explicit children solves
              the "trigger shows UUID" problem. */}
          <span className="truncate">
            {selected === NONE
              ? t("financials.scenario_builder.product_pack.none_option")
              : (activePkg?.name ?? "Select package…")}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE} className="text-xs">
            {t("financials.scenario_builder.product_pack.none_option")}
          </SelectItem>
          {packagesCatalog.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-xs">
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {activePkg && (
        <div className="space-y-1 pt-1 border-t border-border/40">
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {t("financials.scenario_builder.product_pack.per_tier_cogs_header", { pack_name: activePkg.name })}
          </p>
          <div className="space-y-1">
            {inputs.tiers.map((t) => (
              <PackageTierBreakdown
                key={t.tierId}
                tierName={t.tierId}
                total={activePkg.perTierCOGS[t.tierId]}
                products={activePkg.perTierProducts[t.tierId]}
                locale={locale}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One row inside the Reference Package's per-tier breakdown — a clickable
 * disclosure that, when expanded, shows the line-item product list (qty
 * × cost-each → subtotal) backing the tier's COGS total. Lets the CFO
 * inspect exactly which products contribute to the projection's per-sub
 * cost without leaving the panel.
 */
function PackageTierBreakdown({
  tierName,
  total,
  products,
  locale,
}: {
  tierName: string;
  total: number | undefined;
  products: import("@/app/admin/financials/data").PackageProductBreakdown[] | undefined;
  locale: Locale;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const hasProducts = products != null && products.length > 0;
  return (
    <div className="rounded bg-background/50">
      <button
        type="button"
        onClick={() => hasProducts && setOpen((v) => !v)}
        disabled={!hasProducts}
        className="w-full flex items-center justify-between gap-1.5 px-1.5 py-1 text-[10px]"
      >
        <span className="flex items-center gap-1 min-w-0">
          {hasProducts ? (
            open ? (
              <ChevronDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
            )
          ) : (
            <span className="w-2.5 shrink-0" />
          )}
          <span className="text-muted-foreground truncate">{tierName}</span>
        </span>
        <span className="font-semibold tabular-nums shrink-0">
          {total != null ? `${formatNumberAsMoney(total, locale)}/sub/mo` : "—"}
        </span>
      </button>
      {open && hasProducts && (
        <div className="border-t border-border/30 px-2 py-1.5 space-y-0.5 text-[10px]">
          {products.map((p) => (
            <div
              key={p.productId}
              className="flex items-center justify-between gap-2"
            >
              <span className="text-muted-foreground truncate">
                {p.quantity > 1 ? `${p.quantity}× ` : ""}
                {p.name}
              </span>
              <span className="tabular-nums shrink-0 text-muted-foreground">
                {p.quantity > 1 ? (
                  <>
                    {formatNumberAsMoney(p.costEach, locale)} ×{" "}
                    {p.quantity}
                    {t("financials.scenario_builder.tier_summary.equals_separator")}
                    <span className="text-foreground font-medium">
                      {formatNumberAsMoney(p.subtotal, locale)}
                    </span>
                  </>
                ) : (
                  <span className="text-foreground font-medium">
                    {formatNumberAsMoney(p.subtotal, locale)}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


/**
 * One expandable row inside a Plan card showing a single billing cadence
 * (Monthly / Biannual / Annual). Collapsed view shows the headline
 * revenue rate; expanded view shows the per-sub cost breakdown that
 * actually feeds the projection: Product COGS (from the selected
 * reference package, if any), Shipping + Handling and Payment
 * Processing (per-tier from the SubscriptionTier table). Apparel
 * budget and free trial are intentionally absent — they don't
 * participate in the projection's cost math.
 *
 * Cost components are PER MONTH:
 * - productCOGS / shipping / handling are inherently monthly (the
 *   customer still receives monthly fulfillment regardless of how
 *   they paid).
 * - Payment processing is per-TRANSACTION. We amortize: a biannual
 *   transaction = `ratePerMonth × 6` charged once every 6 months, so
 *   the monthly equivalent is `(rate × 6 × pct + flat) / 6`. That
 *   matches what the engine bakes into blended revenue.
 */
function PlanVariationRow({
  label,
  months,
  ratePerMonth,
  tier,
  globalFulfillment,
  globalShipping,
  locale,
}: {
  label: string;
  months: 1 | 6 | 12;
  ratePerMonth: number;
  tier: import("@/lib/financial-engine").TierFinancialInput;
  globalFulfillment: number;
  globalShipping: number;
  locale: Locale;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const productCOGS = tier.packageCOGSPerSub ?? tier.apparelCOGSPerMonth ?? 0;
  // Mirror the engine's fallback: prefer per-tier shipping+handling from
  // the SubscriptionTier table when present, otherwise fall back to the
  // scenario-level global values. Without this fallback, legacy snapshots
  // (saved before per-tier costs were captured) would show $0 here even
  // though the engine actually charges global fulfillment+shipping.
  const hasPerTierShippingHandling =
    tier.avgShippingCost != null && tier.avgHandlingCost != null;
  const shippingHandling = hasPerTierShippingHandling
    ? (tier.avgShippingCost ?? 0) + (tier.avgHandlingCost ?? 0)
    : globalFulfillment + globalShipping;

  // Per-transaction processing fee: rate × cadence-months × pct + flat
  // (paid once per cycle). Amortize across the cycle for the monthly view.
  const transactionRevenue = ratePerMonth * months;
  const processingPerTransaction =
    transactionRevenue * ((tier.processingFeePct ?? 0) / 100) +
    (tier.processingFeeFlat ?? 0);
  const processingPerMonth = processingPerTransaction / months;

  const totalCostPerMonth = productCOGS + shippingHandling + processingPerMonth;
  const profitPerMonth = ratePerMonth - totalCostPerMonth;
  const marginPercent =
    ratePerMonth > 0 ? (profitPerMonth / ratePerMonth) * 100 : 0;

  const totalPrepaid = ratePerMonth * months;

  return (
    <div className="rounded bg-background/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-2 py-1 text-xs"
      >
        <span className="flex items-center gap-1 min-w-0">
          {open ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
          <span className="text-foreground font-medium">{label}</span>
        </span>
        <span className="tabular-nums shrink-0 text-muted-foreground">
          <span className="text-foreground font-medium">
            {formatNumberAsMoney(ratePerMonth, locale)}
          </span>
          {t("financials.scenario_builder.tier_summary.per_month_suffix")}
          {months > 1 && (
            <>
              {" · "}
              {formatNumberAsMoney(totalPrepaid, locale)}/{months}
              {t("financials.scenario_builder.tier_summary.months_abbr")}
            </>
          )}
        </span>
      </button>
      {open && (
        <div className="border-t border-border/30 px-2 py-1.5 space-y-0.5 text-[10px]">
          <BreakdownLine
            label="Revenue"
            value={ratePerMonth}
            locale={locale}
            sign="positive"
          />
          {productCOGS > 0 && (
            <BreakdownLine
              label="Product COGS"
              value={-productCOGS}
              locale={locale}
            />
          )}
          {shippingHandling > 0 && (
            <BreakdownLine
              label="Shipping + Handling"
              value={-shippingHandling}
              locale={locale}
            />
          )}
          {processingPerMonth > 0 && (
            <BreakdownLine
              label="Payment Processing"
              value={-processingPerMonth}
              locale={locale}
            />
          )}
          <div className="flex items-center justify-between gap-2 border-t border-border/30 pt-0.5 mt-0.5">
            <span className="text-muted-foreground font-medium">{t("financials.scenario_builder.tier_summary.profit_label")}</span>
            <span
              className={cn(
                "tabular-nums font-semibold",
                profitPerMonth >= 0 ? "text-emerald-600" : "text-red-500",
              )}
            >
              {formatNumberAsMoney(profitPerMonth, locale)}
              {t("financials.scenario_builder.tier_summary.per_month_suffix")}
              <span className="text-muted-foreground font-normal ml-1.5">
                {t("financials.scenario_builder.tier_summary.margin_paren", { percent: marginPercent.toFixed(1) })}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Single label/amount row inside a PlanVariationRow expansion. Negative
 * values are tinted to read as deductions; positive (revenue) reads as
 * neutral foreground. Keeps the breakdown lines compact and consistent.
 */
function BreakdownLine({
  label,
  value,
  locale,
  sign,
}: {
  label: string;
  value: number;
  locale: Locale;
  sign?: "positive";
}) {
  const isNegative = value < 0;
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          "tabular-nums",
          isNegative ? "text-muted-foreground" : sign === "positive" ? "text-foreground" : "",
        )}
      >
        {isNegative ? "-" : ""}
        {formatNumberAsMoney(Math.abs(value), locale)}
      </span>
    </div>
  );
}
