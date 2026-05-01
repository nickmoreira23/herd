"use client";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/lib/i18n/locale-context";
import type { CellRendererProps } from "./index";

export function LinkedRecordCellRenderer({ value }: CellRendererProps) {
  const t = useT();
  const recordIds = Array.isArray(value) ? (value as string[]) : [];

  if (recordIds.length === 0) {
    return <span className="text-muted-foreground/40 text-sm">{"—"}</span>;
  }

  const overflow = recordIds.length - 3;

  return (
    <div className="flex gap-1 flex-wrap overflow-hidden">
      {recordIds.slice(0, 3).map((id) => (
        <Badge key={id} variant="outline" className="text-[10px] px-1.5 py-0">
          {t("tables.cells.linked_record.id_preview", {
            id: id.substring(0, 8),
          })}
        </Badge>
      ))}
      {overflow > 0 && (
        <span className="text-[10px] text-muted-foreground">
          {t("tables.cells.linked_record.overflow_count", { count: overflow })}
        </span>
      )}
    </div>
  );
}
