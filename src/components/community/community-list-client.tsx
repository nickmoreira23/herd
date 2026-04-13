"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  Power,
  PowerOff,
  Trash2,
  MoreHorizontal,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef, BulkActionDef } from "@/components/shared/block-list-page";
import { getCommunityColumns } from "./community-columns";
import { CommunityCardGrid } from "./community-card-grid";
import { ExportModal } from "@/components/shared/export-modal";
import { ImportModal } from "@/components/shared/import-modal";
import { communityConfig } from "@/lib/import-export/entity-config";
import type { CommunityBenefit } from "@/types";

type BenefitWithCount = CommunityBenefit & {
  _count: { tierAssignments: number };
};

interface CommunityListClientProps {
  initialBenefits: BenefitWithCount[];
}

export function CommunityListClient({
  initialBenefits,
}: CommunityListClientProps) {
  const router = useRouter();
  const [benefits, setBenefits] =
    useState<BenefitWithCount[]>(initialBenefits);
  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);

  // ── Data refresh ──────────────────────────────────────────────────
  const refreshBenefits = useCallback(async () => {
    const res = await fetch("/api/community");
    const json = await res.json();
    if (json.data) setBenefits(json.data);
  }, []);

  // ── Action handlers ───────────────────────────────────────────────
  const handleDelete = useCallback(
    async (benefit: BenefitWithCount) => {
      if (!confirm(`Delete "${benefit.name}"?`)) return;
      const res = await fetch(`/api/community/${benefit.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setBenefits((prev) => prev.filter((b) => b.id !== benefit.id));
        toast.success("Deleted");
      }
    },
    [],
  );

  // ── Columns ───────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getCommunityColumns({
        onOpen: (b) => router.push(`/admin/blocks/community/${b.id}`),
        onDelete: handleDelete,
      }),
    [handleDelete, router],
  );

  // ── Filters ───────────────────────────────────────────────────────
  const filters: FilterDef<BenefitWithCount>[] = useMemo(
    () => [
      {
        key: "status",
        label: "All Statuses",
        options: [
          { value: "ACTIVE", label: "Active" },
          { value: "DRAFT", label: "Draft" },
          { value: "ARCHIVED", label: "Archived" },
        ],
        filterFn: (item: BenefitWithCount, val: string) =>
          item.status === val,
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
          const res = await fetch("/api/community/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, action: "activate" }),
          });
          if (res.ok) {
            await refreshBenefits();
            toast.success(
              `Activated ${ids.length} benefit${ids.length === 1 ? "" : "s"}`,
            );
          }
        },
      },
      {
        key: "deactivate",
        label: "Deactivate",
        icon: PowerOff,
        handler: async (ids: string[]) => {
          const res = await fetch("/api/community/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, action: "deactivate" }),
          });
          if (res.ok) {
            await refreshBenefits();
            toast.success(
              `Deactivated ${ids.length} benefit${ids.length === 1 ? "" : "s"}`,
            );
          }
        },
      },
      {
        key: "delete",
        label: "Delete",
        icon: Trash2,
        variant: "destructive" as const,
        handler: async (ids: string[]) => {
          if (
            !confirm(
              `Delete ${ids.length} benefit${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
            )
          )
            return;
          const res = await fetch("/api/community/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, action: "delete" }),
          });
          if (res.ok) {
            setBenefits((prev) => prev.filter((b) => !ids.includes(b.id)));
            toast.success(
              `Deleted ${ids.length} benefit${ids.length === 1 ? "" : "s"}`,
            );
          }
        },
      },
    ],
    [refreshBenefits],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <BlockListPage<BenefitWithCount>
      blockName="community"
      title="Community"
      description="Manage community benefits, platforms, and tier assignments."
      data={benefits}
      getId={(b) => b.id}
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
            <CommunityCardGrid
              benefits={data}
              onOpen={(b) =>
                router.push(`/admin/blocks/community/${b.id}`)
              }
            />
          ),
        },
      ]}
      headerActions={
        <>
          <Button
            size="sm"
            onClick={() => router.push("/admin/blocks/community/new")}
          >
            <Plus className="mr-1 h-3 w-3" />
            Add Benefit
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
      emptyIcon={Users}
      emptyTitle="No community benefits yet"
      emptyDescription="Create community benefits to offer exclusive access to platforms and events."
      emptyAction={
        <Button
          variant="outline"
          onClick={() => router.push("/admin/blocks/community/new")}
        >
          <Users className="mr-2 h-4 w-4" />
          Create your first benefit
        </Button>
      }
      modals={
        <>
          <ExportModal
            open={showExport}
            onOpenChange={setShowExport}
            entityConfig={communityConfig}
          />
          <ImportModal
            open={showImport}
            onOpenChange={setShowImport}
            entityConfig={communityConfig}
            onComplete={refreshBenefits}
          />
        </>
      }
    />
  );
}
