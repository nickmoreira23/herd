"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Video } from "lucide-react";
import { toast } from "sonner";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { FolderNav } from "@/components/shared/knowledge-commons/folder-nav";
import { FolderDialog } from "@/components/shared/knowledge-commons/folder-dialog";
import { DeleteDialog } from "@/components/shared/knowledge-commons/delete-dialog";
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
  const [videos, setVideos] = useState<VideoRow[]>(initialVideos);
  const [folders, setFolders] = useState<FolderRow[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VideoRow | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] =
    useState<FolderRow | null>(null);
  const [viewerVideo, setViewerVideo] = useState<VideoRow | null>(null);

  // ── Display data ──────────────────────────────────────────────────
  const displayData = useMemo(() => {
    if (search) return videos;
    return videos.filter((v) => v.folderId === currentFolderId);
  }, [videos, search, currentFolderId]);

  // ── Data refresh ──────────────────────────────────────────────────
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

  // ── Action handlers ───────────────────────────────────────────────
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
        toast.success(video.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshData],
  );

  const handleDeleteVideo = useCallback(
    async (video: VideoRow) => {
      const res = await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshData();
        toast.success("Video deleted");
      } else {
        toast.error("Failed to delete video");
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
    async (video: VideoRow, folderId: string | null) => {
      const res = await fetch(`/api/videos/${video.id}`, {
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

  // ── Columns ───────────────────────────────────────────────────────
  const columns = useMemo(
    () =>
      getVideoColumns({
        onView: handleView,
        onDownload: handleDownload,
        onToggleActive: handleToggleActive,
        onDelete: (video) => setDeleteTarget(video),
        folders,
        onMoveToFolder: handleMoveToFolder,
      }),
    [handleView, handleDownload, handleToggleActive, folders, handleMoveToFolder],
  );

  // ── Filters ───────────────────────────────────────────────────────
  const filters: FilterDef<VideoRow>[] = useMemo(
    () => [
      {
        key: "fileType",
        label: "All Types",
        options: [
          { value: "MP4", label: "MP4" },
          { value: "MOV", label: "MOV" },
          { value: "WEBM", label: "WEBM" },
          { value: "AVI", label: "AVI" },
        ],
        filterFn: (item: VideoRow, val: string) => item.fileType === val,
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
        filterFn: (item: VideoRow, val: string) => item.status === val,
      },
    ],
    [],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <BlockListPage<VideoRow>
      blockName="videos"
      title="Videos"
      description="Upload and manage videos for your knowledge base."
      data={displayData}
      getId={(v) => v.id}
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
            Upload Video
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
          rootLabel="All Videos"
          countKey="videos"
          isSearching={!!search}
        />
      }
      emptyIcon={Video}
      emptyTitle="No videos yet"
      emptyDescription="Upload videos to your knowledge base. They'll be automatically transcribed for search and AI access."
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
