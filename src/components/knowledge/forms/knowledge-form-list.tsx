"use client";

import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { DataTable } from "@/components/shared/data-table";
import { getKnowledgeFormColumns } from "./knowledge-form-columns";
import { KnowledgeCreateFormModal } from "./knowledge-create-form-modal";
import { KnowledgeFormDeleteDialog } from "./knowledge-form-delete-dialog";
import { KnowledgeFormsEmpty } from "./knowledge-forms-empty";
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
import { toast } from "sonner";
import type { KnowledgeFormRow, KnowledgeFormStats } from "./types";
import { PageHeader } from "@/components/layout/page-header";
import { FormImportModal } from "./import/form-import-modal";

const STATUS_OPTIONS = [
  { value: "All Status", filterKey: "ALL" },
  { value: "Draft", filterKey: "DRAFT" },
  { value: "Active", filterKey: "ACTIVE" },
  { value: "Closed", filterKey: "CLOSED" },
] as const;

interface KnowledgeFormListProps {
  initialForms: KnowledgeFormRow[];
  initialStats: KnowledgeFormStats;
}

export function KnowledgeFormList({
  initialForms,
  initialStats,
}: KnowledgeFormListProps) {
  const router = useRouter();
  const [forms, setForms] = useState<KnowledgeFormRow[]>(initialForms);
  const [stats, setStats] = useState<KnowledgeFormStats>(initialStats);
  const [search, setSearch] = useState("");
  const [statusValue, setStatusValue] = useState("All Status");
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeFormRow | null>(null);
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
    const res = await fetch("/api/knowledge/forms");
    const json = await res.json();
    if (json.data) {
      setForms(json.data.forms);
      setStats(json.data.stats);
    }
  }, []);

  const handleOpen = useCallback(
    (form: KnowledgeFormRow) => {
      router.push(`/admin/organization/knowledge/forms/${form.id}`);
    },
    [router]
  );

  const handleCopyLink = useCallback((form: KnowledgeFormRow) => {
    const url = `${window.location.origin}/f/${form.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied to clipboard");
  }, []);

  const handleDelete = useCallback(
    async (form: KnowledgeFormRow) => {
      const res = await fetch(`/api/knowledge/forms/${form.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshForms();
        toast.success("Form deleted");
      } else {
        toast.error("Failed to delete form");
      }
      setDeleteTarget(null);
    },
    [refreshForms]
  );

  const handleCreated = useCallback(
    (formId?: string) => {
      if (formId) {
        router.push(`/admin/organization/knowledge/forms/${formId}`);
      } else {
        refreshForms();
      }
    },
    [router, refreshForms]
  );

  const columns = useMemo(
    () =>
      getKnowledgeFormColumns({
        onOpen: handleOpen,
        onCopyLink: handleCopyLink,
        onDelete: (form) => setDeleteTarget(form),
      }),
    [handleOpen, handleCopyLink]
  );

  if (forms.length === 0) {
    return (
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title="Forms"
          description="Intake forms, surveys, and structured data collection templates."
          className="pl-0 pt-0"
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
                <Upload className="mr-1 h-3 w-3" />
                Import
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1 h-3 w-3" />
                Create Form
              </Button>
            </div>
          }
        />
        <KnowledgeFormsEmpty onCreateClick={() => setShowCreate(true)} />
        <KnowledgeCreateFormModal
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
          title="Forms"
          description="Intake forms, surveys, and structured data collection templates."
          className="pl-0 pt-0"
          action={
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={() => setShowImport(true)}>
                <Upload className="mr-1 h-3 w-3" />
                Import
              </Button>
              <Button size="sm" onClick={() => setShowCreate(true)}>
                <Plus className="mr-1 h-3 w-3" />
                Create Form
              </Button>
            </div>
          }
        />

        {/* Stats */}
        <div className="flex items-center gap-4 mb-6">
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">Total</p>
            <p className="text-lg font-bold tabular-nums">{stats.total}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">Active</p>
            <p className="text-lg font-bold tabular-nums">{stats.active}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">Draft</p>
            <p className="text-lg font-bold tabular-nums">{stats.draft}</p>
          </div>
          <div className="rounded-lg border bg-card px-5 py-3 min-w-0">
            <p className="text-xs text-muted-foreground whitespace-nowrap">
              Total Responses
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
                  onValueChange={(val) => setStatusValue(val ?? "All Status")}
                >
                  <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs shrink-0">
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

                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or description..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {filteredForms.length} items
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <KnowledgeCreateFormModal
        open={showCreate}
        onOpenChange={setShowCreate}
        onComplete={handleCreated}
      />

      <KnowledgeFormDeleteDialog
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
