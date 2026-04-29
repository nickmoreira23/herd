"use client";

import { DealCard } from "./deal-card";
import { STAGE_CONFIG, STAGE_ORDER, type DealRow } from "./types";

interface DealsKanbanProps {
  deals: DealRow[];
}

export function DealsKanban({ deals }: DealsKanbanProps) {
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {STAGE_ORDER.map((stage) => {
        const items = deals.filter((d) => d.stage === stage);
        const cfg = STAGE_CONFIG[stage];
        const total = items.reduce(
          (acc, d) => acc + (d.amount ? Number(d.amount) : 0),
          0
        );
        return (
          <div key={stage} className="space-y-2 min-w-0">
            <div className="flex items-center justify-between sticky top-0 bg-background py-2 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`text-[10px] uppercase tracking-wide rounded px-1.5 py-0.5 ${cfg.color}`}
                >
                  {cfg.label}
                </span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {items.length}
                </span>
              </div>
            </div>
            {total > 0 && (
              <div className="text-[11px] text-muted-foreground -mt-1">
                {total.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            )}
            <div className="space-y-2">
              {items.map((d) => (
                <DealCard key={d.id} deal={d} />
              ))}
              {items.length === 0 && (
                <div className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded">
                  Vazio
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
