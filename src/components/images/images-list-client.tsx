"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Image } from "lucide-react";
import { toast } from "sonner";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { FolderNav } from "@/components/shared/knowledge-commons/folder-nav";
import { FolderDialog } from "@/components/shared/knowledge-commons/folder-dialog";
import { DeleteDialog } from "@/components/shared/knowledge-commons/delete-dialog";
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
  // ── Data state ───────────────────────────────────────────────────
  const [images, setImages] = useState<ImageRow[]>(initialImages);
  const [folders, setFolders] = useState<FolderRow[]>(initialFolders);

  // ── Folder + search state ────────────────────────────────────────
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  // ── Modal state ──────────────────────────────────────────────────
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImageRow | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] =
    useState<FolderRow | null>(null);
  const [viewerImage, setViewerImage] = useState<ImageRow | null>(null);

  // ── Display data ─────────────────────────────────────────────────
  // When searching, pass ALL images so the search spans every folder.
  // When not searching, filter to the current folder only.
  const displayData = useMemo(() => {
    if (search) return images;
    return images.filter((img) => img.folderId === currentFolderId);
  }, [images, search, currentFolderId]);

  // ── Data refresh ─────────────────────────────────────────────────
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

  // ── Action handlers ──────────────────────────────────────────────
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
        toast.success(image.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshData],
  );

  const handleDeleteImage = useCallback(
    async (image: ImageRow) => {
      const res = await fetch(`/api/images/${image.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshData();
        toast.success("Image deleted");
      } else {
        toast.error("Failed to delete image");
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
    async (image: ImageRow, folderId: string | null) => {
      const res = await fetch(`/api/images/${image.id}`, {
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
      getImageColumns({
        onView: handleView,
        onDownload: handleDownload,
        onToggleActive: handleToggleActive,
        onDelete: (image) => setDeleteTarget(image),
        folders,
        onMoveToFolder: handleMoveToFolder,
      }),
    [handleView, handleDownload, handleToggleActive, folders, handleMoveToFolder],
  );

  // ── Filters ──────────────────────────────────────────────────────
  const filters: FilterDef<ImageRow>[] = useMemo(
    () => [
      {
        key: "fileType",
        label: "All Types",
        options: [
          { value: "PNG", label: "PNG" },
          { value: "JPG", label: "JPG" },
          { value: "WEBP", label: "WEBP" },
          { value: "GIF", label: "GIF" },
          { value: "SVG", label: "SVG" },
          { value: "TIFF", label: "TIFF" },
        ],
        filterFn: (item: ImageRow, val: string) => item.fileType === val,
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
        filterFn: (item: ImageRow, val: string) => item.status === val,
      },
    ],
    [],
  );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <BlockListPage<ImageRow>
      blockName="images"
      title="Images"
      description="Upload and manage images for your knowledge base."
      data={displayData}
      getId={(img) => img.id}
      columns={columns}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder="Search by name, description, or file..."
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
            New Folder
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Plus className="mr-1 h-3 w-3" />
            Upload Image
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
          rootLabel="All Images"
          countKey="images"
          isSearching={!!search}
        />
      }
      emptyIcon={Image}
      emptyTitle="No images yet"
      emptyDescription="Upload images to your knowledge base. They'll be automatically analyzed and described by AI."
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
