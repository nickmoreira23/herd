"use client";

import { createContext, useContext, useState } from "react";
import { useFinancialStore } from "@/stores/financial-store";
import { calculateCreditCOGS, calculateTotalCOGSPerSub } from "@/lib/financial-engine";

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
  Users,
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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { formatNumberAsMoney } from "@/lib/money/format";
import { formatNumber } from "@/lib/i18n/format-number";

type TFunction = (
  key: MessageKey,
  params?: Record<string, string | number>,
) => string;

export function ScenarioBuilder({
  readOnly = false,
  defaultOpen = true,
  dataSourceMeta,
  tierDisplayMeta,
  locale,
}: {
  readOnly?: boolean;
  defaultOpen?: boolean;
  dataSourceMeta?: DataSourceMeta;
  tierDisplayMeta?: TierDisplayMeta[];
  locale: Locale;
}) {
  const t = useT();
  const { inputs, setInputs } = useFinancialStore();

  const billingTotal =
    inputs.billingCycleDistribution.monthly +
    inputs.billingCycleDistribution.quarterly +
    inputs.billingCycleDistribution.annual;

  return (
    <ReadOnlyContext.Provider value={readOnly}>
    <TooltipProvider>
      <div className="space-y-3">
        {/* Overhead */}
        <InputCard
          icon={<Building2 className="h-3.5 w-3.5" />}
          title={t("financials.builder.overhead.title")}
          description={
            inputs.operationalOverhead.mode === "milestone-scaled"
              ? t("financials.builder.overhead.description_auto_scaled")
              : t("financials.builder.overhead.description_fixed")
          }
          tooltip={t("financials.builder.overhead.tooltip")}
          defaultOpen={defaultOpen}
          linkedBadge={
            dataSourceMeta?.linked.opexMilestones &&
            inputs.operationalOverhead.mode === "milestone-scaled" ? (
              <LinkedBadge label={t("financials.builder.linked_badge.expenses")} />
            ) : undefined
          }
        >
          <div className="space-y-2">
            {/* Mode toggle */}
            {!readOnly && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setInputs({
                    operationalOverhead: { ...inputs.operationalOverhead, mode: "fixed" },
                  })}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                    inputs.operationalOverhead.mode === "fixed"
                      ? "bg-foreground text-background border-foreground font-semibold"
                      : "bg-background text-muted-foreground border-input hover:bg-muted/50"
                  )}
                >
                  {t("financials.builder.overhead.mode_fixed")}
                </button>
                <button
                  type="button"
                  onClick={() => setInputs({
                    operationalOverhead: { ...inputs.operationalOverhead, mode: "milestone-scaled" },
                  })}
                  disabled={!inputs.operationalOverhead.opexData?.length}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                    inputs.operationalOverhead.mode === "milestone-scaled"
                      ? "bg-foreground text-background border-foreground font-semibold"
                      : "bg-background text-muted-foreground border-input hover:bg-muted/50",
                    !inputs.operationalOverhead.opexData?.length && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {t("financials.builder.overhead.mode_auto_scaled")}
                </button>
              </div>
            )}

            {inputs.operationalOverhead.mode === "fixed" ? (
              <NumberField
                label={t("financials.builder.overhead.field_monthly_overhead")}
                tooltip={t("financials.builder.overhead.field_monthly_overhead_tooltip")}
                value={inputs.operationalOverhead.fixedMonthly}
                step={1000}
                onChange={(v) => setInputs({
                  operationalOverhead: { ...inputs.operationalOverhead, fixedMonthly: v },
                })}
              />
            ) : (
              <div className="space-y-1.5">
                {inputs.operationalOverhead.opexData && inputs.operationalOverhead.opexData.length > 0 ? (
                  <>
                    <div className="rounded-lg bg-muted/30 px-2.5 py-2 space-y-1">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        {t("financials.builder.overhead.operations_categories")}
                      </p>
                      {inputs.operationalOverhead.opexData.map((cat) => {
                        const catTotal = cat.items.reduce((sum, item) => {
                          const lowest = item.milestones.length > 0
                            ? item.milestones.reduce((min, ms) => ms.memberCount < min.memberCount ? ms : min, item.milestones[0])
                            : null;
                          return sum + (lowest ? lowest.monthlyCost : 0);
                        }, 0);
                        return (
                          <div key={cat.id} className="flex items-center justify-between text-[11px]">
                            <span className="text-muted-foreground">{cat.name}</span>
                            <span className="font-medium tabular-nums">
                              {t("financials.builder.overhead.per_month_amount", {
                                amount: formatNumberAsMoney(catTotal, locale),
                              })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <Building2 className="h-3 w-3 shrink-0" />
                      <span>
                        {t("financials.builder.overhead.scale_note_prefix")}{" "}
                        <a href="/admin/operation" className="text-foreground underline underline-offset-2 hover:no-underline">
                          {t("financials.builder.overhead.operations_page_link")}
                        </a>
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg bg-muted/30 px-2.5 py-2 text-[11px] text-muted-foreground">
                    {t("financials.builder.overhead.no_opex_prefix")}{" "}
                    <a href="/admin/operation" className="text-foreground underline underline-offset-2 hover:no-underline">
                      {t("financials.builder.overhead.operations_page_link")}
                    </a>{" "}
                    {t("financials.builder.overhead.no_opex_suffix")}
                  </div>
                )}
              </div>
            )}
          </div>
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
              <NumberField
                label={t("financials.builder.sales_reps.field_sales_per_rep")}
                tooltip={t("financials.builder.sales_reps.field_sales_per_rep_tooltip")}
                value={inputs.salesRepChannel.salesPerRepPerMonth}
                step={1}
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
                onChange={(v) =>
                  setInputs({
                    salesRepChannel: { ...inputs.salesRepChannel, monthlyGrowthRate: v },
                  })
                }
              />
            </div>
            <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Users className="h-3 w-3 shrink-0" />
              <span>
                {t("financials.builder.sales_reps.summary_mo1", {
                  reps: formatNumber(inputs.salesRepChannel.startingReps, locale, "integer"),
                  sales: formatNumber(inputs.salesRepChannel.salesPerRepPerMonth, locale, "integer"),
                })}{" "}
                <strong className="text-foreground">
                  {t("financials.builder.sales_reps.summary_new_subs", {
                    count: formatNumber(
                      inputs.salesRepChannel.startingReps *
                        inputs.salesRepChannel.salesPerRepPerMonth,
                      locale,
                      "integer",
                    ),
                  })}
                </strong>
                {inputs.salesRepChannel.monthlyGrowthRate > 0 && (
                  <span>
                    {" · "}
                    {t("financials.builder.sales_reps.summary_mo12_prefix")}{" "}
                    <strong className="text-foreground">
                      {t("financials.builder.sales_reps.summary_mo12_value", {
                        reps: formatNumber(
                          Math.round(
                            inputs.salesRepChannel.startingReps *
                              Math.pow(1 + inputs.salesRepChannel.monthlyGrowthRate / 100, 11),
                          ),
                          locale,
                          "integer",
                        ),
                        subs: formatNumber(
                          Math.round(
                            inputs.salesRepChannel.startingReps *
                              Math.pow(1 + inputs.salesRepChannel.monthlyGrowthRate / 100, 11) *
                              inputs.salesRepChannel.salesPerRepPerMonth,
                          ),
                          locale,
                          "integer",
                        ),
                      })}
                    </strong>
                  </span>
                )}
              </span>
            </div>
          </div>
        </InputCard>

        {/* Commission Structure */}
        <InputCard
          icon={<DollarSign className="h-3.5 w-3.5" />}
          title={t("financials.builder.commission.title")}
          description={t("financials.builder.commission.description")}
          tooltip={t("financials.builder.commission.tooltip")}
          defaultOpen={defaultOpen}
        >
          <div className="space-y-3">
            {/* Upfront Commission */}
            <div className="space-y-2">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("financials.builder.commission.upfront_section")}
              </span>

              {/* Type toggle */}
              {!readOnly && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInputs({
                      commissionStructure: { ...inputs.commissionStructure, upfrontType: "flat" as const },
                    })}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                      (inputs.commissionStructure.upfrontType ?? "flat") === "flat"
                        ? "bg-foreground text-background border-foreground font-semibold"
                        : "bg-background text-muted-foreground border-input hover:bg-muted/50"
                    )}
                  >
                    {t("financials.builder.commission.type_flat")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputs({
                      commissionStructure: { ...inputs.commissionStructure, upfrontType: "percent" as const },
                    })}
                    className={cn(
                      "text-[11px] px-2.5 py-1 rounded-md border transition-colors",
                      inputs.commissionStructure.upfrontType === "percent"
                        ? "bg-foreground text-background border-foreground font-semibold"
                        : "bg-background text-muted-foreground border-input hover:bg-muted/50"
                    )}
                  >
                    {t("financials.builder.commission.type_percent")}
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {(inputs.commissionStructure.upfrontType ?? "flat") === "flat" ? (
                  <NumberField
                    label={t("financials.builder.commission.field_bonus_per_sale")}
                    tooltip={t("financials.builder.commission.field_bonus_per_sale_tooltip")}
                    value={inputs.commissionStructure.flatBonusPerSale}
                    step={5}
                    onChange={(v) =>
                      setInputs({
                        commissionStructure: { ...inputs.commissionStructure, flatBonusPerSale: v },
                      })
                    }
                  />
                ) : (
                  <NumberField
                    label={t("financials.builder.commission.field_percent_of_plan")}
                    tooltip={t("financials.builder.commission.field_percent_of_plan_tooltip")}
                    value={inputs.commissionStructure.upfrontPercent ?? 100}
                    step={5}
                    max={500}
                    onChange={(v) =>
                      setInputs({
                        commissionStructure: { ...inputs.commissionStructure, upfrontPercent: v },
                      })
                    }
                  />
                )}
                <NumberField
                  label={t("financials.builder.commission.field_payout_delay")}
                  tooltip={t("financials.builder.commission.field_payout_delay_tooltip")}
                  value={inputs.commissionStructure.payoutDelayMonths ?? 0}
                  step={1}
                  max={12}
                  onChange={(v) =>
                    setInputs({
                      commissionStructure: { ...inputs.commissionStructure, payoutDelayMonths: v },
                    })
                  }
                />
              </div>
            </div>

            {/* Residual */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("financials.builder.commission.residual_section")}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label={t("financials.builder.commission.field_residual_percent")}
                  tooltip={t("financials.builder.commission.field_residual_percent_tooltip")}
                  value={inputs.commissionStructure.residualPercent}
                  step={0.5}
                  max={100}
                  onChange={(v) =>
                    setInputs({
                      commissionStructure: { ...inputs.commissionStructure, residualPercent: v },
                    })
                  }
                />
                <NumberField
                  label={t("financials.builder.commission.field_residual_delay")}
                  tooltip={t("financials.builder.commission.field_residual_delay_tooltip")}
                  value={inputs.commissionStructure.residualDelayMonths ?? 0}
                  step={1}
                  max={12}
                  onChange={(v) =>
                    setInputs({
                      commissionStructure: { ...inputs.commissionStructure, residualDelayMonths: v },
                    })
                  }
                />
              </div>
            </div>

            {/* Accelerator */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {t("financials.builder.commission.accelerator_section")}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <NumberField
                  label={t("financials.builder.commission.field_percent_hitting")}
                  tooltip={t("financials.builder.commission.field_percent_hitting_tooltip")}
                  value={inputs.commissionStructure.percentHittingAccelerator}
                  step={5}
                  max={100}
                  onChange={(v) =>
                    setInputs({
                      commissionStructure: { ...inputs.commissionStructure, percentHittingAccelerator: v },
                    })
                  }
                />
                <NumberField
                  label={t("financials.builder.commission.field_multiplier")}
                  tooltip={t("financials.builder.commission.field_multiplier_tooltip")}
                  value={inputs.commissionStructure.acceleratorMultiplier}
                  step={0.1}
                  onChange={(v) =>
                    setInputs({
                      commissionStructure: { ...inputs.commissionStructure, acceleratorMultiplier: v },
                    })
                  }
                />
              </div>
            </div>

            {/* Summary */}
            {(() => {
              const isPercent = inputs.commissionStructure.upfrontType === "percent";
              const upfrontLabel = isPercent
                ? t("financials.builder.commission.summary_upfront_percent", {
                    percent: formatNumber(
                      (inputs.commissionStructure.upfrontPercent ?? 100) / 100,
                      locale,
                      "percent",
                    ),
                  })
                : t("financials.builder.commission.summary_upfront_flat", {
                    amount: formatNumberAsMoney(
                      inputs.commissionStructure.flatBonusPerSale,
                      locale,
                    ),
                  });
              const delay = inputs.commissionStructure.payoutDelayMonths ?? 0;
              const delayLabel =
                delay === 0
                  ? t("financials.builder.commission.summary_paid_immediately")
                  : t("financials.builder.commission.summary_paid_after", { months: delay });
              const residual = inputs.commissionStructure.residualPercent;
              const resDelay = inputs.commissionStructure.residualDelayMonths ?? 0;
              const resDelayLabel =
                resDelay === 0
                  ? ""
                  : t("financials.builder.commission.summary_residual_delay", {
                      months: resDelay,
                    });
              return (
                <div className="rounded-lg bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3 shrink-0" />
                  <span>
                    {t("financials.builder.commission.summary_upfront_label")}:{" "}
                    <strong className="text-foreground">{upfrontLabel}</strong> ({delayLabel})
                    {residual > 0 && (
                      <>
                        {" + "}
                        <strong className="text-foreground">
                          {t("financials.builder.commission.summary_residual_value", {
                            percent: formatNumber(residual / 100, locale, "percent"),
                          })}
                        </strong>{" "}
                        {t("financials.builder.commission.summary_residual_word")}
                        {resDelayLabel}
                      </>
                    )}
                  </span>
                </div>
              );
            })()}
          </div>
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
          </div>
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
                    label={t("financials.builder.plans.field_quarterly_pct")}
                    tooltip={t("financials.builder.plans.field_quarterly_pct_tooltip")}
                    value={inputs.billingCycleDistribution.quarterly}
                    step={5}
                    max={100}
                    onChange={(v) =>
                      setInputs({
                        billingCycleDistribution: { ...inputs.billingCycleDistribution, quarterly: v },
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
                <div className="grid grid-cols-1 gap-1.5 max-w-[140px]">
                  <NumberField
                    label={t("financials.builder.plans.field_credit_redemption")}
                    tooltip={t("financials.builder.plans.field_credit_redemption_tooltip")}
                    value={Math.round(inputs.creditRedemptionRate * 100)}
                    step={5}
                    max={100}
                    onChange={(v) => setInputs({ creditRedemptionRate: v / 100, breakageRate: 1 - v / 100 })}
                  />
                </div>
              </div>

              {/* Per-tier cards */}
              {inputs.tiers.map((tier, idx) => {
                const meta = tierDisplayMeta?.find((m) => m.tierId === tier.tierId);
                const hasBillingOverride = !!tier.billingDistribution;
                const hasRedemptionOverride = tier.creditRedemptionRate != null;
                const billingOverrideTotal = hasBillingOverride
                  ? (tier.billingDistribution!.monthly + tier.billingDistribution!.quarterly + tier.billingDistribution!.annual)
                  : 100;

                // Compute estimated cost per subscriber for this tier
                const tierRedemption = tier.creditRedemptionRate ?? inputs.creditRedemptionRate;
                const creditCOGS = calculateCreditCOGS(
                  tier.monthlyCredits,
                  tierRedemption,
                  inputs.avgCOGSToMemberPriceRatio
                );
                const estCostPerSub = calculateTotalCOGSPerSub(
                  creditCOGS,
                  tier.apparelCOGSPerMonth,
                  inputs.fulfillmentCostPerOrder,
                  inputs.shippingCostPerOrder
                );

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

                    {/* Plan Structure — read-only */}
                    <div className="rounded-md bg-muted/50 px-2.5 py-2 space-y-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Lock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                          {t("financials.builder.plans.plan_structure")}
                        </span>
                        <LinkedBadge label={t("financials.builder.linked_badge.from_plans")} />
                      </div>
                      <div className="text-xs text-muted-foreground leading-relaxed">
                        <span className="text-foreground font-medium">
                          {t("financials.builder.plans.price_per_month", {
                            amount: formatNumberAsMoney(tier.monthlyPrice, locale),
                          })}
                        </span>
                        {meta && meta.quarterlyPriceTotal > 0 && (
                          <>
                            {" · "}
                            {t("financials.builder.plans.price_per_quarter", {
                              amount: formatNumberAsMoney(meta.quarterlyPriceTotal, locale),
                            })}{" "}
                            <span className="text-muted-foreground">
                              ({t("financials.builder.plans.price_per_month", {
                                amount: formatNumberAsMoney(tier.quarterlyPricePerMonth, locale),
                              })})
                            </span>
                          </>
                        )}
                        {meta && meta.annualPriceTotal > 0 && (
                          <>
                            {" · "}
                            {t("financials.builder.plans.price_per_year", {
                              amount: formatNumberAsMoney(meta.annualPriceTotal, locale),
                            })}{" "}
                            <span className="text-muted-foreground">
                              ({t("financials.builder.plans.price_per_month", {
                                amount: formatNumberAsMoney(tier.annualPricePerMonth, locale),
                              })})
                            </span>
                          </>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                        {tier.monthlyCredits > 0 && (
                          <span>
                            {t("financials.builder.plans.credits_per_month", {
                              amount: formatNumberAsMoney(tier.monthlyCredits, locale),
                            })}
                          </span>
                        )}
                        {tier.apparelCOGSPerMonth > 0 && (
                          <span>
                            {t("financials.builder.plans.apparel_per_month", {
                              amount: formatNumberAsMoney(tier.apparelCOGSPerMonth, locale),
                            })}
                          </span>
                        )}
                        {tier.monthlyCredits === 0 && tier.apparelCOGSPerMonth === 0 && (
                          <span>{t("financials.builder.plans.no_credits_apparel")}</span>
                        )}
                        {meta && meta.trialDays > 0 && (
                          <span>
                            {t("financials.builder.plans.trial_days", { days: meta.trialDays })}
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
                      {/* Estimated cost per subscriber */}
                      <div className="pt-1 border-t border-border/30 mt-1.5">
                        <span className="text-xs">
                          {t("financials.builder.plans.est_cost_label")}:{" "}
                          <span className="text-foreground font-medium">
                            {t("financials.builder.plans.est_cost_value", {
                              amount: formatNumberAsMoney(
                                Math.round(estCostPerSub * 100) / 100,
                                locale,
                              ),
                            })}
                          </span>
                        </span>
                      </div>
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
                value={hasBillingOverride ? tier.billingDistribution!.quarterly : globalBilling.quarterly}
                step={5}
                max={100}
                readOnly={readOnly || undefined}
                onChange={(v) => {
                  const base = tier.billingDistribution ?? { ...globalBilling };
                  onUpdateTier({ billingDistribution: { ...base, quarterly: v } });
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
    <div className="rounded-lg border bg-muted/30">
      {/* Collapsible header */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(!open)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(!open); } }}
        className="flex items-center justify-between w-full px-3 py-2.5 text-left hover:bg-muted/50 transition-colors rounded-lg cursor-pointer select-none"
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

      {/* Collapsible content */}
      {open && (
        <div className="px-3 pb-3">
          <div className="rounded-md bg-background p-3">
            {children}
            {error && <p className="text-[11px] text-red-500 mt-1.5">{error}</p>}
          </div>
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
