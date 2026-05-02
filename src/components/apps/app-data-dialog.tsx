"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { formatDate } from "@/lib/i18n/format-date";
import {
  appDataPointStatusLabelKey,
  dataCategoryLabelKey,
} from "@/lib/apps/provider-catalog";
import type { AppRow, AppDataPointRow } from "./types";

const DATA_POINT_STATUS_CLASSNAMES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  READY: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ERROR: "bg-red-500/10 text-red-500 border-red-500/20",
};

interface AppDataDialogProps {
  app: AppRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AppDataDialog({
  app,
  open,
  onOpenChange,
}: AppDataDialogProps) {
  const t = useT();
  const locale = useLocale();
  const [dataPoints, setDataPoints] = useState<AppDataPointRow[]>([]);
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
        `/api/apps/${app!.id}/data?${params.toString()}`,
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
          <DialogTitle className="pr-8">
            {t("apps.data_dialog.title", { name: app.name })}
          </DialogTitle>
          <div className="flex items-center gap-2 pt-1">
            <Badge
              variant="outline"
              className="text-xs bg-violet-500/10 text-violet-500 border-violet-500/20"
            >
              {t("apps.data_dialog.total", { count: app.dataPointCount })}
            </Badge>
            <Badge
              variant="outline"
              className="text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
            >
              {t("apps.data_dialog.ready", { count: app.readyDataPointCount })}
            </Badge>
          </div>
        </DialogHeader>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Select
            value={categoryFilter}
            onValueChange={(val) => setCategoryFilter(val ?? "ALL")}
          >
            <SelectTrigger className="w-auto min-w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">
                {t("apps.data_dialog.filter_all")}
              </SelectItem>
              {app.dataCategories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {t(dataCategoryLabelKey(cat))}
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
              {t("apps.data_dialog.empty")}
            </div>
          )}
          {!loading && dataPoints.length > 0 && (
            <div className="divide-y">
              {dataPoints.map((dp) => {
                const statusClass =
                  DATA_POINT_STATUS_CLASSNAMES[dp.status] ??
                  DATA_POINT_STATUS_CLASSNAMES.PENDING;
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
                        {formatDate(new Date(dp.date), locale, "short")}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-violet-500/5 text-violet-500 border-violet-500/20"
                      >
                        {t(dataCategoryLabelKey(dp.category))}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${statusClass}`}
                      >
                        {t(appDataPointStatusLabelKey(dp.status))}
                      </Badge>
                      <span className="flex-1" />
                      <span className="text-xs text-muted-foreground">
                        {isExpanded
                          ? t("apps.data_dialog.collapse")
                          : t("apps.data_dialog.expand")}
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
                            {dp.errorMessage || t("apps.data_dialog.processing_failed")}
                          </p>
                        ) : (
                          <p className="text-sm text-muted-foreground italic">
                            {t("apps.data_dialog.not_processed")}
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
