"use client";

import { useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/shared/data-table";
import { getKnowledgeDocumentColumns } from "./knowledge-document-columns";
import { KnowledgeUploadModal } from "./knowledge-upload-modal";
import { KnowledgeDeleteDialog } from "./knowledge-delete-dialog";
import { KnowledgeDocumentViewer } from "./knowledge-document-viewer";
import { KnowledgeFolderDialog } from "./knowledge-folder-dialog";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Search,
  SlidersHorizontal,
  Folder,
  FolderOpen,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  Upload,
  FolderPlus,
} from "lucide-react";
import { toast } from "sonner";
import type { KnowledgeDocumentRow, KnowledgeFolderRow } from "./types";
import { PageHeader } from "@/components/layout/page-header";

const FILE_TYPE_OPTIONS = [
  { value: "All Types", filterKey: "ALL" },
  { value: "PDF", filterKey: "PDF" },
  { value: "DOCX", filterKey: "DOCX" },
  { value: "TXT", filterKey: "TXT" },
  { value: "MD", filterKey: "MD" },
  { value: "CSV", filterKey: "CSV" },
] as const;

const STATUS_OPTIONS = [
  { value: "All Status", filterKey: "ALL" },
  { value: "Pending", filterKey: "PENDING" },
  { value: "Processing", filterKey: "PROCESSING" },
  { value: "Ready", filterKey: "READY" },
  { value: "Error", filterKey: "ERROR" },
] as const;

interface KnowledgeDocumentTableProps {
  initialDocuments: KnowledgeDocumentRow[];
  initialFolders: KnowledgeFolderRow[];
}

