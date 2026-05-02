"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, BarChart3, Trash2, Calendar, TrendingUp, Users, DollarSign, Target, LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getMarginColorClass, cn } from "@/lib/utils";
import { useT } from "@/lib/i18n/locale-context";
import type { Locale } from "@/lib/i18n/locales";
import { formatNumberAsMoney } from "@/lib/money/format";
import { formatNumber } from "@/lib/i18n/format-number";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";

interface SavedModel {
  id: string;
  scenarioName: string | null;
  color: string | null;
  notes: string | null;
  results: Record<string, unknown> | null;
  createdAt: string;
}

interface ModelsListProps {
  locale: Locale;
}

const DEFAULT_COLOR = "#6B7280";

type TFn = (key: MessageKey, params?: Record<string, string | number>) => string;

export function ModelsList({ locale }: ModelsListProps) {
  const t = useT();
  const router = useRouter();
  const [models, setModels] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"cards" | "table">("table");

  const fetchModels = useCallback(async () => {
    try {
      const res = await fetch("/api/financials");
      const json = await res.json();
      if (json.data) setModels(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
  }, [fetchModels]);

  // Live sync — refresh when the projections agent saves or deletes a scenario
  useEffect(() => {
    const onSaved = () => fetchModels();
    const onDeleted = () => fetchModels();
    window.addEventListener("projections-agent:scenario-saved", onSaved);
    window.addEventListener("projections-agent:scenario-deleted", onDeleted);
    return () => {
      window.removeEventListener("projections-agent:scenario-saved", onSaved);
      window.removeEventListener("projections-agent:scenario-deleted", onDeleted);
    };
  }, [fetchModels]);

  const handleDelete = useCallback(
    async (e: React.MouseEvent, id: string, name: string) => {
      e.stopPropagation();
      if (!confirm(t("financials.models.confirm_delete", { name }))) return;
      try {
        await fetch(`/api/financials/${id}`, { method: "DELETE" });
        await fetchModels();
        notifySuccess("financials.models.feedback.deleted", t);
      } catch (err) {
        notifyError(err, t);
      }
    },
    [fetchModels, t]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">{t("financials.models.loading")}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("financials.models.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("financials.models.subtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          {models.length > 0 && (
            <div className="flex items-center border rounded-md">
              <button
                type="button"
                onClick={() => setView("cards")}
                aria-label={t("financials.models.view_cards")}
                className={cn(
                  "p-1.5 rounded-l-md transition-colors",
                  view === "cards"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setView("table")}
                aria-label={t("financials.models.view_table")}
                className={cn(
                  "p-1.5 rounded-r-md transition-colors",
                  view === "table"
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Table2 className="h-4 w-4" />
              </button>
            </div>
          )}
          <Button onClick={() => router.push("/admin/operation/finances/projections/new")}>
            <Plus className="h-4 w-4 mr-2" />
            {t("financials.models.add_model")}
          </Button>
        </div>
      </div>

      {models.length === 0 ? (
        <EmptyState onAdd={() => router.push("/admin/operation/finances/projections/new")} t={t} />
      ) : view === "cards" ? (
        <div className="space-y-3">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              locale={locale}
              t={t}
              onClick={() => router.push(`/admin/operation/finances/projections/${model.id}`)}
              onDelete={(e) =>
                handleDelete(e, model.id, model.scenarioName || t("financials.models.untitled"))
              }
            />
          ))}
        </div>
      ) : (
        <ModelsTable
          models={models}
          locale={locale}
          t={t}
          onRowClick={(id) => router.push(`/admin/operation/finances/projections/${id}`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd, t }: { onAdd: () => void; t: TFn }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 py-20">
      <div className="rounded-full bg-muted p-4 mb-4">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">{t("financials.models.empty_title")}</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
        {t("financials.models.empty_description")}
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        {t("financials.models.add_model")}
      </Button>
    </div>
  );
}

/* ─── Table View ─── */

function ModelsTable({
  models,
  locale,
  t,
  onRowClick,
  onDelete,
}: {
  models: SavedModel[];
  locale: Locale;
  t: TFn;
  onRowClick: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">{t("financials.models.column.model")}</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">{t("financials.models.column.mrr")}</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">{t("financials.models.column.arr")}</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">{t("financials.models.column.net_margin")}</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">{t("financials.models.column.gross_margin")}</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">{t("financials.models.column.new_subs_per_mo")}</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">{t("financials.models.column.ltv_cac")}</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">{t("financials.models.column.breakeven")}</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">{t("financials.models.column.created")}</th>
            <th className="px-3 py-2.5 w-10"></th>
          </tr>
        </thead>
        <tbody>
          {models.map((model) => {
            const color = model.color || DEFAULT_COLOR;
            const r = model.results;
            const mrr = r?.mrr as number | undefined;
            const arr = r?.arr as number | undefined;
            const netMarginPct = r?.netMarginPercent as number | undefined;
            const grossMarginPct = r?.grossMarginPercent as number | undefined;
            const newSubsPerMonth = r?.newSubscribersPerMonth as number | undefined;
            const breakeven = r?.operationBreakevenMonth as number | undefined;
            const ltvCac = r?.ltvCac as Record<string, unknown> | undefined;
            const ltvCacRatio = ltvCac?.ltvCacRatio as number | undefined;

            return (
              <tr
                key={model.id}
                onClick={() => onRowClick(model.id)}
                className="border-b hover:bg-muted/30 cursor-pointer transition-colors group"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-medium truncate max-w-[200px]">
                      {model.scenarioName || t("financials.models.untitled")}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {mrr !== undefined ? formatNumberAsMoney(mrr, locale) : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {arr !== undefined ? formatNumberAsMoney(arr, locale) : "—"}
                </td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium", netMarginPct !== undefined ? getMarginColorClass(netMarginPct) : "")}>
                  {netMarginPct !== undefined ? formatNumber(netMarginPct / 100, locale, "percent") : "—"}
                </td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium", grossMarginPct !== undefined ? getMarginColorClass(grossMarginPct) : "")}>
                  {grossMarginPct !== undefined ? formatNumber(grossMarginPct / 100, locale, "percent") : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {newSubsPerMonth !== undefined ? formatNumber(newSubsPerMonth, locale, "integer") : "—"}
                </td>
                <td className={cn(
                  "px-3 py-2.5 text-right tabular-nums font-medium",
                  ltvCacRatio !== undefined
                    ? ltvCacRatio >= 3
                      ? "text-green-600 dark:text-green-400"
                      : ltvCacRatio >= 1
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                    : ""
                )}>
                  {ltvCacRatio !== undefined
                    ? ltvCacRatio === Infinity
                      ? "∞"
                      : t("financials.models.ratio_x", { value: ltvCacRatio.toFixed(1) })
                    : "—"}
                </td>
                <td className={cn(
                  "px-3 py-2.5 text-right tabular-nums font-medium",
                  breakeven !== undefined
                    ? breakeven === Infinity
                      ? "text-red-500"
                      : breakeven <= 6
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400"
                    : ""
                )}>
                  {breakeven !== undefined
                    ? breakeven === Infinity
                      ? t("financials.models.breakeven.never")
                      : t("financials.models.breakeven.month_short", { month: breakeven })
                    : "—"}
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
                  {new Date(model.createdAt).toLocaleDateString(locale)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => onDelete(e, model.id, model.scenarioName || t("financials.models.untitled"))}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ─── Card View ─── */

function ModelCard({
  model,
  locale,
  t,
  onClick,
  onDelete,
}: {
  model: SavedModel;
  locale: Locale;
  t: TFn;
  onClick: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const color = model.color || DEFAULT_COLOR;
  const r = model.results as Record<string, unknown> | null;

  const mrr = r?.mrr as number | undefined;
  const arr = r?.arr as number | undefined;
  const netMarginPct = r?.netMarginPercent as number | undefined;
  const grossMarginPct = r?.grossMarginPercent as number | undefined;
  void (r?.netMarginDollars); // available for future use
  const newSubsPerMonth = r?.newSubscribersPerMonth as number | undefined;
  const breakeven = r?.operationBreakevenMonth as number | undefined;
  const ltvCac = r?.ltvCac as Record<string, unknown> | undefined;
  const ltvCacRatio = ltvCac?.ltvCacRatio as number | undefined;

  return (
    <div
      onClick={onClick}
      className="group relative rounded-lg border bg-background cursor-pointer hover:shadow-md transition-all hover:border-foreground/20 overflow-hidden"
    >
      <div className="flex">
        {/* Color stripe */}
        <div className="w-1.5 shrink-0" style={{ backgroundColor: color }} />

        <div className="flex-1 p-5">
          {/* Header row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="h-3 w-3 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <h3 className="font-semibold text-base truncate">
                {model.scenarioName || t("financials.models.untitled")}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground ml-2">
                <Calendar className="h-3 w-3" />
                <span>{new Date(model.createdAt).toLocaleDateString(locale)}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={onDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Metrics row */}
          {r && (
            <div className="grid grid-cols-7 gap-4">
              <MetricCell
                icon={<TrendingUp className="h-3 w-3" />}
                label={t("financials.models.column.mrr")}
                value={mrr !== undefined ? formatNumberAsMoney(mrr, locale) : "—"}
              />
              <MetricCell
                icon={<TrendingUp className="h-3 w-3" />}
                label={t("financials.models.column.arr")}
                value={arr !== undefined ? formatNumberAsMoney(arr, locale) : "—"}
              />
              <MetricCell
                icon={<DollarSign className="h-3 w-3" />}
                label={t("financials.models.column.net_margin")}
                value={netMarginPct !== undefined ? formatNumber(netMarginPct / 100, locale, "percent") : "—"}
                valueClass={netMarginPct !== undefined ? getMarginColorClass(netMarginPct) : undefined}
              />
              <MetricCell
                icon={<DollarSign className="h-3 w-3" />}
                label={t("financials.models.column.gross_margin")}
                value={grossMarginPct !== undefined ? formatNumber(grossMarginPct / 100, locale, "percent") : "—"}
                valueClass={grossMarginPct !== undefined ? getMarginColorClass(grossMarginPct) : undefined}
              />
              <MetricCell
                icon={<Users className="h-3 w-3" />}
                label={t("financials.models.column.new_subs_per_mo")}
                value={newSubsPerMonth !== undefined ? formatNumber(newSubsPerMonth, locale, "integer") : "—"}
              />
              <MetricCell
                icon={<Target className="h-3 w-3" />}
                label={t("financials.models.column.ltv_cac")}
                value={
                  ltvCacRatio !== undefined
                    ? ltvCacRatio === Infinity
                      ? "∞"
                      : t("financials.models.ratio_x", { value: ltvCacRatio.toFixed(1) })
                    : "—"
                }
                valueClass={
                  ltvCacRatio !== undefined
                    ? ltvCacRatio >= 3
                      ? "text-green-600 dark:text-green-400"
                      : ltvCacRatio >= 1
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-red-600 dark:text-red-400"
                    : undefined
                }
              />
              <MetricCell
                icon={<BarChart3 className="h-3 w-3" />}
                label={t("financials.models.column.breakeven")}
                value={
                  breakeven !== undefined
                    ? breakeven === Infinity
                      ? t("financials.models.breakeven.never")
                      : t("financials.models.breakeven.month_long", { month: breakeven })
                    : "—"
                }
                valueClass={
                  breakeven !== undefined
                    ? breakeven === Infinity
                      ? "text-red-500"
                      : breakeven <= 6
                        ? "text-green-600 dark:text-green-400"
                        : "text-amber-600 dark:text-amber-400"
                    : undefined
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricCell({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </span>
      </div>
      <p className={`text-sm font-bold tabular-nums ${valueClass || ""}`}>{value}</p>
    </div>
  );
}
