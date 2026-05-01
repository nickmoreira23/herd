"use client";

/**
 * Blocks route surface for DOCUMENT listing.
 *
 * Coexists with src/components/documents/document-table.tsx (or
 * Knowledge route surface). Both share fetch + columns + handlers +
 * stats logic but use different chrome wrappers:
 * - This file: BlockListPage shell (unified chrome).
 * - document-table.tsx: DataTable + inline chrome + Folders/Breadcrumbs.
 * - Note: also imported by src/app/admin/operation/documents/page.tsx
 *   (third consumer outside the Knowledge/Blocks dual-route pattern).
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
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, FileText } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { FolderNav } from "@/components/shared/knowledge-commons/folder-nav";
import { FolderDialog } from "@/components/shared/knowledge-commons/folder-dialog";
import { DeleteDialog } from "@/components/shared/knowledge-commons/delete-dialog";
import { MEDIA_STATUS_OPTIONS } from "@/lib/knowledge/media-status";
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
  const t = useT();
  const locale = useLocale();
  const [documents, setDocuments] = useState<DocumentRow[]>(initialDocuments);
  const [folders, setFolders] = useState<FolderRow[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentRow | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderRow | null>(null);
  const [viewerDoc, setViewerDoc] = useState<DocumentRow | null>(null);

  const displayData = useMemo(() => {
    if (search) return documents;
    return documents.filter((d) => d.folderId === currentFolderId);
  }, [documents, search, currentFolderId]);

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
        notifySuccess(
          doc.isActive ? "documents.feedback.deactivated" : "documents.feedback.activated",
          t,
        );
      }
    },
    [refreshData, t],
  );

  const handleDeleteDoc = useCallback(
    async (doc: DocumentRow) => {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshData();
        notifySuccess("documents.feedback.deleted", t);
      } else {
        notifyError("error.documents.delete_failed", t);
      }
      setDeleteTarget(null);
    },
    [refreshData, t],
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
        notifySuccess("documents.feedback.folder_deleted", t);
      } else {
        notifyError("error.documents.folder_delete_failed", t);
      }
      setDeleteFolderTarget(null);
    },
    [refreshData, currentFolderId, t],
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
        notifySuccess(
          folderId ? "documents.feedback.moved_to_folder" : "documents.feedback.moved_to_root",
          t,
        );
      }
    },
    [refreshData, t],
  );

  const columns = useMemo(
    () =>
      getDocumentColumns(
        {
          onView: handleView,
          onDownload: handleDownload,
          onToggleActive: handleToggleActive,
          onDelete: (doc) => setDeleteTarget(doc),
          folders,
          onMoveToFolder: handleMoveToFolder,
        },
        t,
        locale,
      ),
    [handleView, handleDownload, handleToggleActive, folders, handleMoveToFolder, t, locale],
  );

  const filters: FilterDef<DocumentRow>[] = useMemo(
    () => [
      {
        key: "fileType",
        label: t("documents.list.filter_all_types"),
        options: ["PDF", "DOCX", "TXT", "MD", "CSV"].map((v) => ({
          value: v,
          label: v,
        })),
        filterFn: (item: DocumentRow, val: string) => item.fileType === val,
      },
      {
        key: "status",
        label: t("documents.list.filter_all_status"),
        options: MEDIA_STATUS_OPTIONS.map((s) => ({
          value: s.value,
          label: t(s.labelKey),
        })),
        filterFn: (item: DocumentRow, val: string) => item.status === val,
      },
    ],
    [t],
  );

  return (
    <BlockListPage<DocumentRow>
      blockName="documents"
      title={t("documents.list.title")}
      description={t("documents.list.description")}
      data={displayData}
      getId={(d) => d.id}
      columns={columns}
      searchPlaceholder={t("documents.list.search_placeholder")}
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
            {t("documents.list.new_folder_button")}
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Plus className="mr-1 h-3 w-3" />
            {t("documents.list.upload_button")}
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
          rootLabel={t("documents.list.breadcrumb_root")}
          countKey="documents"
          isSearching={!!search}
        />
      }
      emptyIcon={FileText}
      emptyTitle={t("documents.empty.title")}
      emptyDescription={t("documents.empty.description")}
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
