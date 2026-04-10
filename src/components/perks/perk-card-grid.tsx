"use client";

import type { Perk } from "@/types";
import { Gift } from "lucide-react";

type PerkWithCount = Perk & { _count: { tierAssignments: number } };

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-500",
  DRAFT: "bg-amber-400/10 text-amber-400",
  ARCHIVED: "bg-red-400/10 text-red-400",
};

interface PerkCardGridProps {
  perks: PerkWithCount[];
  onOpen: (perk: PerkWithCount) => void;
}

export function PerkCardGrid({ perks, onOpen }: PerkCardGridProps) {
  if (perks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Gift className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No perks found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {perks.map((perk) => (
        <button
          key={perk.id}
          type="button"
          onClick={() => onOpen(perk)}
          className="group relative flex flex-col rounded-xl border bg-card text-left transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
        >
          {/* Icon area */}
          <div className="relative aspect-square w-full bg-muted/50 overflow-hidden flex items-center justify-center">
            <Gift className="h-12 w-12 text-muted-foreground/40" />

            {perk.status === "ARCHIVED" && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
                  Archived
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1.5 p-3">
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[perk.status] || "bg-muted text-muted-foreground"}`}
              >
                {perk.status.charAt(0) + perk.status.slice(1).toLowerCase()}
              </span>
            </div>

            <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {perk.name}
            </h3>

            {perk.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {perk.description}
              </p>
            )}

            <p className="text-[11px] text-muted-foreground mt-auto pt-1">
              {perk._count.tierAssignments} tier{perk._count.tierAssignments !== 1 ? "s" : ""}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