export function KnowledgeDocumentTable({
  initialDocuments,
  initialFolders,
}: KnowledgeDocumentTableProps) {
  const [documents, setDocuments] = useState<KnowledgeDocumentRow[]>(initialDocuments);
  const [folders, setFolders] = useState<KnowledgeFolderRow[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fileTypeValue, setFileTypeValue] = useState("All Types");
  const [statusValue, setStatusValue] = useState("All Status");
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<KnowledgeFolderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeDocumentRow | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<KnowledgeFolderRow | null>(null);
  const [viewerDoc, setViewerDoc] = useState<KnowledgeDocumentRow | null>(null);

  const fileTypeFilter = FILE_TYPE_OPTIONS.find((f) => f.value === fileTypeValue)?.filterKey ?? "ALL";
  const statusFilter = STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

  // Build breadcrumb path
  const breadcrumbs = useMemo(() => {
    const path: KnowledgeFolderRow[] = [];
    let id = currentFolderId;
    while (id) {
      const folder = folders.find((f) => f.id === id);
      if (!folder) break;
      path.unshift(folder);
      id = folder.parentId;
    }
    return path;
  }, [currentFolderId, folders]);

  // Folders in current view
  const currentFolders = useMemo(
    () => folders.filter((f) => f.parentId === currentFolderId),
    [folders, currentFolderId]
  );

  // Documents in current folder (or root if no folder selected)
  const currentDocuments = useMemo(() => {
    let filtered = documents.filter((d) => d.folderId === currentFolderId);

    if (fileTypeFilter !== "ALL") {
      filtered = filtered.filter((d) => d.fileType === fileTypeFilter);
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((d) => d.status === statusFilter);
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
  }, [documents, currentFolderId, fileTypeFilter, statusFilter, search]);

  // When searching, show all documents matching (across all folders)
  const searchResults = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    let filtered = documents.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q)) ||
        d.fileName.toLowerCase().includes(q)
    );
    if (fileTypeFilter !== "ALL") {
      filtered = filtered.filter((d) => d.fileType === fileTypeFilter);
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }
    return filtered;
  }, [documents, search, fileTypeFilter, statusFilter]);

  const refreshData = useCallback(async () => {
    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch("/api/knowledge/documents"),
        fetch("/api/knowledge/folders?type=DOCUMENT"),
      ]);
      if (docsRes.ok) {
        const docsJson = await docsRes.json();
        if (docsJson.data) setDocuments(docsJson.data.documents);
      }
      if (foldersRes.ok) {
        const foldersJson = await foldersRes.json();
        if (foldersJson.data) setFolders(foldersJson.data);
      }
    } catch (err) {
      console.error("[Knowledge] Failed to refresh data:", err);
    }
  }, []);

  const handleView = useCallback((doc: KnowledgeDocumentRow) => {
    setViewerDoc(doc);
  }, []);

  const handleDownload = useCallback((doc: KnowledgeDocumentRow) => {
    const a = document.createElement("a");
    a.href = doc.fileUrl;
    a.download = doc.fileName;
    a.click();
  }, []);

  const handleToggleActive = useCallback(
    async (doc: KnowledgeDocumentRow) => {
      const res = await fetch(`/api/knowledge/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !doc.isActive }),
      });
      if (res.ok) {
        await refreshData();
        toast.success(doc.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshData]
  );

  const handleDeleteDoc = useCallback(
    async (doc: KnowledgeDocumentRow) => {
      const res = await fetch(`/api/knowledge/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshData();
        toast.success("Document deleted");
      } else {
        toast.error("Failed to delete document");
      }
      setDeleteTarget(null);
    },
    [refreshData]
  );

  const handleDeleteFolder = useCallback(
    async (folder: KnowledgeFolderRow) => {
      const res = await fetch(`/api/knowledge/folders/${folder.id}`, { method: "DELETE" });
      if (res.ok) {
        // If we were inside the deleted folder, go to root
        if (currentFolderId === folder.id) {
          setCurrentFolderId(folder.parentId);
        }
        await refreshData();
        toast.success("Folder deleted");
      } else {
        const err = await res.json().catch(() => null);
        toast.error(err?.error || "Failed to delete folder");
      }
      setDeleteFolderTarget(null);
    },
    [refreshData, currentFolderId]
  );

  const handleMoveToFolder = useCallback(
    async (doc: KnowledgeDocumentRow, folderId: string | null) => {
      const res = await fetch(`/api/knowledge/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        await refreshData();
        toast.success(folderId ? "Moved to folder" : "Moved to root");
      }
    },
    [refreshData]
  );

  const columns = useMemo(
    () =>
      getKnowledgeDocumentColumns({
        onView: handleView,
        onDownload: handleDownload,
        onToggleActive: handleToggleActive,
        onDelete: (doc) => setDeleteTarget(doc),
        folders: folders,
        onMoveToFolder: handleMoveToFolder,
      }),
    [handleView, handleDownload, handleToggleActive, folders, handleMoveToFolder]
  );

  const displayDocs = searchResults ?? currentDocuments;

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title="Documents"
          description="Guides, policies, SOPs, and reference materials for your team and partners."
          className="pl-0 pt-0"
          action={
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditingFolder(null);
                  setShowFolderDialog(true);
                }}
              >
                <FolderPlus className="mr-1 h-3 w-3" />
                New Folder
              </Button>
              <Button size="sm" onClick={() => setShowUpload(true)}>
                <Plus className="mr-1 h-3 w-3" />
                Upload Document
              </Button>
            </div>
          }
        />

        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 mb-4 text-sm">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              All Documents
            </button>
            {breadcrumbs.map((folder) => (
              <span key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                <button
                  onClick={() => setCurrentFolderId(folder.id)}
                  className={
                    folder.id === currentFolderId
                      ? "font-medium text-foreground"
                      : "text-muted-foreground hover:text-foreground transition-colors"
                  }
                >
                  {folder.name}
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Folders grid */}
        {!search && currentFolders.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-6">
            {currentFolders.map((folder) => (
              <div
                key={folder.id}
                className="group relative rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
              >
                <div
                  className="flex items-center gap-3 px-4 py-3"
                  onClick={() => setCurrentFolderId(folder.id)}
                >
                  <Folder
                    className="h-5 w-5 shrink-0"
                    style={{ color: folder.color ?? "var(--muted-foreground)" }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{folder.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {folder._count.documents} doc{folder._count.documents !== 1 ? "s" : ""}
                      {folder._count.children > 0 &&
                        ` · ${folder._count.children} folder${folder._count.children !== 1 ? "s" : ""}`}
                    </p>
                  </div>
                </div>

                {/* Folder actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="h-6 w-6" />}>
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolder(folder);
                          setShowFolderDialog(true);
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteFolderTarget(folder);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="flex-1">
          <DataTable
            columns={columns}
            data={displayDocs}
            toolbar={() => (
              <div className="flex items-center gap-3">
                {/* File type dropdown */}
                <Select
                  value={fileTypeValue}
                  onValueChange={(val) => setFileTypeValue(val ?? "All Types")}
                >
                  <SelectTrigger className="w-auto min-w-[110px] h-8 text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FILE_TYPE_OPTIONS.map((f) => (
                      <SelectItem key={f.value} value={f.value}>
                        {f.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Status filter */}
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

                {/* Search */}
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, description, or file..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {displayDocs.length} item{displayDocs.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

      <KnowledgeUploadModal
        open={showUpload}
        onOpenChange={setShowUpload}
        onComplete={refreshData}
        folderId={currentFolderId}
      />

      <KnowledgeFolderDialog
        open={showFolderDialog}
        onOpenChange={setShowFolderDialog}
        onComplete={refreshData}
        folder={editingFolder}
        parentId={currentFolderId}
      />

      {/* Delete document dialog */}
      <KnowledgeDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        documentName={deleteTarget?.name ?? ""}
        onConfirm={() => deleteTarget && handleDeleteDoc(deleteTarget)}
      />

      {/* Delete folder dialog */}
      <KnowledgeDeleteDialog
        open={!!deleteFolderTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteFolderTarget(null);
        }}
        documentName={deleteFolderTarget?.name ?? ""}
        itemType="folder"
        onConfirm={() => deleteFolderTarget && handleDeleteFolder(deleteFolderTarget)}
      />

      <KnowledgeDocumentViewer
        document={viewerDoc}
        open={!!viewerDoc}
        onOpenChange={(open) => {
          if (!open) setViewerDoc(null);
        }}
        onUpdate={async () => {
          await refreshData();
          if (viewerDoc) {
            const res = await fetch(`/api/knowledge/documents/${viewerDoc.id}`);
            const json = await res.json();
            if (json.data) setViewerDoc(json.data);
          }
        }}
      />
      <BlockAgentPanel blockName="knowledge" blockDisplayName="Knowledge Base" />
    </>
  );
}
