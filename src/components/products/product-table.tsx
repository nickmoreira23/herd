"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { DataTable } from "@/components/shared/data-table";
import { getProductColumns } from "./product-columns";
import { ProductUrlImportModal } from "./product-url-import-modal";
import { ProductSiteImportModal } from "./product-site-import-modal";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { ExportModal } from "@/components/shared/export-modal";
import { ImportModal } from "@/components/shared/import-modal";
import { productConfig } from "@/lib/import-export/entity-config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  MoreHorizontal,
  Download,
  Upload,
  Link2,
  Globe,
  Power,
  PowerOff,
  Trash2,
  SlidersHorizontal,
  Search,
  LayoutGrid,
  List,
} from "lucide-react";
import { ProductCardGrid } from "./product-card-grid";
import { useReactTable } from "@tanstack/react-table";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "All Products", filterKey: "ALL" },
  { value: "Supplement", filterKey: "SUPPLEMENT" },
  { value: "Apparel", filterKey: "APPAREL" },
  { value: "Accessory", filterKey: "ACCESSORY" },
] as const;

const STATUS_OPTIONS = [
  { value: "All Status", filterKey: "ALL" },
  { value: "Active", filterKey: "ACTIVE" },
  { value: "Inactive", filterKey: "INACTIVE" },
] as const;

export interface TierInfo {
  id: string;
  name: string;
  discountPercent: number;
  sortOrder: number;
}

export interface RedemptionRuleInfo {
  id: string;
  tierName: string;
  redemptionType: string;
  discountPercent: number;
  scopeType: string;
  scopeValue: string | null;
}

interface StatItem {
  label: string;
  value: string;
}

interface ProductTableProps {
  initialProducts: Product[];
  tiers: TierInfo[];
  stats: StatItem[];
  redemptionRules?: RedemptionRuleInfo[];
}

