"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, ArrowRight } from "lucide-react";

interface TierMappingRowProps {
  mapping: {
    id: string;
    externalPlanId: string;
    externalPlanName: string | null;
    subscriptionTierId: string;
    syncDirection: string;
    isActive: boolean;
    subscriptionTier: { id: string; name: string; slug: string };
  };
  tiers: { id: string; name: string; slug: string }[];
  onDelete: (mappingId: string) => void;
}

export function TierMappingRow({ mapping, onDelete }: TierMappingRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 px-3 rounded-md border bg-card">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {mapping.externalPlanName || mapping.externalPlanId}
        </p>
        <p className="text-xs text-muted-foreground">ID: {mapping.externalPlanId}</p>
      </div>

      <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">
          {mapping.subscriptionTier.name}
        </p>
        <p className="text-xs text-muted-foreground">{mapping.subscriptionTier.slug}</p>
      </div>

      <Badge
        className={`text-[10px] ${
          mapping.isActive
            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {mapping.isActive ? "Active" : "Inactive"}
      </Badge>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(mapping.id)}
        className="text-muted-foreground hover:text-red-600"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
