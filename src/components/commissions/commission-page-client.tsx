"use client";

import { useState, useCallback } from "react";
import type { CommissionStructure, CommissionTierRate, SubscriptionTier } from "@/types";
import { CommissionEditor } from "./commission-editor";
import { CommissionSimulator } from "./commission-simulator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Power, DollarSign, Clock, Percent, BarChart3 } from "lucide-react";
import { formatPercent, formatCurrency, toNumber } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

type StructureWithRates = CommissionStructure & {
  tierRates: (CommissionTierRate & { subscriptionTier: SubscriptionTier })[];
};

interface CommissionPageClientProps {
  initialStructures: StructureWithRates[];
  tiers: SubscriptionTier[];
  locale: Locale;
}

export function CommissionPageClient({
  initialStructures,
  tiers,
  locale,
}: CommissionPageClientProps) {
  const t = useT();
  const [structures, setStructures] = useState(initialStructures);
  const [editStructure, setEditStructure] = useState<StructureWithRates | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/commissions");
    const json = await res.json();
    if (json.data) setStructures(json.data);
  }, []);

  const handleSave = useCallback(
    async (data: Record<string, unknown>, rates: { subscriptionTierId: string; flatBonusAmount: number; acceleratorThreshold?: number; acceleratorMultiplier?: number }[]) => {
      const url = editStructure
        ? `/api/commissions/${editStructure.id}`
        : "/api/commissions";
      const method = editStructure ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        notifyError("commissions.feedback.save_failed", t);
        return;
      }
      const json = await res.json();
      const structureId = editStructure?.id || json.data.id;

      if (rates.length > 0) {
        await fetch(`/api/commissions/${structureId}/rates`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rates }),
        });
      }

      await refresh();
      notifySuccess(
        editStructure
          ? "commissions.feedback.updated"
          : "commissions.feedback.created",
        t,
      );
    },
    [editStructure, refresh, t]
  );

  const handleToggleActive = useCallback(
    async (structure: StructureWithRates) => {
      await fetch(`/api/commissions/${structure.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !structure.isActive }),
      });
      await refresh();
      notifySuccess(
        structure.isActive
          ? "commissions.feedback.deactivated"
          : "commissions.feedback.activated",
        t,
      );
    },
    [refresh, t]
  );

  const handleDelete = useCallback(
    async (structure: StructureWithRates) => {
      if (!confirm(t("commissions.structures.confirm_delete", { name: structure.name }))) return;
      await fetch(`/api/commissions/${structure.id}`, { method: "DELETE" });
      await refresh();
      notifySuccess("commissions.feedback.deleted", t);
    },
    [refresh, t]
  );

  const activeStructure = structures.find((s) => s.isActive);

  return (
    <>
      <Tabs defaultValue="structures">
        <TabsList>
          <TabsTrigger value="structures">{t("commissions.tabs.structures")}</TabsTrigger>
          <TabsTrigger value="simulator">{t("commissions.tabs.simulator")}</TabsTrigger>
        </TabsList>

        <TabsContent value="structures">
          <div className="space-y-4">
            {/* Quick-start banner */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground max-w-lg">
                {t("commissions.structures.banner")}
              </p>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                {t("commissions.structures.new_button")}
              </Button>
            </div>

            {structures.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <DollarSign className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="font-medium">{t("commissions.structures.empty_title")}</p>
                  <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                    {t("commissions.structures.empty_description")}
                  </p>
                </CardContent>
              </Card>
            )}

            <div className="space-y-3">
              {structures.map((structure) => (
                <Card
                  key={structure.id}
                  className={
                    structure.isActive
                      ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/10"
                      : ""
                  }
                >
                  <CardContent className="pt-4">
                    {/* Header row */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2.5">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${structure.isActive ? "bg-green-100 dark:bg-green-900/40" : "bg-muted"}`}>
                          <DollarSign className={`h-4 w-4 ${structure.isActive ? "text-green-600" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-sm">{structure.name}</h3>
                            {structure.isActive && (
                              <Badge className="bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400 text-[10px] px-1.5 py-0">
                                {t("commissions.structures.active_badge")}
                              </Badge>
                            )}
                          </div>
                          {structure.notes && (
                            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                              {structure.notes}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-0.5">
                        <Button variant="ghost" size="icon-sm" onClick={() => setEditStructure(structure)} title={t("commissions.structures.action_edit")}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleToggleActive(structure)}
                          title={
                            structure.isActive
                              ? t("commissions.structures.action_deactivate")
                              : t("commissions.structures.action_activate")
                          }
                        >
                          <Power className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(structure)} title={t("commissions.structures.action_delete")}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
                        <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {t("commissions.structures.stat_residual")}
                          </p>
                          <p className="font-semibold text-sm">
                            {formatPercent(toNumber(structure.residualPercent), 1, locale)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {t("commissions.structures.stat_clawback")}
                          </p>
                          <p className="font-semibold text-sm">
                            {t("commissions.structures.stat_clawback_days", { days: structure.clawbackWindowDays })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2.5 rounded-lg bg-muted/50 px-3 py-2">
                        <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                        <div>
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                            {t("commissions.structures.stat_tiers")}
                          </p>
                          <p className="font-semibold text-sm">
                            {t("commissions.structures.stat_tiers_configured", { count: structure.tierRates.length })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Tier bonuses */}
                    {structure.tierRates.length > 0 && (
                      <div className="grid grid-cols-4 gap-2">
                        {structure.tierRates.map((rate) => (
                          <div
                            key={rate.id}
                            className="rounded-lg border border-dashed px-3 py-2"
                          >
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {rate.subscriptionTier.name}
                            </p>
                            <p className="font-semibold text-sm">
                              {formatCurrency(toNumber(rate.flatBonusAmount), locale)}
                            </p>
                            {rate.acceleratorMultiplier && (
                              <p className="text-[10px] text-muted-foreground">
                                {t("commissions.structures.accelerator_label", { value: toNumber(rate.acceleratorMultiplier) })}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="simulator">
          <CommissionSimulator
            structure={activeStructure || null}
            tiers={tiers}
            locale={locale}
          />
        </TabsContent>
      </Tabs>

      <CommissionEditor
        structure={editStructure}
        tiers={tiers}
        open={showCreate || !!editStructure}
        onOpenChange={(open) => {
          if (!open) {
            setShowCreate(false);
            setEditStructure(null);
          }
        }}
        onSave={handleSave}
      />
    </>
  );
}
