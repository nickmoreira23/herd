"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Columns3 } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";

interface TableToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  recordCount: number;
  totalRecords: number;
  onAddRecord: () => void;
  onAddField: () => void;
}

export function TableToolbar({
  search,
  onSearchChange,
  recordCount,
  totalRecords,
  onAddRecord,
  onAddField,
}: TableToolbarProps) {
  const t = useT();

  const recordCountLabel =
    recordCount !== totalRecords
      ? t("tables.toolbar.records_count_filtered", {
          shown: recordCount,
          total: totalRecords,
        })
      : t("tables.toolbar.records_count", { count: recordCount });

  return (
    <div className="flex items-center gap-3 px-1 py-2 border-b">
      <div className="relative flex-1 min-w-0 max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          placeholder={t("tables.toolbar.search_placeholder")}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8 pr-20 h-8 text-xs w-full"
          aria-label={t("tables.toolbar.search_aria")}
        />
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
          {recordCountLabel}
        </span>
      </div>

      <div className="flex items-center gap-1.5 ml-auto">
        <Button variant="outline" size="sm" onClick={onAddField}>
          <Columns3 className="h-3.5 w-3.5 mr-1" />
          {t("tables.toolbar.add_field")}
        </Button>
        <Button size="sm" onClick={onAddRecord}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          {t("tables.toolbar.add_record")}
        </Button>
      </div>
    </div>
  );
}
