"use client";

import { CampaignCard } from "./campaign-card";
import { STATUS_CONFIG, STATUS_ORDER, type CampaignRow } from "./types";

interface CampaignsKanbanProps {
  campaigns: CampaignRow[];
}

export function CampaignsKanban({ campaigns }: CampaignsKanbanProps) {
  return (
    <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      {STATUS_ORDER.map((status) => {
        const items = campaigns.filter((c) => c.status === status);
        const cfg = STATUS_CONFIG[status];
        const totalSpent = items.reduce(
          (acc, c) => acc + (c.spent ? Number(c.spent) : 0),
          0
        );
        return (
          <div key={status} className="space-y-2 min-w-0">
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
            {totalSpent > 0 && (
              <div className="text-[11px] text-muted-foreground -mt-1">
                gasto:{" "}
                {totalSpent.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </div>
            )}
            <div className="space-y-2">
              {items.map((c) => (
                <CampaignCard key={c.id} campaign={c} />
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
