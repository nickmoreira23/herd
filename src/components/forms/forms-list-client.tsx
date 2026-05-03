"use client";

/**
 * Blocks route surface for FORM listing.
 *
 * Coexists with src/components/forms/form-list.tsx (or
 * Knowledge route surface). Both share fetch + columns + handlers +
 * stats logic but use different chrome wrappers:
 * - This file: BlockListPage shell (unified chrome).
 * - form-list.tsx: DataTable + inline chrome.
 *
 * Architectural decision (1.5.6e): kept separate. Extracting a shared
 * useBlockListing() hook is feasible but deferred — Surface (top-level
 * feature post-Phase 1.5) may redefine how blocks are exposed across
 * routes, potentially making this pattern obsolete. Revisit after
 * Surface is built.
 *
 * See: docs/discovery/KNOWLEDGE_ROUTE_LAYER_AUDIT.md
 */

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
import type { FormRow, FormStats } from "./types";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

interface FormsListClientProps {
  initialForms: FormRow[];
  initialStats: FormStats;
}

export function FormsListClient({
  initialForms,
  initialStats,
}: FormsListClientProps) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
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
    router.push(`/admin/knowledge/forms/${form.id}`);
  }, [router]);

  const handleDelete = useCallback(async (form: FormRow) => {
    const res = await fetch(`/api/forms/${form.id}`, { method: "DELETE" });
    if (res.ok) {
      await refreshForms();
      notifySuccess("forms.feedback.form_deleted", t);
    } else {
      notifyError("error.forms.delete_failed", t);
    }
    setDeleteTarget(null);
  }, [refreshForms, t]);

  const handleCreated = useCallback((formId?: string) => {
    if (formId) {
      router.push(`/admin/knowledge/forms/${formId}`);
    } else {
      refreshForms();
    }
  }, [router, refreshForms]);

  const columns = useMemo(
    () => getFormColumns({
      onOpen: handleOpen,
      onDelete: (form) => setDeleteTarget(form),
      t,
      locale,
    }),
    [handleOpen, t, locale]
  );

  // Stats
  const statCards: StatCard[] = [
    { label: t("forms.list.stats.total"), value: String(stats.total) },
    { label: t("forms.list.stats.active"), value: String(stats.active) },
    { label: t("forms.list.stats.draft"), value: String(stats.draft) },
    { label: t("forms.list.stats.total_responses"), value: String(stats.totalResponses) },
  ];

  // Filters
  const filters: FilterDef<FormRow>[] = [
    {
      key: "formStatus",
      label: t("forms.list.filter.all_status"),
      options: [
        { value: "DRAFT", label: t("forms.statuses.DRAFT.label") },
        { value: "ACTIVE", label: t("forms.statuses.ACTIVE.label") },
        { value: "CLOSED", label: t("forms.statuses.CLOSED.label") },
      ],
      filterFn: (item, value) => item.formStatus === value,
    },
  ];

  // Header actions
  const headerActions = (
    <>
      <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
        <Upload className="mr-1 h-3 w-3" />
        {t("forms.list.import")}
      </Button>
      <Button size="sm" onClick={() => setShowCreate(true)}>
        <Plus className="mr-1 h-3 w-3" />
        {t("forms.list.create_form")}
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
      title={t("forms.list.title")}
      description={t("forms.list.description")}
      data={forms}
      getId={(f) => f.id}
      columns={columns}
      onRowClick={handleOpen}
      searchPlaceholder={t("forms.list.search_placeholder")}
      searchFn={(f, q) => f.name.toLowerCase().includes(q) || (f.description?.toLowerCase().includes(q) ?? false)}
      filters={filters}
      stats={statCards}
      headerActions={headerActions}
      emptyIcon={ClipboardList}
      emptyTitle={t("forms.empty.title")}
      emptyDescription={t("forms.empty.list_description")}
      modals={modals}
      showAgent={false}
    />
  );
}
