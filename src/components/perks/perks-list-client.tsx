"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Gift, Plus, Power, PowerOff, Trash2, MoreHorizontal, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef, BulkActionDef } from "@/components/shared/block-list-page";
import { getPerkColumns } from "./perk-columns";
import { PerkCardGrid } from "./perk-card-grid";
import { ExportModal } from "@/components/shared/export-modal";
import { ImportModal } from "@/components/shared/import-modal";
import { perkConfig } from "@/lib/import-export/entity-config";
import type { Perk } from "@/types";

type PerkWithCount = Perk & { _count: { tierAssignments: number } };

interface PerksListClientProps {
  initialPerks: PerkWithCount[];
}

export function PerksListClient({ initialPerks }: PerksListClientProps) {
  const router = useRouter();
  const [perks, setPerks] = useState<PerkWithCount[]>(initialPerks);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // ── Data refresh ──────────────────────────────────────────────────
  const refreshPerks = useCallback(async () => {
    const res = await fetch("/api/perks");
    const json = await res.json();
    if (json.data) setPerks(json.data);
  }, []);

  // ── Action handlers ───────────────────────────────────────────────
  const handleDelete = useCallback(
    async (perk: PerkWithCount) => {
      if (!confirm(`Delete "${perk.name}"?`)) return;
      const res = await fetch(`/api/perks/${perk.id}`, { method: "DELETE" });
      if (res.ok) {
        setPerks((prev) => prev.filter((p) => p.id !== perk.id));
        toast.success("Deleted");
      }
    },
    [],
  );

  // ── Columns ───────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getPerkColumns({
        onOpen: (p) => router.push(`/admin/blocks/perks/${p.id}`),
        onDelete: handleDelete,
      }),
    [handleDelete, router],
  );

  // ── Filters ───────────────────────────────────────────────────────
  const filters: FilterDef<PerkWithCount>[] = useMemo(
    () => [
      {
        key: "status",
        label: "All Statuses",
        options: [
          { value: "ACTIVE", label: "Active" },
          { value: "DRAFT", label: "Draft" },
          { value: "ARCHIVED", label: "Archived" },
        ],
        filterFn: (item: PerkWithCount, val: string) => item.status === val,
      },
    ],
    [],
  );

  // ── Bulk actions ──────────────────────────────────────────────────
  const bulkActions: BulkActionDef[] = useMemo(
    () => [
      {
        key: "activate",
        label: "Activate",
        icon: Power,
        handler: async (ids: string[]) => {
          const res = await fetch("/api/perks/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, action: "activate" }),
          });
          if (res.ok) {
            await refreshPerks();
            toast.success(`Activated ${ids.length} perk${ids.length === 1 ? "" : "s"}`);
          }
        },
      },
      {
        key: "deactivate",
        label: "Deactivate",
        icon: PowerOff,
        handler: async (ids: string[]) => {
          const res = await fetch("/api/perks/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, action: "deactivate" }),
          });
          if (res.ok) {
            await refreshPerks();
            toast.success(`Deactivated ${ids.length} perk${ids.length === 1 ? "" : "s"}`);
          }
        },
      },
      {
        key: "delete",
        label: "Delete",
        icon: Trash2,
        variant: "destructive",
        handler: async (ids: string[]) => {
          if (!confirm(`Delete ${ids.length} perk${ids.length === 1 ? "" : "s"}? This cannot be undone.`)) return;
          const res = await fetch("/api/perks/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, action: "delete" }),
          });
          if (res.ok) {
            setPerks((prev) => prev.filter((p) => !ids.includes(p.id)));
            toast.success(`Deleted ${ids.length} perk${ids.length === 1 ? "" : "s"}`);
          }
        },
      },
    ],
    [refreshPerks],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <BlockListPage<PerkWithCount>
      blockName="perks"
      title="Perks"
      description="Manage perks and their tier assignments."
      data={perks}
      getId={(p) => p.id}
      columns={columns}
      enableRowSelection
      searchPlaceholder="Search by name, key, or description..."
      searchFn={(item, q) =>
        item.name.toLowerCase().includes(q) ||
        item.key.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false)
      }
      filters={filters}
      bulkActions={bulkActions}
      additionalViews={[
        {
          type: "card",
          render: (data) => (
            <PerkCardGrid
              perks={data}
              onOpen={(p) => router.push(`/admin/blocks/perks/${p.id}`)}
            />
          ),
        },
      ]}
      headerActions={
        <>
          <Button size="sm" onClick={() => router.push("/admin/blocks/perks/new")}>
            <Plus className="mr-1 h-3 w-3" />
            Add Perk
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" size="sm" />}>
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={() => setShowImport(true)}>
                <Upload className="mr-2 h-3.5 w-3.5" />
                Import Spreadsheet
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowExport(true)}>
                <Download className="mr-2 h-3.5 w-3.5" />
                Export Spreadsheet
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      }
      emptyIcon={Gift}
      emptyTitle="No perks yet"
      emptyDescription="Create perks to offer exclusive benefits tied to subscription tiers."
      emptyAction={
        <Button variant="outline" onClick={() => router.push("/admin/blocks/perks/new")}>
          <Gift className="mr-2 h-4 w-4" />
          Add your first perk
        </Button>
      }
      modals={
        <>
          <ExportModal
            open={showExport}
            onOpenChange={setShowExport}
            entityConfig={perkConfig}
          />
          <ImportModal
            open={showImport}
            onOpenChange={setShowImport}
            entityConfig={perkConfig}
            onComplete={refreshPerks}
          />
        </>
      }
    />
  );
}
