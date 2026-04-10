"use client";

import { useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/shared/data-table";
import { getDocumentColumns, type DocumentRow } from "./document-columns";
import { DocumentUploadModal } from "./document-upload-modal";
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

const CATEGORIES = [
  { value: "All Documents", filterKey: "ALL" },
  { value: "Contract", filterKey: "CONTRACT" },
  { value: "Terms", filterKey: "TERMS" },
  { value: "Presentation", filterKey: "PRESENTATION" },
  { value: "Policy", filterKey: "POLICY" },
  { value: "Other", filterKey: "OTHER" },
] as const;

const STATUS_OPTIONS = [
  { value: "All Status", filterKey: "ALL" },
  { value: "Active", filterKey: "ACTIVE" },
  { value: "Inactive", filterKey: "INACTIVE" },
] as const;

interface StatItem {
  label: string;
  value: string;
}

interface DocumentTableProps {
  initialDocuments: DocumentRow[];
  stats: StatItem[];
}

export function DocumentTable({ initialDocuments, stats }: DocumentTableProps) {
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments);
  const [search, setSearch] = useState("");
  const [categoryValue, setCategoryValue] = useState<string>("All Documents");
  const [statusValue, setStatusValue] = useState<string>("All Status");
  const [showUpload, setShowUpload] = useState(false);

  const categoryFilter = CATEGORIES.find((c) => c.value === categoryValue)?.filterKey ?? "ALL";
  const statusFilter = STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  const filteredDocuments = useMemo(() => {
    let filtered = documents;
    if (categoryFilter !== "ALL") {
      filtered = filtered.filter((d) => d.category === categoryFilter);
    }
    if (statusFilter === "ACTIVE") {
      filtered = filtered.filter((d) => d.isActive);
    } else if (statusFilter === "INACTIVE") {
      filtered = filtered.filter((d) => !d.isActive);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          d.fileName.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [documents, categoryFilter, statusFilter, search]);

  const refreshDocuments = useCallback(async () => {
    const res = await fetch("/api/documents");
    const json = await res.json();
    if (json.data) setDocuments(json.data);
  }, []);

  const handleView = useCallback((doc: DocumentRow) => {
    window.open(doc.fileUrl, "_blank");
  }, []);

  const handleDownload = useCallback((doc: DocumentRow) => {
    const a = document.createElement("a");
    a.href = doc.fileUrl;
    a.download = doc.fileName;
    a.click();
  }, []);

  const handleToggleActive = useCallback(
    async (doc: DocumentRow) => {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !doc.isActive }),
      });
      if (res.ok) {
        await refreshDocuments();
        toast.success(doc.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshDocuments]
  );

  const handleDelete = useCallback(
    async (doc: DocumentRow) => {
      if (!confirm(`Delete "${doc.name}"?`)) return;
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshDocuments();
        toast.success("Deleted");
      }
    },
    [refreshDocuments]
  );

  const columns = useMemo(
    () =>
      getDocumentColumns({
        onView: handleView,
        onDownload: handleDownload,
        onToggleActive: handleToggleActive,
        onDelete: handleDelete,
      }),
    [handleView, handleDownload, handleToggleActive, handleDelete]
  );

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Documents</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Upload and manage operational documents — contracts, terms, presentations, and more.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Plus className="mr-1 h-3 w-3" />
            Upload Document
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
          data={filteredDocuments}
          toolbar={() => (
            <div className="flex items-center gap-3">
              {/* Category dropdown */}
              <Select
                value={categoryValue}
                onValueChange={(val) => setCategoryValue(val ?? "All Documents")}
              >
                <SelectTrigger className="w-auto min-w-[130px] text-sm shrink-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.value}
                      {c.filterKey !== "ALL" && (
                        <span className="ml-1.5 text-muted-foreground">
                          ({documents.filter((d) => d.category === c.filterKey).length})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

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
                  placeholder="Search by name, description, or file..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-20 text-sm w-full"
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                  {filteredDocuments.length} items
                </span>
              </div>
            </div>
          )}
        />
      </div>

      <DocumentUploadModal
        open={showUpload}
        onOpenChange={setShowUpload}
        onComplete={refreshDocuments}
      />
    </>
  );
}
