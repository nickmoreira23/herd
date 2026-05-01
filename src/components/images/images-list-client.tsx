"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Image as ImageIcon } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { FolderNav } from "@/components/shared/knowledge-commons/folder-nav";
import { FolderDialog } from "@/components/shared/knowledge-commons/folder-dialog";
import { DeleteDialog } from "@/components/shared/knowledge-commons/delete-dialog";
import { MEDIA_STATUS_OPTIONS } from "@/lib/knowledge/media-status";
import { getImageColumns } from "./image-columns";
import { ImageUploadModal } from "./image-upload-modal";
import { ImageViewer } from "./image-viewer";
import type { ImageRow, FolderRow } from "@/lib/knowledge-commons/types";

interface ImagesListClientProps {
  initialImages: ImageRow[];
  initialFolders: FolderRow[];
}

export function ImagesListClient({
  initialImages,
  initialFolders,
}: ImagesListClientProps) {
  const t = useT();
  const locale = useLocale();
  const [images, setImages] = useState<ImageRow[]>(initialImages);
  const [folders, setFolders] = useState<FolderRow[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImageRow | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderRow | null>(null);
  const [viewerImage, setViewerImage] = useState<ImageRow | null>(null);

  const displayData = useMemo(() => {
    if (search) return images;
    return images.filter((img) => img.folderId === currentFolderId);
  }, [images, search, currentFolderId]);

  const refreshData = useCallback(async () => {
    const [imagesRes, foldersRes] = await Promise.all([
      fetch("/api/images"),
      fetch("/api/knowledge/folders?type=IMAGE"),
    ]);
    const imagesJson = await imagesRes.json();
    const foldersJson = await foldersRes.json();
    if (imagesJson.data) setImages(imagesJson.data.images);
    if (foldersJson.data) setFolders(foldersJson.data);
  }, []);

  const handleView = useCallback((image: ImageRow) => {
    setViewerImage(image);
  }, []);

  const handleDownload = useCallback((image: ImageRow) => {
    const a = document.createElement("a");
    a.href = image.fileUrl;
    a.download = image.fileName;
    a.click();
  }, []);

  const handleToggleActive = useCallback(
    async (image: ImageRow) => {
      const res = await fetch(`/api/images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !image.isActive }),
      });
      if (res.ok) {
        await refreshData();
        notifySuccess(
          image.isActive ? "images.feedback.deactivated" : "images.feedback.activated",
          t,
        );
      }
    },
    [refreshData, t],
  );

  const handleDeleteImage = useCallback(
    async (image: ImageRow) => {
      const res = await fetch(`/api/images/${image.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshData();
        notifySuccess("images.feedback.deleted", t);
      } else {
        notifyError("error.images.delete_failed", t);
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
        notifySuccess("images.feedback.folder_deleted", t);
      } else {
        notifyError("error.images.folder_delete_failed", t);
      }
      setDeleteFolderTarget(null);
    },
    [refreshData, currentFolderId, t],
  );

  const handleMoveToFolder = useCallback(
    async (image: ImageRow, folderId: string | null) => {
      const res = await fetch(`/api/images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        await refreshData();
        notifySuccess(
          folderId ? "images.feedback.moved_to_folder" : "images.feedback.moved_to_root",
          t,
        );
      }
    },
    [refreshData, t],
  );

  const columns = useMemo(
    () =>
      getImageColumns(
        {
          onView: handleView,
          onDownload: handleDownload,
          onToggleActive: handleToggleActive,
          onDelete: (image) => setDeleteTarget(image),
          folders,
          onMoveToFolder: handleMoveToFolder,
        },
        t,
        locale,
      ),
    [handleView, handleDownload, handleToggleActive, folders, handleMoveToFolder, t, locale],
  );

  const filters: FilterDef<ImageRow>[] = useMemo(
    () => [
      {
        key: "fileType",
        label: t("images.list.filter_all_types"),
        options: ["PNG", "JPG", "WEBP", "GIF", "SVG", "TIFF"].map((v) => ({
          value: v,
          label: v,
        })),
        filterFn: (item: ImageRow, val: string) => item.fileType === val,
      },
      {
        key: "status",
        label: t("images.list.filter_all_status"),
        options: MEDIA_STATUS_OPTIONS.map((s) => ({
          value: s.value,
          label: t(s.labelKey),
        })),
        filterFn: (item: ImageRow, val: string) => item.status === val,
      },
    ],
    [t],
  );

  return (
    <BlockListPage<ImageRow>
      blockName="images"
      title={t("images.list.title")}
      description={t("images.list.description")}
      data={displayData}
      getId={(img) => img.id}
      columns={columns}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={t("images.list.search_placeholder")}
      searchFn={(item, q) =>
        item.name.toLowerCase().includes(q) ||
        (item.description?.toLowerCase().includes(q) ?? false) ||
        item.fileName.toLowerCase().includes(q)
      }
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
            {t("images.list.new_folder_button")}
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Plus className="mr-1 h-3 w-3" />
            {t("images.list.upload_button")}
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
          rootLabel={t("images.list.breadcrumb_root")}
          countKey="images"
          isSearching={!!search}
        />
      }
      emptyIcon={ImageIcon}
      emptyTitle={t("images.empty.title")}
      emptyDescription={t("images.empty.description")}
      showAgent={false}
      modals={
        <>
          <BlockAgentPanel
            blockName="knowledge"
            blockDisplayName="Knowledge Base"
          />

          <ImageUploadModal
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
            folderType="IMAGE"
          />

          <DeleteDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            documentName={deleteTarget?.name ?? ""}
            onConfirm={() => deleteTarget && handleDeleteImage(deleteTarget)}
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

          <ImageViewer
            image={viewerImage}
            open={!!viewerImage}
            onOpenChange={(open) => {
              if (!open) setViewerImage(null);
            }}
            onUpdate={async () => {
              await refreshData();
              if (viewerImage) {
                const res = await fetch(`/api/images/${viewerImage.id}`);
                const json = await res.json();
                if (json.data) setViewerImage(json.data);
              }
            }}
          />
        </>
      }
    />
  );
}
