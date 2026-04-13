"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, BarChart3, Trash2, Calendar, TrendingUp, Users, DollarSign, Target, LayoutGrid, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, getMarginColorClass, cn } from "@/lib/utils";
import { toast } from "sonner";

interface SavedModel {
  id: string;
  scenarioName: string | null;
  color: string | null;
  notes: string | null;
  results: Record<string, unknown> | null;
  createdAt: string;
}

const DEFAULT_COLOR = "#6B7280";

export function ModelsList() {
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
      if (!confirm(`Delete model "${name}"?`)) return;
      await fetch(`/api/financials/${id}`, { method: "DELETE" });
      await fetchModels();
      toast.success("Model deleted");
    },
    [fetchModels]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground text-sm">Loading models...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build and compare financial projection models for your operation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          {models.length > 0 && (
            <div className="flex items-center border rounded-md">
              <button
                type="button"
                onClick={() => setView("cards")}
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
            Add Model
          </Button>
        </div>
      </div>

      {models.length === 0 ? (
        <EmptyState onAdd={() => router.push("/admin/operation/finances/projections/new")} />
      ) : view === "cards" ? (
        <div className="space-y-3">
          {models.map((model) => (
            <ModelCard
              key={model.id}
              model={model}
              onClick={() => router.push(`/admin/operation/finances/projections/${model.id}`)}
              onDelete={(e) =>
                handleDelete(e, model.id, model.scenarioName || "Untitled")
              }
            />
          ))}
        </div>
      ) : (
        <ModelsTable
          models={models}
          onRowClick={(id) => router.push(`/admin/operation/finances/projections/${id}`)}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20 py-20">
      <div className="rounded-full bg-muted p-4 mb-4">
        <BarChart3 className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">No models yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-sm text-center">
        Create your first financial model to simulate P&L scenarios, compare
        margins, and plan your operation.
      </p>
      <Button onClick={onAdd}>
        <Plus className="h-4 w-4 mr-2" />
        Add Model
      </Button>
    </div>
  );
}

/* ─── Table View ─── */

function ModelsTable({
  models,
  onRowClick,
  onDelete,
}: {
  models: SavedModel[];
  onRowClick: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string, name: string) => void;
}) {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-4 py-2.5 text-left font-medium text-muted-foreground text-xs">Model</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">MRR</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">ARR</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">Net Margin</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">Gross Margin</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">New Subs/Mo</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">LTV:CAC</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">Breakeven</th>
            <th className="px-3 py-2.5 text-right font-medium text-muted-foreground text-xs">Created</th>
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
                      {model.scenarioName || "Untitled Model"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {mrr !== undefined ? formatCurrency(mrr) : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {arr !== undefined ? formatCurrency(arr) : "—"}
                </td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium", netMarginPct !== undefined ? getMarginColorClass(netMarginPct) : "")}>
                  {netMarginPct !== undefined ? `${Math.round(netMarginPct)}%` : "—"}
                </td>
                <td className={cn("px-3 py-2.5 text-right tabular-nums font-medium", grossMarginPct !== undefined ? getMarginColorClass(grossMarginPct) : "")}>
                  {grossMarginPct !== undefined ? `${Math.round(grossMarginPct)}%` : "—"}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {newSubsPerMonth !== undefined ? newSubsPerMonth.toLocaleString() : "—"}
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
                      : `${ltvCacRatio.toFixed(1)}x`
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
                      ? "Never"
                      : `Mo ${breakeven}`
                    : "—"}
                </td>
                <td className="px-3 py-2.5 text-right text-xs text-muted-foreground tabular-nums">
                  {new Date(model.createdAt).toLocaleDateString()}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={(e) => onDelete(e, model.id, model.scenarioName || "Untitled")}
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
  onClick,
  onDelete,
}: {
  model: SavedModel;
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
                {model.scenarioName || "Untitled Model"}
              </h3>
              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground ml-2">
                <Calendar className="h-3 w-3" />
                <span>{new Date(model.createdAt).toLocaleDateString()}</span>
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
                label="MRR"
                value={mrr !== undefined ? formatCurrency(mrr) : "—"}
              />
              <MetricCell
                icon={<TrendingUp className="h-3 w-3" />}
                label="ARR"
                value={arr !== undefined ? formatCurrency(arr) : "—"}
              />
              <MetricCell
                icon={<DollarSign className="h-3 w-3" />}
                label="Net Margin"
                value={netMarginPct !== undefined ? `${Math.round(netMarginPct)}%` : "—"}
                valueClass={netMarginPct !== undefined ? getMarginColorClass(netMarginPct) : undefined}
              />
              <MetricCell
                icon={<DollarSign className="h-3 w-3" />}
                label="Gross Margin"
                value={grossMarginPct !== undefined ? `${Math.round(grossMarginPct)}%` : "—"}
                valueClass={grossMarginPct !== undefined ? getMarginColorClass(grossMarginPct) : undefined}
              />
              <MetricCell
                icon={<Users className="h-3 w-3" />}
                label="New Subs/Mo"
                value={newSubsPerMonth !== undefined ? String(newSubsPerMonth) : "—"}
              />
              <MetricCell
                icon={<Target className="h-3 w-3" />}
                label="LTV:CAC"
                value={
                  ltvCacRatio !== undefined
                    ? ltvCacRatio === Infinity
                      ? "∞"
                      : `${ltvCacRatio.toFixed(1)}x`
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
                label="Breakeven"
                value={
                  breakeven !== undefined
                    ? breakeven === Infinity
                      ? "Never"
                      : `Month ${breakeven}`
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
