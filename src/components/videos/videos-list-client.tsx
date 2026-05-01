"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Video } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { FolderNav } from "@/components/shared/knowledge-commons/folder-nav";
import { FolderDialog } from "@/components/shared/knowledge-commons/folder-dialog";
import { DeleteDialog } from "@/components/shared/knowledge-commons/delete-dialog";
import { MEDIA_STATUS_OPTIONS } from "@/lib/knowledge/media-status";
import { getVideoColumns } from "./video-columns";
import { VideoUploadModal } from "./video-upload-modal";
import { VideoViewer } from "./video-viewer";
import type { VideoRow, FolderRow } from "@/lib/knowledge-commons/types";

interface VideosListClientProps {
  initialVideos: VideoRow[];
  initialFolders: FolderRow[];
}

export function VideosListClient({
  initialVideos,
  initialFolders,
}: VideosListClientProps) {
  const t = useT();
  const locale = useLocale();
  const [videos, setVideos] = useState<VideoRow[]>(initialVideos);
  const [folders, setFolders] = useState<FolderRow[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VideoRow | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderRow | null>(null);
  const [viewerVideo, setViewerVideo] = useState<VideoRow | null>(null);

  const displayData = useMemo(() => {
    if (search) return videos;
    return videos.filter((v) => v.folderId === currentFolderId);
  }, [videos, search, currentFolderId]);

  const refreshData = useCallback(async () => {
    const [videosRes, foldersRes] = await Promise.all([
      fetch("/api/videos"),
      fetch("/api/knowledge/folders?type=VIDEO"),
    ]);
    const videosJson = await videosRes.json();
    const foldersJson = await foldersRes.json();
    if (videosJson.data) setVideos(videosJson.data.videos);
    if (foldersJson.data) setFolders(foldersJson.data);
  }, []);

  const handleView = useCallback((video: VideoRow) => {
    setViewerVideo(video);
  }, []);

  const handleDownload = useCallback((video: VideoRow) => {
    const a = document.createElement("a");
    a.href = video.fileUrl;
    a.download = video.fileName;
    a.click();
  }, []);

  const handleToggleActive = useCallback(
    async (video: VideoRow) => {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !video.isActive }),
      });
      if (res.ok) {
        await refreshData();
        notifySuccess(
          video.isActive ? "videos.feedback.deactivated" : "videos.feedback.activated",
          t,
        );
      }
    },
    [refreshData, t],
  );

  const handleDeleteVideo = useCallback(
    async (video: VideoRow) => {
      const res = await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshData();
        notifySuccess("videos.feedback.deleted", t);
      } else {
        notifyError("error.videos.delete_failed", t);
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
        notifySuccess("videos.feedback.folder_deleted", t);
      } else {
        notifyError("error.videos.folder_delete_failed", t);
      }
      setDeleteFolderTarget(null);
    },
    [refreshData, currentFolderId, t],
  );

  const handleMoveToFolder = useCallback(
    async (video: VideoRow, folderId: string | null) => {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folderId }),
      });
      if (res.ok) {
        await refreshData();
        notifySuccess(
          folderId ? "videos.feedback.moved_to_folder" : "videos.feedback.moved_to_root",
          t,
        );
      }
    },
    [refreshData, t],
  );

  const columns = useMemo(
    () =>
      getVideoColumns(
        {
          onView: handleView,
          onDownload: handleDownload,
          onToggleActive: handleToggleActive,
          onDelete: (video) => setDeleteTarget(video),
          folders,
          onMoveToFolder: handleMoveToFolder,
        },
        t,
        locale,
      ),
    [handleView, handleDownload, handleToggleActive, folders, handleMoveToFolder, t, locale],
  );

  const filters: FilterDef<VideoRow>[] = useMemo(
    () => [
      {
        key: "fileType",
        label: t("videos.list.filter_all_types"),
        options: ["MP4", "MOV", "WEBM", "AVI"].map((v) => ({
          value: v,
          label: v,
        })),
        filterFn: (item: VideoRow, val: string) => item.fileType === val,
      },
      {
        key: "status",
        label: t("videos.list.filter_all_status"),
        options: MEDIA_STATUS_OPTIONS.map((s) => ({
          value: s.value,
          label: t(s.labelKey),
        })),
        filterFn: (item: VideoRow, val: string) => item.status === val,
      },
    ],
    [t],
  );

  return (
    <BlockListPage<VideoRow>
      blockName="videos"
      title={t("videos.list.title")}
      description={t("videos.list.description")}
      data={displayData}
      getId={(v) => v.id}
      columns={columns}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={t("videos.list.search_placeholder")}
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
            {t("videos.list.new_folder_button")}
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Plus className="mr-1 h-3 w-3" />
            {t("videos.list.upload_button")}
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
          rootLabel={t("videos.list.breadcrumb_root")}
          countKey="videos"
          isSearching={!!search}
        />
      }
      emptyIcon={Video}
      emptyTitle={t("videos.empty.title")}
      emptyDescription={t("videos.empty.description")}
      showAgent={false}
      modals={
        <>
          <BlockAgentPanel
            blockName="knowledge"
            blockDisplayName="Knowledge Base"
          />

          <VideoUploadModal
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
            folderType="VIDEO"
          />

          <DeleteDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            documentName={deleteTarget?.name ?? ""}
            onConfirm={() => deleteTarget && handleDeleteVideo(deleteTarget)}
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

          <VideoViewer
            video={viewerVideo}
            open={!!viewerVideo}
            onOpenChange={(open) => {
              if (!open) setViewerVideo(null);
            }}
            onUpdate={async () => {
              await refreshData();
              if (viewerVideo) {
                const res = await fetch(`/api/videos/${viewerVideo.id}`);
                const json = await res.json();
                if (json.data) setViewerVideo(json.data);
              }
            }}
          />
        </>
      }
    />
  );
}
