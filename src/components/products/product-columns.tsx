"use client";

import { type ColumnDef } from "@tanstack/react-table";
import type { Product } from "@/types";
import type { TierInfo, RedemptionRuleInfo } from "./product-table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, MoreHorizontal, Package } from "lucide-react";
import {
  formatCurrency,
  formatPercent,
  getMarginColorClass,
  toNumber,
} from "@/lib/utils";
import { InlineEditCell } from "./inline-edit-cell";

interface ColumnActions {
  onOpen: (product: Product) => void;
  onDelete: (product: Product) => void;
  onToggleActive: (product: Product) => void;
  onInlineUpdate: (id: string, field: string, value: number) => void;
  tiers: TierInfo[];
  selectedTier: TierInfo | null;
  redemptionRules?: RedemptionRuleInfo[];
}

/** Resolve which redemption rules apply to a product, with priority: SKU > Sub-Category > Category */
function getMatchingRules(
  product: Product,
  rules: RedemptionRuleInfo[]
): { tierName: string; redemptionType: string; discountPercent: number; scopeType: string }[] {
  // Group rules by tierName + redemptionType
  const grouped = new Map<string, RedemptionRuleInfo[]>();
  for (const rule of rules) {
    const key = `${rule.tierName}::${rule.redemptionType}`;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(rule);
  }

  const matches: { tierName: string; redemptionType: string; discountPercent: number; scopeType: string }[] = [];

  for (const [, groupRules] of grouped) {
    // Find the highest-priority match: SKU > SUB_CATEGORY > CATEGORY
    const skuMatch = groupRules.find(
      (r) => r.scopeType === "SKU" && r.scopeValue === product.sku
    );
    if (skuMatch) {
      matches.push({
        tierName: skuMatch.tierName,
        redemptionType: skuMatch.redemptionType,
        discountPercent: skuMatch.discountPercent,
        scopeType: "SKU",
      });
      continue;
    }

    const subCatMatch = groupRules.find(
      (r) =>
        r.scopeType === "SUB_CATEGORY" &&
        r.scopeValue === product.subCategory
    );
    if (subCatMatch) {
      matches.push({
        tierName: subCatMatch.tierName,
        redemptionType: subCatMatch.redemptionType,
        discountPercent: subCatMatch.discountPercent,
        scopeType: "SUB_CATEGORY",
      });
      continue;
    }

    const catMatch = groupRules.find(
      (r) => r.scopeType === "CATEGORY" && r.scopeValue === product.category
    );
    if (catMatch) {
      matches.push({
        tierName: catMatch.tierName,
        redemptionType: catMatch.redemptionType,
        discountPercent: catMatch.discountPercent,
        scopeType: "CATEGORY",
      });
    }
  }

  return matches;
}

function getMemberPrice(
  retailPrice: number,
  discountPercent: number
): number {
  return retailPrice * (1 - discountPercent / 100);
}

function getMargin(cogs: number, memberPrice: number): number {
  if (memberPrice <= 0) return 0;
  return ((memberPrice - cogs) / memberPrice) * 100;
}