export function ProductTable({ initialProducts, tiers, stats, redemptionRules = [] }: ProductTableProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryValue, setCategoryValue] = useState<string>("All Products");
  const [statusValue, setStatusValue] = useState<string>("All Status");
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [showSiteImport, setShowSiteImport] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  const selectedTier = useMemo(
    () => tiers.find((t) => t.id === selectedTierId) ?? null,
    [tiers, selectedTierId]
  );

  const categoryFilter = CATEGORIES.find((c) => c.value === categoryValue)?.filterKey ?? "ALL";
  const statusFilter = STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredProducts = useMemo(() => {
    let filtered = products;
    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((p) => p.category === categoryFilter);
    }
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter((p) => p.isActive);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter((p) => !p.isActive);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [products, categoryFilter, statusFilter, search]);

  const refreshProducts = useCallback(async () => {
    const res = await fetch("/api/products");
    const json = await res.json();
    if (json.data) setProducts(json.data);
  }, []);

  const handleInlineUpdate = useCallback(
    async (id: string, field: string, value: number) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (res.ok) {
        await refreshProducts();
        toast.success("Updated");
      } else {
        toast.error("Failed to update");
      }
    },
    [refreshProducts]
  );

  const handleToggleActive = useCallback(
    async (product: Product) => {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !product.isActive }),
      });
      if (res.ok) {
        await refreshProducts();
        toast.success(product.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshProducts]
  );

  const handleDelete = useCallback(
    async (product: Product) => {
      if (!confirm(`Delete "${product.name}"?`)) return;
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== product.id));
        toast.success("Deleted");
      }
    },
    []
  );


  const handleBulkAction = useCallback(
    async (
      table: ReturnType<typeof useReactTable<Product>>,
      action: "activate" | "deactivate" | "delete"
    ) => {
      const ids = table
        .getFilteredSelectedRowModel()
        .rows.map((r) => r.original.id);
      if (!ids.length) return;

      if (action === "delete" && !confirm(`Delete ${ids.length} product${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) {
        return;
      }

      const res = await fetch("/api/products/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, action }),
      });
      if (res.ok) {
        table.toggleAllRowsSelected(false);
        if (action === "delete") {
          setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
        } else {
          await refreshProducts();
        }
        const label = action === "activate" ? "Activated" : action === "deactivate" ? "Deactivated" : "Deleted";
        toast.success(`${label} ${ids.length} product${ids.length === 1 ? "" : "s"}`);
      }
    },
    [refreshProducts]
  );

  const columns = useMemo(
    () =>
      getProductColumns({
        onOpen: (p) => router.push(`/admin/blocks/products/${p.id}`),
        onDelete: handleDelete,
        onToggleActive: handleToggleActive,
        onInlineUpdate: handleInlineUpdate,
        tiers,
        selectedTier,
        redemptionRules,
      }),
    [handleDelete, handleToggleActive, handleInlineUpdate, tiers, selectedTier, redemptionRules, router]
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your product catalog, pricing, and inventory.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => router.push("/admin/blocks/products/new")}>
              <Plus className="mr-1 h-3 w-3" />
              Add Product
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="outline" size="sm" />}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setShowUrlImport(true)}>
                  <Link2 className="mr-2 h-3.5 w-3.5" />
                  Import from URL
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowSiteImport(true)}>
                  <Globe className="mr-2 h-3.5 w-3.5" />
                  Import from Website
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowImport(true)}>
                  <Upload className="mr-2 h-3.5 w-3.5" />
                  Import from Spreadsheet
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowExport(true)}>
                  <Download className="mr-2 h-3.5 w-3.5" />
                  Export Spreadsheet
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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
            onValueChange={(val) => setCategoryValue(val ?? "All Products")}
          >
            <SelectTrigger className="w-auto min-w-[120px] text-sm shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.value}
                  {c.filterKey !== "ALL" && (
                    <span className="ml-1.5 text-muted-foreground">
                      ({products.filter((p) => p.category === c.filterKey).length})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tier dropdown */}
          {tiers.length > 0 && (
            <Select
              value={selectedTierId ? (tiers.find((t) => t.id === selectedTierId)?.name ?? "All Tiers") : "All Tiers"}
              onValueChange={(val) => {
                if (val === "All Tiers") {
                  setSelectedTierId(null);
                } else {
                  const tier = tiers.find((t) => t.name === val);
                  setSelectedTierId(tier?.id ?? null);
                }
              }}
            >
              <SelectTrigger className="w-auto min-w-[100px] text-sm shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All Tiers">All Tiers</SelectItem>
                {tiers.map((t) => (
                  <SelectItem key={t.id} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

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

          {/* Search bar — fills remaining space */}
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-20 text-sm w-full"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
              {filteredProducts.length} items
            </span>
          </div>

        </div>

        {/* Content */}
        {viewMode === "grid" ? (
          <ProductCardGrid
            products={filteredProducts}
            onOpen={(p) => router.push(`/admin/blocks/products/${p.id}`)}
          />
        ) : (
          <DataTable
            columns={columns}
            data={filteredProducts}
            enableRowSelection
            toolbar={(table) => (
              <>
                {/* Bulk actions (conditional) */}
                {table.getFilteredSelectedRowModel().rows.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleBulkAction(table, "activate")}
                    >
                      <Power className="mr-1 h-3 w-3" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      size="xs"
                      onClick={() => handleBulkAction(table, "deactivate")}
                    >
                      <PowerOff className="mr-1 h-3 w-3" />
                      Deactivate
                    </Button>
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
      </div>

      <ExportModal
        open={showExport}
        onOpenChange={setShowExport}
        entityConfig={productConfig}
      />

      <ImportModal
        open={showImport}
        onOpenChange={setShowImport}
        entityConfig={productConfig}
        onComplete={refreshProducts}
      />

      <ProductUrlImportModal
        open={showUrlImport}
        onOpenChange={setShowUrlImport}
        onComplete={refreshProducts}
      />

      <ProductSiteImportModal
        open={showSiteImport}
        onOpenChange={setShowSiteImport}
        onComplete={refreshProducts}
      />
      <BlockAgentPanel blockName="products" blockDisplayName="Products" />
    </>
  );
}
