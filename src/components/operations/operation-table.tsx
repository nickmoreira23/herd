"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { getOperationColumns } from "./operation-columns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

interface CategoryRow {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  color: string;
  sortOrder: number;
  isActive: boolean;
  _itemCount: number;
  _preLaunchCost: number;
}

interface StatItem {
  label: string;
  value: string;
}

interface OperationTableProps {
  initialCategories: CategoryRow[];
  stats: StatItem[];
}

const STATUS_OPTIONS = [
  { value: "All Status", filterKey: "ALL" },
  { value: "Active", filterKey: "ACTIVE" },
  { value: "Inactive", filterKey: "INACTIVE" },
] as const;

export function OperationTable({ initialCategories, stats }: OperationTableProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryRow[]>(initialCategories);
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState<string>("All Status");

  const statusFilter = STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredCategories = useMemo(() => {
    let filtered = categories;
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter((c) => c.isActive);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter((c) => !c.isActive);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [categories, statusFilter, search]);

  const refreshCategories = useCallback(async () => {
    const res = await fetch("/api/operation");
    const json = await res.json();
    if (json.data) setCategories(json.data);
  }, []);

  const handleDelete = useCallback(
    async (category: CategoryRow) => {
      if (!confirm(`Delete "${category.name}"?`)) return;
      const res = await fetch(`/api/operations/${category.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshCategories();
        toast.success("Deleted");
      }
    },
    [refreshCategories]
  );

  const handleToggleActive = useCallback(
    async (category: CategoryRow) => {
      const res = await fetch(`/api/operations/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "updateCategory", isActive: !category.isActive }),
      });
      if (res.ok) {
        await refreshCategories();
        toast.success(category.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshCategories]
  );

  const columns = useMemo(
    () =>
      getOperationColumns({
        onOpen: (c) => router.push(`/admin/operation/finances/expenses/${c.id}`),
        onDelete: handleDelete,
        onToggleActive: handleToggleActive,
      }),
    [handleDelete, handleToggleActive, router]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage OpEx categories and expense items.
          </p>
        </div>
        <Button size="sm" onClick={() => router.push("/admin/operation/finances/expenses/new")}>
          <Plus className="mr-1 h-3 w-3" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">{stat.label}</p>
            <p className="text-lg font-bold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCategories}
        toolbar={() => (
          <div className="flex items-center gap-3">
            {/* Status filter */}
            <Select
              value={statusValue}
              onValueChange={(val) => setStatusValue(val ?? "All Status")}
            >
              <SelectTrigger className="w-auto min-w-[100px] text-sm shrink-0">
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
                placeholder="Search by name or description..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 pr-20 text-sm w-full"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                {filteredCategories.length} items
              </span>
            </div>
          </div>
        )}
      />
    </div>
  );
}
