"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types";
import { getProductColumns } from "./product-columns";
import { ProductUrlImportModal } from "./product-url-import-modal";
import { ProductSiteImportModal } from "./product-site-import-modal";
import { ExportModal } from "@/components/shared/export-modal";
import { ImportModal } from "@/components/shared/import-modal";
import { productConfig } from "@/lib/import-export/entity-config";
import { BlockListPage } from "@/components/shared/block-list-page";
import type {
  FilterDef,
  StatCard,
  BulkActionDef,
} from "@/components/shared/block-list-page/types";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  MoreHorizontal,
  Download,
  Upload,
  Link2,
  Globe,
  Package,
  Power,
  PowerOff,
  Trash2,
} from "lucide-react";
import { ProductCardGrid } from "./product-card-grid";
import { toast } from "sonner";

// ─── Types ───────────────────────────────────────────────────────────

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

interface ProductsListClientProps {
  initialProducts: Product[];
  tiers: TierInfo[];
  stats: StatCard[];
  redemptionRules?: RedemptionRuleInfo[];
}

// ─── Component ───────────────────────────────────────────────────────

export function ProductsListClient({
  initialProducts,
  tiers,
  stats,
  redemptionRules = [],
}: ProductsListClientProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showUrlImport, setShowUrlImport] = useState(false);
  const [showSiteImport, setShowSiteImport] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);

  const selectedTier = useMemo(
    () => tiers.find((t) => t.id === selectedTierId) ?? null,
    [tiers, selectedTierId],
  );

  // ── Data handlers ─────────────────────────────────────────────────

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
    [refreshProducts],
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
    [refreshProducts],
  );

  const handleDelete = useCallback(async (product: Product) => {
    if (!confirm(`Delete "${product.name}"?`)) return;
    const res = await fetch(`/api/products/${product.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
      toast.success("Deleted");
    }
  }, []);

  // ── Columns (depend on tier selection) ────────────────────────────

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
    [
      handleDelete,
      handleToggleActive,
      handleInlineUpdate,
      tiers,
      selectedTier,
      redemptionRules,
      router,
    ],
  );

  // ── Filters ───────────────────────────────────────────────────────

  const filters: FilterDef<Product>[] = [
    {
      key: "category",
      label: "All Products",
      options: [
        {
          value: "SUPPLEMENT",
          label: `Supplement (${products.filter((p) => p.category === "SUPPLEMENT").length})`,
        },
        {
          value: "APPAREL",
          label: `Apparel (${products.filter((p) => p.category === "APPAREL").length})`,
        },
        {
          value: "ACCESSORY",
          label: `Accessory (${products.filter((p) => p.category === "ACCESSORY").length})`,
        },
      ],
      filterFn: (item, value) => item.category === value,
    },
    {
      key: "status",
      label: "All Status",
      options: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
      filterFn: (item, value) =>
        value === "active" ? item.isActive : !item.isActive,
    },
  ];

  // ── Bulk actions ──────────────────────────────────────────────────

  const bulkActions: BulkActionDef[] = [
    {
      key: "activate",
      label: "Activate",
      icon: Power,
      handler: async (ids) => {
        const res = await fetch("/api/products/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action: "activate" }),
        });
        if (res.ok) {
          await refreshProducts();
          toast.success(
            `Activated ${ids.length} product${ids.length === 1 ? "" : "s"}`,
          );
        }
      },
    },
    {
      key: "deactivate",
      label: "Deactivate",
      icon: PowerOff,
      handler: async (ids) => {
        const res = await fetch("/api/products/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action: "deactivate" }),
        });
        if (res.ok) {
          await refreshProducts();
          toast.success(
            `Deactivated ${ids.length} product${ids.length === 1 ? "" : "s"}`,
          );
        }
      },
    },
    {
      key: "delete",
      label: "Delete",
      icon: Trash2,
      variant: "destructive",
      handler: async (ids) => {
        if (
          !confirm(
            `Delete ${ids.length} product${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
          )
        )
          return;
        const res = await fetch("/api/products/bulk", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids, action: "delete" }),
        });
        if (res.ok) {
          setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
          toast.success(
            `Deleted ${ids.length} product${ids.length === 1 ? "" : "s"}`,
          );
        }
      },
    },
  ];

  // ── Tier selector (toolbar extra) ─────────────────────────────────

  const tierSelector =
    tiers.length > 0 ? (
      <Select
        value={selectedTierId ?? "all"}
        onValueChange={(val) =>
          setSelectedTierId(val === "all" ? null : val)
        }
      >
        <SelectTrigger className="h-9 w-auto min-w-[8rem] text-sm">
          <SelectValue placeholder="All Tiers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Tiers</SelectItem>
          {tiers.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    ) : null;

  // ── Header actions ────────────────────────────────────────────────

  const headerActions = (
    <>
      <Button
        size="sm"
        onClick={() => router.push("/admin/blocks/products/new")}
      >
        <Plus className="mr-1 h-3 w-3" />
        Add Product
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
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
    </>
  );

  // ── Modals ────────────────────────────────────────────────────────

  const modals = (
    <>
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
    </>
  );

  // ── Render ────────────────────────────────────────────────────────

  return (
    <BlockListPage<Product>
      blockName="products"
      title="Products"
      description="Manage your product catalog, pricing, and inventory."
      data={products}
      getId={(p) => p.id}
      columns={columns}
      enableRowSelection
      onRowClick={(p) => router.push(`/admin/blocks/products/${p.id}`)}
      searchPlaceholder="Search by name or SKU..."
      searchFn={(p, q) =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      }
      filters={filters}
      stats={stats}
      additionalViews={[
        {
          type: "card",
          render: (data) => (
            <ProductCardGrid
              products={data}
              onOpen={(p) => router.push(`/admin/blocks/products/${p.id}`)}
            />
          ),
        },
      ]}
      headerActions={headerActions}
      bulkActions={bulkActions}
      toolbarExtras={tierSelector}
      emptyIcon={Package}
      emptyTitle="No products found"
      emptyDescription="Add your first product or import from a spreadsheet."
      modals={modals}
    />
  );
}
