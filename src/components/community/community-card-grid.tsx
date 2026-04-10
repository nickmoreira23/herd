"use client";

import type { CommunityBenefit } from "@/types";
import { Users } from "lucide-react";

type BenefitWithCount = CommunityBenefit & { _count: { tierAssignments: number } };

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-500",
  DRAFT: "bg-amber-400/10 text-amber-400",
  ARCHIVED: "bg-red-400/10 text-red-400",
};

const PLATFORM_COLORS: Record<string, string> = {
  discord: "bg-indigo-400/10 text-indigo-400",
  zoom: "bg-blue-400/10 text-blue-400",
  forum: "bg-emerald-400/10 text-emerald-400",
  slack: "bg-purple-400/10 text-purple-400",
  "in-person": "bg-orange-400/10 text-orange-400",
  other: "bg-gray-400/10 text-gray-400",
};

interface CommunityCardGridProps {
  benefits: BenefitWithCount[];
  onOpen: (benefit: BenefitWithCount) => void;
}

export function CommunityCardGrid({ benefits, onOpen }: CommunityCardGridProps) {
  if (benefits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Users className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No community benefits found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {benefits.map((benefit) => (
        <button
          key={benefit.id}
          type="button"
          onClick={() => onOpen(benefit)}
          className="group relative flex flex-col rounded-xl border bg-card text-left transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
        >
          {/* Icon area */}
          <div className="relative aspect-square w-full bg-muted/50 overflow-hidden flex items-center justify-center">
            <Users className="h-12 w-12 text-muted-foreground/40" />

            {benefit.status === "ARCHIVED" && (
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
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[benefit.status] || "bg-muted text-muted-foreground"}`}
              >
                {benefit.status.charAt(0) + benefit.status.slice(1).toLowerCase()}
              </span>
              {benefit.platform && (
                <span
                  className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${PLATFORM_COLORS[benefit.platform] || PLATFORM_COLORS.other}`}
                >
                  {benefit.platform}
                </span>
              )}
            </div>

            <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {benefit.name}
            </h3>

            {benefit.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {benefit.description}
              </p>
            )}

            <p className="text-[11px] text-muted-foreground mt-auto pt-1">
              {benefit._count.tierAssignments} tier{benefit._count.tierAssignments !== 1 ? "s" : ""}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
