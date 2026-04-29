"use client";

import { useT } from "@/lib/i18n/locale-context";
import { RoutineCard } from "./routine-card";
import { STATUS_COLOR, STATUS_ORDER, type RoutineRow } from "./types";

interface RoutinesKanbanProps {
  routines: RoutineRow[];
}

export function RoutinesKanban({ routines }: RoutinesKanbanProps) {
  const t = useT();
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
      {STATUS_ORDER.map((status) => {
        const items = routines.filter((r) => r.status === status);
        return (
          <div key={status} className="space-y-2 min-w-0">
            <div className="flex items-center justify-between sticky top-0 bg-background py-2 gap-2">
              <span
                className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${STATUS_COLOR[status]}`}
              >
                {t(`routines.status.${status}`)}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {items.length}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((r) => (
                <RoutineCard key={r.id} routine={r} />
              ))}
              {items.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded">
                  —
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
