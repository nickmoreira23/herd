"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { PARTNER_CATEGORIES } from "@/types";
import { DataTable } from "@/components/shared/data-table";
import { getPartnerColumns, type PartnerWithAssignments } from "./partner-columns";
import { PartnerCardGrid } from "./partner-card-grid";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, SlidersHorizontal, Power, PowerOff, Trash2, LayoutGrid, List } from "lucide-react";
import { useReactTable } from "@tanstack/react-table";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { toast } from "sonner";

const STATUS_OPTIONS = [
  { value: "All Statuses", filterKey: "ALL" },
  { value: "Researched", filterKey: "RESEARCHED" },
  { value: "Applied", filterKey: "APPLIED" },
  { value: "Approved", filterKey: "APPROVED" },
  { value: "Active", filterKey: "ACTIVE" },
  { value: "Paused", filterKey: "PAUSED" },
] as const;

interface PartnerTableProps {
  initialPartners: PartnerWithAssignments[];
}

export function PartnerTable({ initialPartners }: PartnerTableProps) {
  const router = useRouter();
  const [partners, setPartners] = useState<PartnerWithAssignments[]>(initialPartners);
  const [search, setSearch] = useState("");
  const [categoryValue, setCategoryValue] = useState("All Categories");
  const [statusValue, setStatusValue] = useState("All Statuses");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const categoryFilter = categoryValue === "All Categories" ? "ALL" : categoryValue;
  const statusFilter = STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredPartners = useMemo(() => {
    let filtered = partners;
    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.audienceBenefit && p.audienceBenefit.toLowerCase().includes(q)) ||
          (p.affiliateNetwork && p.affiliateNetwork.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [partners, categoryFilter, statusFilter, search]);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/partners");
    const json = await res.json();
    if (json.data) setPartners(json.data);
  }, []);

  const handleDelete = useCallback(
    async (partner: PartnerWithAssignments) => {
      if (!confirm(`Delete "${partner.name}"?`)) return;
      const res = await fetch(`/api/partners/${partner.id}`, { method: "DELETE" });
      if (res.ok) {
        setPartners((prev) => prev.filter((p) => p.id !== partner.id));
        toast.success("Deleted");
      }
    },
    []
  );

  const handleBulkAction = useCallback(
    async (
      table: ReturnType<typeof useReactTable<PartnerWithAssignments>>,
      action: "delete"
    ) => {
      const ids = table
        .getFilteredSelectedRowModel()
        .rows.map((r) => r.original.id);
      if (!ids.length) return;

      if (action === "delete" && !confirm(`Delete ${ids.length} partner${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) {
        return;
      }

      const res = await fetch("/api/partners/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (res.ok) {
        table.toggleAllRowsSelected(false);
        setPartners((prev) => prev.filter((p) => !ids.includes(p.id)));
        toast.success(`Deleted ${ids.length} partner${ids.length === 1 ? "" : "s"}`);
      }
    },
    []
  );

  const columns = useMemo(
    () =>
      getPartnerColumns({
        onOpen: (p) => router.push(`/admin/brands/${p.id}`),
        onDelete: handleDelete,
      }),
    [handleDelete, router]
  );

  // Count partners per category for dropdown
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    partners.forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    return counts;
  }, [partners]);

  // Get categories that actually have partners
  const activeCategories = useMemo(() => {
    return PARTNER_CATEGORIES.filter((c) => categoryCounts[c] > 0);
  }, [categoryCounts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Partners</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage affiliate partners, discounts, and commission programs.
          </p>
        </div>
        <Button size="sm" onClick={() => router.push("/admin/brands/new")}>
          <Plus className="mr-1 h-3 w-3" />
          Add Partner
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-3">
        {/* View toggle */}
        <div className="flex items-center rounded-lg border bg-muted/50 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-md px-2.5 py-2 transition-colors ${
              viewMode === "list"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="List view"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`rounded-md px-2.5 py-2 transition-colors ${
              viewMode === "grid"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>

        {/* Category dropdown */}
        <Select
          value={categoryValue}
          onValueChange={(val) => setCategoryValue(val ?? "All Categories")}
        >
          <SelectTrigger className="w-auto min-w-[180px] text-sm shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All Categories">
              All Categories
              <span className="ml-1.5 text-muted-foreground">
                ({partners.length})
              </span>
            </SelectItem>
            {activeCategories.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
                <span className="ml-1.5 text-muted-foreground">
                  ({categoryCounts[c]})
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status filter */}
        <Select
          value={statusValue}
          onValueChange={(val) => setStatusValue(val ?? "All Statuses")}
        >
          <SelectTrigger className="w-auto min-w-[120px] text-sm shrink-0">
            <SlidersHorizontal className="mr-1.5 h-3 w-3" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search by name, benefit, or network..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 pr-20 text-sm w-full"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
            {filteredPartners.length} items
          </span>
        </div>
      </div>

      {/* Content */}
      {viewMode === "grid" ? (
        <PartnerCardGrid
          partners={filteredPartners}
          onOpen={(p) => router.push(`/admin/brands/${p.id}`)}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filteredPartners}
          enableRowSelection
          toolbar={(table) => (
            <>
              {table.getFilteredSelectedRowModel().rows.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleBulkAction(table, "delete")}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              )}
            </>
          )}
        />
      )}
      <BlockAgentPanel blockName="partners" blockDisplayName="Partner Brands" />
    </div>
  );
}
