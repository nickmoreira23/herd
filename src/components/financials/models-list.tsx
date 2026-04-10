"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, BarChart3, Trash2, Calendar, TrendingUp, Users, DollarSign, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, getMarginColorClass } from "@/lib/utils";
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
        <Button onClick={() => router.push("/admin/operation/finances/projections/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Add Model
        </Button>
      </div>

      {models.length === 0 ? (
        <EmptyState onAdd={() => router.push("/admin/operation/finances/projections/new")} />
      ) : (
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