export function getProductColumns(actions: ColumnActions): ColumnDef<Product>[] {
  const { tiers, selectedTier, redemptionRules = [] } = actions;

  // Sort tiers by discount to find min/max
  const sortedTiers = [...tiers].sort(
    (a, b) => a.discountPercent - b.discountPercent
  );
  const lowestDiscountTier = sortedTiers[0];
  const highestDiscountTier = sortedTiers[sortedTiers.length - 1];

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
        const url = row.original.imageUrl;
        return (
          <div className="shrink-0 overflow-hidden rounded-md bg-muted" style={{ width: 64, height: 64 }}>
            {url ? (
              <img
                src={url}
                alt=""
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Package className="h-5 w-5 text-muted-foreground" />
              </div>
            )}
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
          Name
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <button
          className="flex flex-col text-left hover:underline"
          onClick={() => actions.onOpen(row.original)}
        >
          <span className="text-sm font-medium">{row.getValue("name")}</span>
        </button>
      ),
    },
    {
      accessorKey: "sku",
      header: () => <span className="text-xs">SKU</span>,
      cell: ({ row }) => (
        <span className="font-mono text-sm text-muted-foreground">
          {row.getValue("sku")}
        </span>
      ),
    },
    {
      accessorKey: "category",
      header: () => <span className="text-xs">Category</span>,
      cell: ({ row }) => (
        <Badge variant="secondary" className="text-sm font-normal">{row.getValue("category")}</Badge>
      ),
      filterFn: (row, id, value) => value === "ALL" || row.getValue(id) === value,
    },
    {
      accessorKey: "subCategory",
      header: () => <span className="text-xs">Sub-Category</span>,
      cell: ({ row }) => {
        const sub = row.getValue("subCategory") as string | null;
        return sub ? (
          <span className="text-sm">{sub}</span>
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        );
      },
    },
    {
      accessorKey: "retailPrice",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Retail Price
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      cell: ({ row }) => (
        <InlineEditCell
          value={toNumber(row.original.retailPrice)}
          onSave={(val) => actions.onInlineUpdate(row.original.id, "retailPrice", val)}
          formatter={formatCurrency}
        />
      ),
    },
    {
      accessorKey: "redemptionType",
      header: () => <span className="text-xs">Redemption Type</span>,
      cell: ({ row }) => {
        const type = row.getValue("redemptionType") as string | null;
        return (
          <span className="text-sm">{type || "Members Store"}</span>
        );
      },
    },
    {
      id: "memberDiscount",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Member Discount
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      accessorFn: () => {
        if (selectedTier) return selectedTier.discountPercent;
        return lowestDiscountTier ? lowestDiscountTier.discountPercent : 0;
      },
      cell: () => {
        if (selectedTier) {
          // Single tier — show exact discount
          return (
            <span className="text-sm tabular-nums">
              {selectedTier.discountPercent > 0
                ? `${selectedTier.discountPercent}%`
                : "0%"}
            </span>
          );
        }

        // All tiers — show range
        if (tiers.length > 0 && lowestDiscountTier && highestDiscountTier) {
          const low = lowestDiscountTier.discountPercent;
          const high = highestDiscountTier.discountPercent;

          if (low === high) {
            return <span className="text-sm tabular-nums">{low}%</span>;
          }

          return (
            <span className="text-sm tabular-nums">
              {low}%{" "}
              <span className="text-muted-foreground">–</span>{" "}
              {high}%
            </span>
          );
        }

        return <span className="text-sm text-muted-foreground">—</span>;
      },
    },
    {
      id: "memberPrice",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Member Price
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      accessorFn: (row) => {
        const retail = toNumber(row.retailPrice);
        if (selectedTier) {
          return getMemberPrice(retail, selectedTier.discountPercent);
        }
        return lowestDiscountTier
          ? getMemberPrice(retail, lowestDiscountTier.discountPercent)
          : toNumber(row.memberPrice);
      },
      cell: ({ row }) => {
        const retail = toNumber(row.original.retailPrice);

        if (selectedTier) {
          const price = getMemberPrice(retail, selectedTier.discountPercent);
          return (
            <span className="text-sm tabular-nums">{formatCurrency(price)}</span>
          );
        }

        // All tiers — show range
        if (tiers.length > 0 && lowestDiscountTier && highestDiscountTier) {
          const highPrice = getMemberPrice(
            retail,
            lowestDiscountTier.discountPercent
          );
          const lowPrice = getMemberPrice(
            retail,
            highestDiscountTier.discountPercent
          );

          if (highPrice === lowPrice) {
            return (
              <span className="text-sm tabular-nums">{formatCurrency(highPrice)}</span>
            );
          }

          return (
            <span className="text-sm tabular-nums">
              {formatCurrency(lowPrice)}{" "}
              <span className="text-muted-foreground">–</span>{" "}
              {formatCurrency(highPrice)}
            </span>
          );
        }

        return (
          <span className="text-sm tabular-nums">
            {formatCurrency(toNumber(row.original.memberPrice))}
          </span>
        );
      },
    },
    {
      accessorKey: "costOfGoods",
      header: () => <span className="text-xs">COGS</span>,
      cell: ({ row }) => (
        <InlineEditCell
          value={toNumber(row.original.costOfGoods)}
          onSave={(val) => actions.onInlineUpdate(row.original.id, "costOfGoods", val)}
          formatter={formatCurrency}
        />
      ),
    },
    {
      id: "margin",
      header: ({ column }) => (
        <button
          className="inline-flex items-center gap-1 text-xs font-medium hover:text-foreground/80"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Margin
          <ArrowUpDown className="h-3 w-3" />
        </button>
      ),
      accessorFn: (row) => {
        const retail = toNumber(row.retailPrice);
        const cogs = toNumber(row.costOfGoods);
        if (selectedTier) {
          const price = getMemberPrice(retail, selectedTier.discountPercent);
          return getMargin(cogs, price);
        }
        return lowestDiscountTier
          ? getMargin(cogs, getMemberPrice(retail, lowestDiscountTier.discountPercent))
          : getMargin(cogs, toNumber(row.memberPrice));
      },
      cell: ({ row }) => {
        const retail = toNumber(row.original.retailPrice);
        const cogs = toNumber(row.original.costOfGoods);

        if (selectedTier) {
          const price = getMemberPrice(retail, selectedTier.discountPercent);
          const margin = getMargin(cogs, price);
          return (
            <Badge className={`${getMarginColorClass(margin)} text-sm font-normal`} variant="outline">
              {formatPercent(margin)}
            </Badge>
          );
        }

        // All tiers — show range
        if (tiers.length > 0 && lowestDiscountTier && highestDiscountTier) {
          const highPrice = getMemberPrice(
            retail,
            lowestDiscountTier.discountPercent
          );
          const lowPrice = getMemberPrice(
            retail,
            highestDiscountTier.discountPercent
          );
          const highMargin = getMargin(cogs, highPrice);
          const lowMargin = getMargin(cogs, lowPrice);

          if (highMargin === lowMargin) {
            return (
              <Badge
                className={`${getMarginColorClass(highMargin)} text-sm font-normal`}
                variant="outline"
              >
                {formatPercent(highMargin)}
              </Badge>
            );
          }

          return (
            <span className="flex items-center gap-1 text-sm tabular-nums">
              <Badge
                className={`${getMarginColorClass(lowMargin)} text-sm font-normal`}
                variant="outline"
              >
                {formatPercent(lowMargin)}
              </Badge>
              <span className="text-muted-foreground">–</span>
              <Badge
                className={`${getMarginColorClass(highMargin)} text-sm font-normal`}
                variant="outline"
              >
                {formatPercent(highMargin)}
              </Badge>
            </span>
          );
        }

        const margin = getMargin(cogs, toNumber(row.original.memberPrice));
        return (
          <Badge className={`${getMarginColorClass(margin)} text-sm font-normal`} variant="outline">
            {formatPercent(margin)}
          </Badge>
        );
      },
    },
    // Tier pills column — shows which tiers each product belongs to via redemption rules
    ...(redemptionRules.length > 0
      ? [
          {
            id: "tiers",
            header: () => <span className="text-xs">Tiers</span>,
            cell: ({ row }: { row: { original: Product } }) => {
              const matches = getMatchingRules(row.original, redemptionRules);
              if (!matches.length) {
                return <span className="text-sm text-muted-foreground">—</span>;
              }
              return (
                <TooltipProvider>
                  <div className="flex flex-wrap gap-1">
                    {matches.map((m) => {
                      const isStore = m.redemptionType === "MEMBERS_STORE";
                      const label = isStore ? "MS" : "MR";
                      const scopeLabel =
                        m.scopeType === "SKU"
                          ? "SKU"
                          : m.scopeType === "SUB_CATEGORY"
                            ? "Sub-Cat"
                            : "Cat";
                      return (
                        <Tooltip key={`${m.tierName}-${m.redemptionType}`}>
                          <TooltipTrigger className="cursor-default">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1.5 py-0 font-normal ${
                                isStore
                                  ? "border-[#C5F135]/50 bg-[#C5F135]/10 text-[#C5F135]"
                                  : "border-blue-400/50 bg-blue-400/10 text-blue-400"
                              }`}
                            >
                              {m.tierName} · {m.discountPercent}% {label}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            <p>
                              {m.tierName} — {isStore ? "Members Store" : "Members Rate"}
                            </p>
                            <p className="text-muted-foreground">
                              {m.discountPercent}% off · matched via {scopeLabel}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </TooltipProvider>
              );
            },
          } as ColumnDef<Product>,
        ]
      : []),
    {
      accessorKey: "isActive",
      header: () => <span className="text-xs">Status</span>,
      cell: ({ row }) => (
        <button
          onClick={() => actions.onToggleActive(row.original)}
          className="cursor-pointer"
        >
          <Badge variant={row.original.isActive ? "default" : "secondary"} className="text-sm font-normal">
            {row.original.isActive ? "Active" : "Inactive"}
          </Badge>
        </button>
      ),
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
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onToggleActive(row.original)}
            >
              {row.original.isActive ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
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
