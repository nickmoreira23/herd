"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import type { KnowledgeAppRow, KnowledgeAppDataPointRow } from "./types";

const DATA_CATEGORY_LABELS: Record<string, string> = {
  SLEEP: "Sleep",
  ACTIVITY: "Activity",
  RECOVERY: "Recovery",
  HEART_RATE: "Heart Rate",
  WORKOUT: "Workout",
  READINESS: "Readiness",
  BODY: "Body",
  APP_NUTRITION: "Nutrition",
  APP_OTHER: "Other",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  PROCESSING: {
    label: "Processing",
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  },
  READY: {
    label: "Ready",
    className: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  ERROR: {
    label: "Error",
    className: "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

interface KnowledgeAppDataDialogProps {
  app: KnowledgeAppRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KnowledgeAppDataDialog({
  app,
  open,
  onOpenChange,
}: KnowledgeAppDataDialogProps) {
  const [dataPoints, setDataPoints] = useState<KnowledgeAppDataPointRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!app || !open) {
      setDataPoints([]);
      setCategoryFilter("ALL");
      setExpandedId(null);
      return;
    }

    async function fetchData() {
      setLoading(true);
      const params = new URLSearchParams();
      if (categoryFilter !== "ALL") params.set("category", categoryFilter);
      params.set("limit", "200");

      const res = await fetch(
        `/api/knowledge/apps/${app!.id}/data?${params.toString()}`
      );
      const json = await res.json();
      if (json.data?.dataPoints) {
        setDataPoints(json.data.dataPoints);
      }
      setLoading(false);
    }

    fetchData();
  }, [app, open, categoryFilter]);

  if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="pr-8">{app.name} — Data Points</DialogTitle>
          <div className="flex items-center gap-2 pt-1">
            <Badge
              variant="outline"
              className="text-xs bg-violet-500/10 text-violet-500 border-violet-500/20"
            >
              {app.dataPointCount} total
            </Badge>
            <Badge
              variant="outline"
              className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            >
              {app.readyDataPointCount} ready
            </Badge>
          </div>
        </DialogHeader>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val ?? "ALL")}>
            <SelectTrigger className="w-auto min-w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Categories</SelectItem>
              {app.dataCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {DATA_CATEGORY_LABELS[cat] || cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Data points list */}
        <div className="flex-1 overflow-auto rounded-lg border bg-muted/30 min-h-0">
          {loading && (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && dataPoints.length === 0 && (
            <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
              No data points synced yet.
            </div>
          )}
          {!loading && dataPoints.length > 0 && (
            <div className="divide-y">
              {dataPoints.map((dp) => {
                const statusConfig = STATUS_CONFIG[dp.status] || STATUS_CONFIG.PENDING;
                const isExpanded = expandedId === dp.id;
                return (
                  <div key={dp.id} className="px-4 py-3">
                    <button
                      className="flex items-center gap-3 w-full text-left"
                      onClick={() =>
                        setExpandedId(isExpanded ? null : dp.id)
                      }
                    >
                      <span className="text-sm font-medium tabular-nums min-w-[90px]">
                        {new Date(dp.date).toLocaleDateString()}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-violet-500/5 text-violet-500 border-violet-500/20"
                      >
                        {DATA_CATEGORY_LABELS[dp.category] || dp.category}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusConfig.className}`}
                      >
                        {statusConfig.label}
                      </Badge>
                      <span className="flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {isExpanded ? "Collapse" : "Expand"}
                      </span>
                    </button>
                    {isExpanded && (
                      <div className="mt-2 pl-[102px]">
                        {dp.textContent ? (
                          <pre className="text-sm whitespace-pre-wrap break-words font-mono leading-relaxed text-muted-foreground">
                            {dp.textContent}
                          </pre>
                        ) : dp.status === "ERROR" ? (
                          <p className="text-sm text-destructive">
                            {dp.errorMessage || "Processing failed."}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            Not yet processed.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
