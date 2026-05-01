"use client";

/**
 * Knowledge route surface for IMAGE listing.
 *
 * Coexists with src/components/images/images-list-client.tsx (Blocks
 * route surface). Both share fetch + columns + handlers + stats logic
 * but use different chrome wrappers:
 * - This file: DataTable + inline chrome (PageHeader, search, filters) + Folders/Breadcrumbs.
 * - images-list-client.tsx: BlockListPage shell (unified chrome).
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
import { DataTable } from "@/components/shared/data-table";
import { getImageColumns } from "./image-columns";
import { ImageUploadModal } from "./image-upload-modal";
import { DeleteDialog } from "@/components/shared/knowledge-commons/delete-dialog";
import { ImageViewer } from "./image-viewer";
import { FolderDialog } from "@/components/shared/knowledge-commons/folder-dialog";
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
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Trash2,
  FolderPlus,
} from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import { MEDIA_STATUS_OPTIONS } from "@/lib/knowledge/media-status";
import type { ImageRow, FolderRow } from "@/lib/knowledge-commons/types";
import { PageHeader } from "@/components/layout/page-header";

const ALL_VALUE = "ALL";
const FILE_TYPE_VALUES = ["PNG", "JPG", "WEBP", "GIF", "SVG", "TIFF"] as const;

interface ImageTableProps {
  initialImages: ImageRow[];
  initialFolders: FolderRow[];
}

export function ImageTable({
  initialImages,
  initialFolders,
}: ImageTableProps) {
  const t = useT();
  const locale = useLocale();
  const [images, setImages] = useState<ImageRow[]>(initialImages);
  const [folders, setFolders] = useState<FolderRow[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState<string>(ALL_VALUE);
  const [statusFilter, setStatusFilter] = useState<string>(ALL_VALUE);
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ImageRow | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderRow | null>(null);
  const [viewerImage, setViewerImage] = useState<ImageRow | null>(null);

  const breadcrumbs = useMemo(() => {
    const path: FolderRow[] = [];
    let id = currentFolderId;
    while (id) {
      const folder = folders.find((f) => f.id === id);
      if (!folder) break;
      path.unshift(folder);
      id = folder.parentId;
    }
    return path;
  }, [currentFolderId, folders]);

  const currentFolders = useMemo(
    () => folders.filter((f) => f.parentId === currentFolderId),
    [folders, currentFolderId]
  );

  const currentImages = useMemo(() => {
    let filtered = images.filter((i) => i.folderId === currentFolderId);
    if (fileTypeFilter !== ALL_VALUE) {
      filtered = filtered.filter((i) => i.fileType === fileTypeFilter);
    }
    if (statusFilter !== ALL_VALUE) {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          (i.description && i.description.toLowerCase().includes(q)) ||
          i.fileName.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [images, currentFolderId, fileTypeFilter, statusFilter, search]);

  const searchResults = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    let filtered = images.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.description && i.description.toLowerCase().includes(q)) ||
        i.fileName.toLowerCase().includes(q)
    );
    if (fileTypeFilter !== ALL_VALUE) {
      filtered = filtered.filter((i) => i.fileType === fileTypeFilter);
    }
    if (statusFilter !== ALL_VALUE) {
      filtered = filtered.filter((i) => i.status === statusFilter);
    }
    return filtered;
  }, [images, search, fileTypeFilter, statusFilter]);

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
    [refreshData, t]
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
    [refreshData, t]
  );

  const handleDeleteFolder = useCallback(
    async (folder: FolderRow) => {
      const res = await fetch(`/api/knowledge/folders/${folder.id}`, { method: "DELETE" });
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
    [refreshData, currentFolderId, t]
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
    [refreshData, t]
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
    [handleView, handleDownload, handleToggleActive, folders, handleMoveToFolder, t, locale]
  );

  const displayImages = searchResults ?? currentImages;

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title={t("images.list.title")}
          description={t("images.list.description")}
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
                {t("images.list.new_folder_button")}
              </Button>
              <Button size="sm" onClick={() => setShowUpload(true)}>
                <Plus className="mr-1 h-3 w-3" />
                {t("images.list.upload_button")}
              </Button>
            </div>
          }
        />

        {breadcrumbs.length > 0 && (
          <div className="flex items-center gap-1 mb-4 text-sm">
            <button
              onClick={() => setCurrentFolderId(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {t("images.list.breadcrumb_root")}
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
                      {t("images.list.folder_count_images", { count: folder._count.images })}
                      {folder._count.children > 0 &&
                        ` · ${t("images.list.folder_count_subfolders", { count: folder._count.children })}`}
                    </p>
                  </div>
                </div>

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
                        {t("common.actions.edit")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteFolderTarget(folder);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 mr-2" />
                        {t("common.actions.delete")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex-1">
          <DataTable
            columns={columns}
            data={displayImages}
            toolbar={() => (
              <div className="flex items-center gap-3">
                <Select
                  value={fileTypeFilter}
                  onValueChange={(val) => setFileTypeFilter(val ?? ALL_VALUE)}
                >
                  <SelectTrigger className="w-auto min-w-[110px] h-8 text-xs shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>
                      {t("images.list.filter_all_types")}
                    </SelectItem>
                    {FILE_TYPE_VALUES.map((v) => (
                      <SelectItem key={v} value={v}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={statusFilter}
                  onValueChange={(val) => setStatusFilter(val ?? ALL_VALUE)}
                >
                  <SelectTrigger className="w-auto min-w-[100px] h-8 text-xs shrink-0">
                    <SlidersHorizontal className="mr-1.5 h-3 w-3" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VALUE}>
                      {t("images.list.filter_all_status")}
                    </SelectItem>
                    {MEDIA_STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {t(s.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder={t("images.list.search_placeholder")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-8 pr-20 h-8 text-xs w-full"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground tabular-nums">
                    {t("images.list.items_count", { count: displayImages.length })}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

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
        onConfirm={() => deleteFolderTarget && handleDeleteFolder(deleteFolderTarget)}
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
  );
}
