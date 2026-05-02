"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Power, DollarSign, Percent, BarChart3, Copy, CalendarDays } from "lucide-react";
import { toNumber } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import { formatNumberAsMoney } from "@/lib/money/format";
import { formatNumber } from "@/lib/i18n/format-number";
import { formatDate } from "@/lib/i18n/format-date";
import type { Locale } from "@/lib/i18n/locales";
import { CommissionPlanEditor } from "../editors/commission-plan-editor";
import type { SubscriptionTier } from "@/types";

interface PlanWithRelations {
  id: string;
  name: string;
  version: number;
  isActive: boolean;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  residualPercent: number;
  notes: string | null;
  planRates: {
    id: string;
    roleType: string;
    upfrontBonus: number;
    residualPercent: number;
    subscriptionTier: { id: string; name: string };
  }[];
  overrideRules: { id: string; roleType: string; overrideType: string; overrideValue: number }[];
  performanceTiers: { id: string; label: string; minSales: number; maxSales: number | null; bonusMultiplier: number; bonusFlat: number }[];
  _count: { agreements: number };
}

interface CommissionPlansTabProps {
  initialPlans: PlanWithRelations[];
  tiers: SubscriptionTier[];
  locale: Locale;
}

export function CommissionPlansTab({ initialPlans, tiers, locale }: CommissionPlansTabProps) {
  const t = useT();
  const [plans, setPlans] = useState(initialPlans);
  const [editPlan, setEditPlan] = useState<PlanWithRelations | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/commission-plans");
    const json = await res.json();
    if (json.data) setPlans(json.data);
  }, []);

  const handleToggleActive = useCallback(async (plan: PlanWithRelations) => {
    await fetch(`/api/commission-plans/${plan.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !plan.isActive }),
    });
    await refresh();
    notifySuccess(plan.isActive ? "network.promoters.feedback.plan_deactivated" : "network.promoters.feedback.plan_activated", t);
  }, [refresh, t]);

  const handleDelete = useCallback(async (plan: PlanWithRelations) => {
    if (plan._count.agreements > 0) {
      notifyError("error.network.promoters.plan.delete_with_agreements", t);
      return;
    }
    if (!confirm(t("network.promoters.plans.confirm_delete", { name: plan.name, version: plan.version }))) return;
    await fetch(`/api/commission-plans/${plan.id}`, { method: "DELETE" });
    await refresh();
    notifySuccess("network.promoters.feedback.plan_deleted", t);
  }, [refresh, t]);

  const handleDuplicate = useCallback(async (plan: PlanWithRelations) => {
    const res = await fetch(`/api/commission-plans/${plan.id}/duplicate`, { method: "POST" });
    if (!res.ok) {
      notifyError("error.network.promoters.plan.duplicate_failed", t);
      return;
    }
    await refresh();
    notifySuccess("network.promoters.feedback.plan_duplicated", t, { name: plan.name, version: plan.version + 1 });
  }, [refresh, t]);

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground max-w-lg">
            {t("network.promoters.plans.description")}
          </p>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            {t("network.promoters.plans.new_button")}
          </Button>
        </div>

        {plans.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-medium">{t("network.promoters.plans.empty_title")}</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                {t("network.promoters.plans.empty_description")}
              </p>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {plans.map((plan) => {
            const repRates = plan.planRates.filter(r => r.roleType === "REP");
            return (
              <Card key={plan.id} className={plan.isActive ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/10" : ""}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${plan.isActive ? "bg-green-100 dark:bg-green-900/40" : "bg-muted"}`}>
                        <DollarSign className={`h-4 w-4 ${plan.isActive ? "text-green-600" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm">{plan.name}</h3>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0">v{plan.version}</Badge>
                          {plan.isActive && (
                            <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] px-1.5 py-0">{t("network.promoters.plans.active_badge")}</Badge>
                          )}
                        </div>
                        {plan.notes && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{plan.notes}</p>}
                      </div>
                    </div>
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="icon-sm" onClick={() => setEditPlan(plan)} title={t("common.actions.edit")}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDuplicate(plan)} title={t("network.promoters.plans.action.duplicate")}><Copy className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleToggleActive(plan)} title={plan.isActive ? t("network.promoters.plans.action.deactivate") : t("network.promoters.plans.action.activate")}><Power className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(plan)} title={t("common.actions.delete")}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
                      <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.plans.metric.residual")}</p>
                        <p className="font-semibold text-sm">{formatNumber(toNumber(plan.residualPercent), locale, "percent")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
                      <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.plans.metric.overrides")}</p>
                        <p className="font-semibold text-sm">{t("network.promoters.plans.metric.overrides_count", { count: plan.overrideRules.length })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
                      <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.plans.metric.agreements")}</p>
                        <p className="font-semibold text-sm">{plan._count.agreements}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
                      <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                      <div>
                        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{t("network.promoters.plans.metric.effective")}</p>
                        <p className="font-semibold text-sm text-xs">
                          {plan.effectiveFrom ? formatDate(new Date(plan.effectiveFrom), locale, "short") : "—"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {repRates.length > 0 && (
                    <div className="grid grid-cols-4 gap-2">
                      {repRates.map((rate) => (
                        <div key={rate.id} className="rounded-lg border border-dashed px-3 py-2">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{rate.subscriptionTier.name}</p>
                          <p className="font-semibold text-sm">{formatNumberAsMoney(toNumber(rate.upfrontBonus), locale)}</p>
                          <p className="text-[10px] text-muted-foreground">{t("network.promoters.plans.residual_suffix", { value: formatNumber(toNumber(rate.residualPercent), locale, "percent") })}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <CommissionPlanEditor
        plan={editPlan}
        tiers={tiers}
        open={showCreate || !!editPlan}
        onOpenChange={(open) => {
          if (!open) { setShowCreate(false); setEditPlan(null); }
        }}
        onSaved={() => { refresh(); setShowCreate(false); setEditPlan(null); }}
      />
    </>
  );
}
