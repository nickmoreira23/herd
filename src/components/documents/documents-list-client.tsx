"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, FileText } from "lucide-react";
import { toast } from "sonner";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { FolderNav } from "@/components/shared/knowledge-commons/folder-nav";
import { FolderDialog } from "@/components/shared/knowledge-commons/folder-dialog";
import { DeleteDialog } from "@/components/shared/knowledge-commons/delete-dialog";
import { getDocumentColumns } from "./document-columns";
import { UploadModal } from "./upload-modal";
import { DocumentViewer } from "./document-viewer";
import type { DocumentRow, FolderRow } from "@/lib/knowledge-commons/types";

interface DocumentsListClientProps {
  initialDocuments: DocumentRow[];
  initialFolders: FolderRow[];
}

export function DocumentsListClient({
  initialDocuments,
  initialFolders,
}: DocumentsListClientProps) {
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments);
  const [folders, setFolders] = useState<FolderRow[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] =
    useState<FolderRow | null>(null);
  const [viewerDoc, setViewerDoc] = useState<DocumentRow | null>(null);

  // ── Display data ─────────────────────────────────────────────────
  // When searching, pass ALL documents — BlockListPage applies searchFn.
  // When not searching, pass only documents in the current folder.
  const displayData = useMemo(() => {
    if (search) return documents;
    return documents.filter((d) => d.folderId === currentFolderId);
  }, [documents, search, currentFolderId]);

  // ── Data refresh ─────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    try {
      const [docsRes, foldersRes] = await Promise.all([
        fetch("/api/documents"),
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

  // ── Action handlers ──────────────────────────────────────────────
  const handleView = useCallback((doc: DocumentRow) => {
    setViewerDoc(doc);
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
        await refreshData();
        toast.success(doc.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshData],
  );

  const handleDeleteDoc = useCallback(
    async (doc: DocumentRow) => {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshData();
        toast.success("Document deleted");
      } else {
        toast.error("Failed to delete document");
      }
      setDeleteTarget(null);
    },
    [refreshData],
  );

  const handleDeleteFolder = useCallback(
    async (folder: FolderRow) => {
      const res = await fetch(`/api/knowledge/folders/${folder.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
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
    [refreshData, currentFolderId],
  );

  const handleMoveToFolder = useCallback(
    async (doc: DocumentRow, folderId: string | null) => {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        await refreshData();
        toast.success(folderId ? "Moved to folder" : "Moved to root");
      }
    },
    [refreshData],
  );

  // ── Columns ──────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getDocumentColumns({
        onView: handleView,
        onDownload: handleDownload,
        onToggleActive: handleToggleActive,
        onDelete: (doc) => setDeleteTarget(doc),
        folders,
        onMoveToFolder: handleMoveToFolder,
      }),
    [handleView, handleDownload, handleToggleActive, folders, handleMoveToFolder],
  );

  // ── Filters ──────────────────────────────────────────────────────
  const filters: FilterDef<DocumentRow>[] = useMemo(
    () => [
      {
        key: "fileType",
        label: "All Types",
        options: [
          { value: "PDF", label: "PDF" },
          { value: "DOCX", label: "DOCX" },
          { value: "TXT", label: "TXT" },
          { value: "MD", label: "MD" },
          { value: "CSV", label: "CSV" },
        ],
        filterFn: (item: DocumentRow, val: string) => item.fileType === val,
      },
      {
        key: "status",
        label: "All Status",
        options: [
          { value: "PENDING", label: "Pending" },
          { value: "PROCESSING", label: "Processing" },
          { value: "READY", label: "Ready" },
          { value: "ERROR", label: "Error" },
        ],
        filterFn: (item: DocumentRow, val: string) => item.status === val,
      },
    ],
    [],
  );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <BlockListPage<DocumentRow>
      blockName="documents"
      title="Documents"
      description="Guides, policies, SOPs, and reference materials for your team and partners."
      data={displayData}
      getId={(d) => d.id}
      columns={columns}
      searchPlaceholder="Search by name, description, or file..."
      searchFn={(item, q) =>
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false) ||
        item.fileName.toLowerCase().includes(q)
      }
      search={search}
      onSearchChange={setSearch}
      filters={filters}
      headerActions={
        <>
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
        </>
      }
      beforeContent={
        <FolderNav
          folders={folders}
          currentFolderId={currentFolderId}
          onNavigate={setCurrentFolderId}
          onEdit={(folder) => {
            setEditingFolder(folder);
            setShowFolderDialog(true);
          }}
          onDelete={(folder) => setDeleteFolderTarget(folder)}
          rootLabel="All Documents"
          countKey="documents"
          isSearching={!!search}
        />
      }
      emptyIcon={FileText}
      emptyTitle="No documents yet"
      emptyDescription="Upload documents to build your knowledge base. Guides, policies, SOPs, and reference materials for your team and partners."
      showAgent={false}
      modals={
        <>
          <UploadModal
            open={showUpload}
            onOpenChange={setShowUpload}
            onComplete={refreshData}
            folderId={currentFolderId}
          />

          <FolderDialog
            open={showFolderDialog}
            onOpenChange={setShowFolderDialog}
            onComplete={refreshData}
            folder={editingFolder}
            parentId={currentFolderId}
          />

          <DeleteDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            documentName={deleteTarget?.name ?? ""}
            onConfirm={() => deleteTarget && handleDeleteDoc(deleteTarget)}
          />

          <DeleteDialog
            open={!!deleteFolderTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteFolderTarget(null);
            }}
            documentName={deleteFolderTarget?.name ?? ""}
            itemType="folder"
            onConfirm={() =>
              deleteFolderTarget && handleDeleteFolder(deleteFolderTarget)
            }
          />

          <DocumentViewer
            document={viewerDoc}
            open={!!viewerDoc}
            onOpenChange={(open) => {
              if (!open) setViewerDoc(null);
            }}
            onUpdate={async () => {
              await refreshData();
              if (viewerDoc) {
                const res = await fetch(`/api/documents/${viewerDoc.id}`);
                const json = await res.json();
                if (json.data) setViewerDoc(json.data);
              }
            }}
          />

          <BlockAgentPanel
            blockName="knowledge"
            blockDisplayName="Knowledge Base"
          />
        </>
      }
    />
  );
}
