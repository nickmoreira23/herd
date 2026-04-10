"use client";

import { type ColumnDef } from "@tanstack/react-table";
import type { PartnerBrand, PartnerTierAssignment, SubscriptionTier } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Check, ExternalLink, Building2 } from "lucide-react";

export type PartnerWithAssignments = PartnerBrand & {
  tierAssignments: (PartnerTierAssignment & { tier: SubscriptionTier })[];
};

interface ColumnActions {
  onOpen: (partner: PartnerWithAssignments) => void;
  onDelete: (partner: PartnerWithAssignments) => void;
}

const STATUS_COLORS: Record<string, string> = {
  RESEARCHED: "border-zinc-400/50 bg-zinc-400/10 text-zinc-500",
  APPLIED: "border-amber-400/50 bg-amber-400/10 text-amber-500",
  APPROVED: "border-blue-400/50 bg-blue-400/10 text-blue-500",
  ACTIVE: "border-green-500/50 bg-green-500/10 text-green-500",
  PAUSED: "border-orange-400/50 bg-orange-400/10 text-orange-500",
};

export function getPartnerColumns(actions: ColumnActions): ColumnDef<PartnerWithAssignments>[] {
  return [
    {
      id: "select",
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllPageRowsSelected()}
          onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
          aria-label="Select all"
          className="accent-primary"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={(e) => row.toggleSelected(e.target.checked)}
          aria-label="Select row"
          className="accent-primary"
        />
      ),
      enableSorting: false,
    },
    {
      id: "image",
      header: () => <span className="text-xs">Image</span>,
      cell: ({ row }) => {
        const url = row.original.logoUrl;
        return (
          <div className="shrink-0 overflow-hidden rounded-md bg-muted" style={{ width: 64, height: 64 }}>
            {url ? (
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
                onError={(e) => {
                  const img = e.currentTarget;
                  img.style.display = "none";
                  img.parentElement!.querySelector("[data-fallback]")!.removeAttribute("hidden");
                }}
              />
            ) : null}
            <div data-fallback className="flex h-full w-full items-center justify-center" hidden={!!url}>
              <Building2 className="h-5 w-5 text-muted-foreground" />
            </div>
          </div>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Partner
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <button
          className="flex flex-col text-left hover:underline"
          onClick={() => actions.onOpen(row.original)}
        >
          <span className="text-sm font-medium">{row.original.name}</span>
          {row.original.audienceBenefit && (
            <span className="text-xs text-muted-foreground line-clamp-1">
              {row.original.audienceBenefit}
            </span>
          )}
        </button>
      ),
    },
    {
      accessorKey: "category",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Category
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {row.getValue("category")}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: () => <span className="text-xs">Status</span>,
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        return (
          <Badge
            variant="outline"
            className={`text-xs font-normal ${STATUS_COLORS[status] || ""}`}
          >
            {status.charAt(0) + status.slice(1).toLowerCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: "commissionRate",
      header: () => <span className="text-xs">Commission</span>,
      cell: ({ row }) => (
        <span className="text-sm tabular-nums">
          {row.original.commissionRate || <span className="text-muted-foreground">--</span>}
        </span>
      ),
    },
    {
      accessorKey: "affiliateNetwork",
      header: () => <span className="text-xs">Network</span>,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground truncate max-w-[140px] block">
          {row.original.affiliateNetwork || "--"}
        </span>
      ),
    },
    {
      accessorKey: "cookieDuration",
      header: () => <span className="text-xs">Cookie</span>,
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.cookieDuration || "--"}
        </span>
      ),
    },
    {
      id: "affiliate",
      header: () => <span className="text-xs">Affiliate Link</span>,
      cell: ({ row }) => {
        if (row.original.affiliateLinkPlaceholder) {
          return (
            <span className="inline-flex items-center gap-1 text-xs text-green-600">
              <Check className="h-3 w-3" /> Set
            </span>
          );
        }
        if (row.original.affiliateSignupUrl) {
          return (
            <a
              href={row.original.affiliateSignupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" /> Signup
            </a>
          );
        }
        return <span className="text-xs text-muted-foreground">--</span>;
      },
    },
    {
      id: "tiers",
      header: () => <span className="text-xs">Tiers</span>,
      cell: ({ row }) => {
        const active = row.original.tierAssignments.filter((a) => a.isActive).length;
        return (
          <span className="text-sm tabular-nums">
            {active > 0 ? active : <span className="text-muted-foreground">0</span>}
          </span>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="icon-sm" />}
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => actions.onOpen(row.original)}>
              Open
            </DropdownMenuItem>
            {row.original.websiteUrl && (
              <DropdownMenuItem
                onClick={() => window.open(row.original.websiteUrl!, "_blank")}
              >
                Visit Website
              </DropdownMenuItem>
            )}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => actions.onDelete(row.original)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}
