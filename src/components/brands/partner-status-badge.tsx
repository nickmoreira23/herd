"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  RESEARCHED: { label: "Researched", className: "bg-zinc-100 text-zinc-700 border-zinc-300" },
  APPLIED: { label: "Applied", className: "bg-yellow-100 text-yellow-800 border-yellow-300" },
  APPROVED: { label: "Approved", className: "bg-blue-100 text-blue-800 border-blue-300" },
  ACTIVE: { label: "Active", className: "bg-green-100 text-green-800 border-green-300" },
  PAUSED: { label: "Paused", className: "bg-orange-100 text-orange-800 border-orange-300" },
};

export function PartnerStatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.RESEARCHED;
  return (
    <Badge variant="outline" className={`text-xs ${config.className}`}>
      {config.label}
    </Badge>
  );
}
