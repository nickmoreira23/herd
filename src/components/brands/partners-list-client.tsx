"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Building2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef, BulkActionDef } from "@/components/shared/block-list-page";
import { getPartnerColumns, type PartnerWithAssignments } from "./partner-columns";
import { PartnerCardGrid } from "./partner-card-grid";
import { PARTNER_CATEGORIES } from "@/types";

interface PartnersListClientProps {
  initialPartners: PartnerWithAssignments[];
}

export function PartnersListClient({ initialPartners }: PartnersListClientProps) {
  const router = useRouter();
  const [partners, setPartners] = useState<PartnerWithAssignments[]>(initialPartners);

  // ── Data refresh ──────────────────────────────────────────────────
  const refresh = useCallback(async () => {
    const res = await fetch("/api/partners");
    const json = await res.json();
    if (json.data) setPartners(json.data);
  }, []);

  // ── Action handlers ───────────────────────────────────────────────
  const handleDelete = useCallback(
    async (partner: PartnerWithAssignments) => {
      if (!confirm(`Delete "${partner.name}"?`)) return;
      const res = await fetch(`/api/partners/${partner.id}`, { method: "DELETE" });
      if (res.ok) {
        setPartners((prev) => prev.filter((p) => p.id !== partner.id));
        toast.success("Deleted");
      }
    },
    [],
  );

  // ── Columns ───────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getPartnerColumns({
        onOpen: (p) => router.push(`/admin/blocks/partners/${p.id}`),
        onDelete: handleDelete,
      }),
    [handleDelete, router],
  );

  // ── Filters ───────────────────────────────────────────────────────
  const categoryOptions = useMemo(() => {
    const seen = new Set(partners.map((p) => p.category));
    return PARTNER_CATEGORIES.filter((c) => seen.has(c)).map((c) => ({ value: c, label: c }));
  }, [partners]);

  const filters: FilterDef<PartnerWithAssignments>[] = useMemo(
    () => [
      {
        key: "category",
        label: "All Categories",
        options: categoryOptions,
        filterFn: (item: PartnerWithAssignments, val: string) => item.category === val,
      },
      {
        key: "status",
        label: "All Statuses",
        options: [
          { value: "RESEARCHED", label: "Researched" },
          { value: "APPLIED", label: "Applied" },
          { value: "APPROVED", label: "Approved" },
          { value: "ACTIVE", label: "Active" },
          { value: "PAUSED", label: "Paused" },
        ],
        filterFn: (item: PartnerWithAssignments, val: string) => item.status === val,
      },
    ],
    [categoryOptions],
  );

  // ── Bulk actions ──────────────────────────────────────────────────
  const bulkActions: BulkActionDef[] = useMemo(
    () => [
      {
        key: "delete",
        label: "Delete",
        icon: Trash2,
        variant: "destructive" as const,
        handler: async (ids: string[]) => {
          if (
            !confirm(
              `Delete ${ids.length} partner${ids.length === 1 ? "" : "s"}? This cannot be undone.`,
            )
          )
            return;
          const res = await fetch("/api/partners/bulk", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids, action: "delete" }),
          });
          if (res.ok) {
            setPartners((prev) => prev.filter((p) => !ids.includes(p.id)));
            toast.success(
              `Deleted ${ids.length} partner${ids.length === 1 ? "" : "s"}`,
            );
          }
        },
      },
    ],
    [],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <BlockListPage<PartnerWithAssignments>
      blockName="partners"
      title="Partners"
      description="Manage affiliate partners, discounts, and commission programs."
      data={partners}
      getId={(p) => p.id}
      columns={columns}
      enableRowSelection
      searchPlaceholder="Search by name, benefit, or network..."
      searchFn={(item, q) =>
        item.name.toLowerCase().includes(q) ||
        (item.audienceBenefit?.toLowerCase().includes(q) ?? false) ||
        (item.affiliateNetwork?.toLowerCase().includes(q) ?? false)
      }
      filters={filters}
      bulkActions={bulkActions}
      additionalViews={[
        {
          type: "card",
          render: (data) => (
            <PartnerCardGrid
              partners={data}
              onOpen={(p) => router.push(`/admin/blocks/partners/${p.id}`)}
            />
          ),
        },
      ]}
      headerActions={
        <Button
          size="sm"
          onClick={() => router.push("/admin/blocks/partners/new")}
        >
          <Plus className="mr-1 h-3 w-3" />
          Add Partner
        </Button>
      }
      emptyIcon={Building2}
      emptyTitle="No partners yet"
      emptyDescription="Add affiliate partners, manage discounts, and configure commission programs."
      emptyAction={
        <Button
          variant="outline"
          onClick={() => router.push("/admin/blocks/partners/new")}
        >
          <Building2 className="mr-2 h-4 w-4" />
          Add your first partner
        </Button>
      }
      showAgent
    />
  );
}
