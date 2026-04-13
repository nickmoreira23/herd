"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getFormColumns } from "./form-columns";
import { CreateFormModal } from "./create-form-modal";
import { FormDeleteDialog } from "./form-delete-dialog";
import { FormImportModal } from "./import/form-import-modal";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef, StatCard } from "@/components/shared/block-list-page/types";
import { Button } from "@/components/ui/button";
import { Plus, Upload, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import type { FormRow, FormStats } from "./types";

interface FormsListClientProps {
  initialForms: FormRow[];
  initialStats: FormStats;
}

export function FormsListClient({
  initialForms,
  initialStats,
}: FormsListClientProps) {
  const router = useRouter();
  const [forms, setForms] = useState<FormRow[]>(initialForms);
  const [stats, setStats] = useState<FormStats>(initialStats);
  const [showCreate, setShowCreate] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormRow | null>(null);

  const refreshForms = useCallback(async () => {
    const res = await fetch("/api/forms");
    const json = await res.json();
    if (json.data) {
      setForms(json.data.forms);
      setStats(json.data.stats);
    }
  }, []);

  const handleOpen = useCallback((form: FormRow) => {
    router.push(`/admin/organization/knowledge/forms/${form.id}`);
  }, [router]);

  const handleCopyLink = useCallback((form: FormRow) => {
    const url = `${window.location.origin}/f/${form.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  }, []);

  const handleDelete = useCallback(async (form: FormRow) => {
    const res = await fetch(`/api/forms/${form.id}`, { method: "DELETE" });
    if (res.ok) {
      await refreshForms();
      toast.success("Form deleted");
    } else {
      toast.error("Failed to delete form");
    }
    setDeleteTarget(null);
  }, [refreshForms]);

  const handleCreated = useCallback((formId?: string) => {
    if (formId) {
      router.push(`/admin/organization/knowledge/forms/${formId}`);
    } else {
      refreshForms();
    }
  }, [router, refreshForms]);

  const columns = useMemo(
    () => getFormColumns({
      onOpen: handleOpen,
      onCopyLink: handleCopyLink,
      onDelete: (form) => setDeleteTarget(form),
    }),
    [handleOpen, handleCopyLink]
  );

  // Stats
  const statCards: StatCard[] = [
    { label: "Total", value: String(stats.total) },
    { label: "Active", value: String(stats.active) },
    { label: "Draft", value: String(stats.draft) },
    { label: "Total Responses", value: String(stats.totalResponses) },
  ];

  // Filters
  const filters: FilterDef<FormRow>[] = [
    {
      key: "formStatus",
      label: "All Status",
      options: [
        { value: "DRAFT", label: "Draft" },
        { value: "ACTIVE", label: "Active" },
        { value: "CLOSED", label: "Closed" },
      ],
      filterFn: (item, value) => item.formStatus === value,
    },
  ];

  // Header actions
  const headerActions = (
    <>
      <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
        <Upload className="mr-1 h-3 w-3" />
        Import
      </Button>
      <Button size="sm" onClick={() => setShowCreate(true)}>
        <Plus className="mr-1 h-3 w-3" />
        Create Form
      </Button>
    </>
  );

  // Modals
  const modals = (
    <>
      <CreateFormModal open={showCreate} onOpenChange={setShowCreate} onComplete={handleCreated} />
      <FormDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null); }}
        formName={deleteTarget?.name ?? ""}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />
      <FormImportModal open={showImport} onOpenChange={setShowImport} onImported={handleCreated} />
    </>
  );

  return (
    <BlockListPage<FormRow>
      blockName="forms"
      title="Forms"
      description="Intake forms, surveys, and structured data collection templates."
      data={forms}
      getId={(f) => f.id}
      columns={columns}
      onRowClick={handleOpen}
      searchPlaceholder="Search by name or description..."
      searchFn={(f, q) => f.name.toLowerCase().includes(q) || (f.description?.toLowerCase().includes(q) ?? false)}
      filters={filters}
      stats={statCards}
      headerActions={headerActions}
      emptyIcon={ClipboardList}
      emptyTitle="No forms yet"
      emptyDescription="Create a form or import from an external service."
      modals={modals}
      showAgent={false}
    />
  );
}
