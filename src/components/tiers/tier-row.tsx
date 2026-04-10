"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { SubscriptionTier } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GripVertical, MoreHorizontal } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface TierRowProps {
  tier: SubscriptionTier;
  onDuplicate: (tier: SubscriptionTier) => void;
  onArchive: (tier: SubscriptionTier) => void;
  onDelete: (tier: SubscriptionTier) => void;
}

function statusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge variant="default" className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[11px] px-1.5 py-0">Active</Badge>;
    case "DRAFT":
      return <Badge variant="default" className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[11px] px-1.5 py-0">Draft</Badge>;
    case "ARCHIVED":
      return <Badge variant="default" className="bg-zinc-500/15 text-zinc-400 border-zinc-500/30 text-[11px] px-1.5 py-0">Archived</Badge>;
    default:
      return null;
  }
}

function visibilityBadge(visibility: string) {
  switch (visibility) {
    case "PUBLIC":
      return <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-normal">Public</Badge>;
    case "REP_ONLY":
      return <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-normal border-blue-400/40 text-blue-400">Rep Only</Badge>;
    case "HIDDEN":
      return <Badge variant="outline" className="text-[11px] px-1.5 py-0 font-normal border-zinc-500/40 text-zinc-500">Hidden</Badge>;
    default:
      return null;
  }
}

export function TierRow({ tier, onDuplicate, onArchive, onDelete }: TierRowProps) {
  const router = useRouter();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tier.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const status = (tier as Record<string, unknown>).status as string || "DRAFT";
  const visibility = (tier as Record<string, unknown>).visibility as string || "PUBLIC";
  const tagline = (tier as Record<string, unknown>).tagline as string | null;
  const colorAccent = ((tier as Record<string, unknown>).colorAccent as string) || "#6B7280";

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 hover:bg-muted/30 transition-colors group"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Color accent dot */}
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: colorAccent }}
      />

      {/* Name + tagline */}
      <Link
        href={`/admin/tiers/${tier.id}`}
        className="flex-1 min-w-0 group/link"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate group-hover/link:text-[#C5F135] transition-colors">
            {tier.name}
          </span>
          {tier.isFeatured && (
            <Badge variant="default" className="bg-[#C5F135]/15 text-[#C5F135] border-[#C5F135]/30 text-[10px] px-1.5 py-0">
              Featured
            </Badge>
          )}
        </div>
        {tagline && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {tagline}
          </p>
        )}
      </Link>

      {/* Status badge */}
      <div className="shrink-0">{statusBadge(status)}</div>

      {/* Visibility badge */}
      <div className="shrink-0">{visibilityBadge(visibility)}</div>

      {/* Monthly price */}
      <div className="text-sm tabular-nums font-medium w-20 text-right shrink-0">
        {formatCurrency(Number(tier.monthlyPrice))}/mo
      </div>

      {/* Credits */}
      <div className="text-xs text-muted-foreground w-16 text-right shrink-0 tabular-nums">
        {formatCurrency(Number(tier.monthlyCredits))} cr
      </div>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="ghost" size="icon-sm" className="opacity-0 group-hover:opacity-100 transition-opacity" />}
        >
          <MoreHorizontal className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-40">
          <DropdownMenuItem onClick={() => router.push(`/admin/tiers/${tier.id}`)}>
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDuplicate(tier)}>
            Duplicate
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status === "ACTIVE" ? (
            <DropdownMenuItem onClick={() => onArchive(tier)}>
              Archive
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(tier)}
            >
              Delete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
