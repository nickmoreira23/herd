"use client";

/**
 * Knowledge route surface for FORM listing.
 *
 * Coexists with src/components/forms/forms-list-client.tsx (Blocks
 * route surface). Both share fetch + columns + handlers + stats logic
 * but use different chrome wrappers:
 * - This file: DataTable + inline chrome (PageHeader, search, filters).
 * - forms-list-client.tsx: BlockListPage shell (unified chrome).
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
import { DataTable } from "@/components/shared/data-table";
import { getFormColumns } from "./form-columns";
import { CreateFormModal } from "./create-form-modal";
import { FormDeleteDialog } from "./form-delete-dialog";
import { FormsEmpty } from "./forms-empty";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, SlidersHorizontal, Upload } from "lucide-react";
import type { FormRow, FormStats } from "./types";
import type { MessageKey } from "@/lib/i18n/messages/pt-BR";
import { PageHeader } from "@/components/layout/page-header";
import { FormImportModal } from "./import/form-import-modal";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifySuccess, notifyError } from "@/lib/i18n/notify";

const STATUS_OPTIONS: ReadonlyArray<{
  value: string;
  filterKey: "ALL" | "DRAFT" | "ACTIVE" | "CLOSED";
  labelKey: MessageKey;
}> = [
  { value: "ALL", filterKey: "ALL", labelKey: "forms.list.filter.all_status" },
  { value: "DRAFT", filterKey: "DRAFT", labelKey: "forms.statuses.DRAFT.label" },
  { value: "ACTIVE", filterKey: "ACTIVE", labelKey: "forms.statuses.ACTIVE.label" },
  { value: "CLOSED", filterKey: "CLOSED", labelKey: "forms.statuses.CLOSED.label" },
];

interface FormListProps {
  initialForms: FormRow[];
  initialStats: FormStats;
}

export function FormList({
  initialForms,
  initialStats,
}: FormListProps) {
  const router = useRouter();
  const t = useT();
  const locale = useLocale();
  const [forms, setForms] = useState<FormRow[]>(initialForms);
  const [stats, setStats] = useState<FormStats>(initialStats);
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState<string>("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FormRow | null>(null);
  const [showImport, setShowImport] = useState(false);

  const statusFilter =
    STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredForms = useMemo(() => {
    let filtered = forms;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((f) => f.formStatus === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.description && f.description.toLowerCase().includes(q))
      );
    }
    return filtered;
  }, [forms, statusFilter, search]);

  const refreshForms = useCallback(async () => {
    const res = await fetch("/api/forms");
    const json = await res.json();
    if (json.data) {
      setForms(json.data.forms);
      setStats(json.data.stats);
    }
  }, []);

  const handleOpen = useCallback(
    (form: FormRow) => {
      router.push(`/admin/knowledge/forms/${form.id}`);
    },
    [router]
  );

  const handleDelete = useCallback(
    async (form: FormRow) => {
      const res = await fetch(`/api/forms/${form.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshForms();
        notifySuccess("forms.feedback.form_deleted", t);
      } else {
        notifyError("error.forms.delete_failed", t);
      }
      setDeleteTarget(null);
    },
    [refreshForms, t]
  );

  const handleCreated = useCallback(
    (formId?: string) => {
      if (formId) {
        router.push(`/admin/knowledge/forms/${formId}`);
      } else {
        refreshForms();
      }
    },
    [router, refreshForms]
  );

  const columns = useMemo(
    () =>
      getFormColumns({
        onOpen: handleOpen,
        onDelete: (form) => setDeleteTarget(form),
        t,
        locale,
      }),
    [handleOpen, t, locale]
  );

  if (forms.length === 0) {
    return (
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("forms.list.title")}
          description={t("forms.list.description")}
          className="pl-0 pt-0"
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
                <Upload className="mr-1 h-3 w-3" />
                {t("forms.list.import")}
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1 h-3 w-3" />
                {t("forms.list.create_form")}
              </Button>
            </div>
          }
        />
        <FormsEmpty onCreateClick={() => setShowCreate(true)} />
        <CreateFormModal
          open={showCreate}
          onOpenChange={setShowCreate}
          onComplete={handleCreated}
        />
        <FormImportModal
          open={showImport}
          onOpenChange={setShowImport}
          onImported={handleCreated}
        />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("forms.list.title")}
          description={t("forms.list.description")}
          className="pl-0 pt-0"
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
                <Upload className="mr-1 h-3 w-3" />
                {t("forms.list.import")}
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1 h-3 w-3" />
                {t("forms.list.create_form")}
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("forms.list.stats.total")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("forms.list.stats.active")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.active}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("forms.list.stats.draft")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.draft}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              {t("forms.list.stats.total_responses")}
            </p>
            <p className="text-lg font-bold tabular-nums">{stats.totalResponses}</p>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1">
          <DataTable
            columns={columns}
            data={filteredForms}
            toolbar={() => (
              <div className="flex items-center gap-3">
                <Select
                  value={statusValue}
                  onValueChange={(val) => setStatusValue(val ?? "ALL")}
                >
                  <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs shrink-0">
                    <SlidersHorizontal className="mr-1.5 h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {t(s.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("forms.list.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {t("forms.list.items_count", { count: filteredForms.length })}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <CreateFormModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onComplete={handleCreated}
      />

      <FormDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        formName={deleteTarget?.name ?? ""}
        onConfirm={() => deleteTarget && handleDelete(deleteTarget)}
      />

      <FormImportModal
        open={showImport}
        onOpenChange={setShowImport}
        onImported={handleCreated}
      />
    </>
  );
}
