"use client";

import type { PartnerWithAssignments } from "./partner-columns";
import { Building2, ImageOff } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  RESEARCHED: "bg-zinc-400/10 text-zinc-500",
  APPLIED: "bg-amber-400/10 text-amber-500",
  APPROVED: "bg-blue-400/10 text-blue-500",
  ACTIVE: "bg-green-500/10 text-green-500",
  PAUSED: "bg-orange-400/10 text-orange-500",
};

interface PartnerCardGridProps {
  partners: PartnerWithAssignments[];
  onOpen: (partner: PartnerWithAssignments) => void;
}

export function PartnerCardGrid({ partners, onOpen }: PartnerCardGridProps) {
  if (partners.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Building2 className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No partners found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {partners.map((partner) => (
        <button
          key={partner.id}
          type="button"
          onClick={() => onOpen(partner)}
          className="group relative flex flex-col rounded-xl border bg-card text-left transition-all hover:shadow-lg hover:border-primary/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring overflow-hidden"
        >
          {/* Image */}
          <div className="relative aspect-square w-full bg-muted/50 overflow-hidden">
            {partner.logoUrl ? (
              <img
                src={partner.logoUrl}
                alt={partner.name}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                  img.parentElement!.querySelector("[data-fallback]")!.removeAttribute("hidden");
                }}
              />
            ) : null}
            <div data-fallback className="flex h-full w-full items-center justify-center" hidden={!!partner.logoUrl}>
              <ImageOff className="h-8 w-8 text-muted-foreground/30" />
            </div>

            {/* Status indicator for non-active */}
            {partner.status === "PAUSED" && (
              <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground bg-background/80 px-2 py-0.5 rounded-full">
                  Paused
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col gap-1.5 p-3">
            {/* Status + Category */}
            <div className="flex items-center gap-1.5">
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${STATUS_COLORS[partner.status] || "bg-muted text-muted-foreground"}`}
              >
                {partner.status.charAt(0) + partner.status.slice(1).toLowerCase()}
              </span>
            </div>

            {/* Name */}
            <h3 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {partner.name}
            </h3>

            {/* Category */}
            <p className="text-[11px] text-muted-foreground truncate">
              {partner.category}
            </p>

            {/* Benefit */}
            {partner.audienceBenefit && (
              <p className="text-[11px] text-muted-foreground truncate">
                {partner.audienceBenefit}
              </p>
            )}

            {/* Commission */}
            {partner.commissionRate && (
              <div className="flex items-baseline gap-2 mt-auto pt-1">
                <span className="text-xs font-medium tabular-nums text-foreground">
                  {partner.commissionRate}
                </span>
              </div>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
