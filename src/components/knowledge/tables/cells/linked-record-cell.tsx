"use client";

import { Badge } from "@/components/ui/badge";
import type { CellRendererProps } from "./index";

export function LinkedRecordCellRenderer({ value }: CellRendererProps) {
  const recordIds = Array.isArray(value) ? (value as string[]) : [];

  if (recordIds.length === 0) {
    return <span className="text-muted-foreground/40 text-sm">—</span>;
  }

  return (
    <div className="flex gap-1 flex-wrap overflow-hidden">
      {recordIds.slice(0, 3).map((id) => (
        <Badge key={id} variant="outline" className="text-[10px] px-1.5 py-0">
          {id.substring(0, 8)}...
        </Badge>
      ))}
      {recordIds.length > 3 && (
        <span className="text-[10px] text-muted-foreground">
          +{recordIds.length - 3}
        </span>
      )}
    </div>
  );
}
