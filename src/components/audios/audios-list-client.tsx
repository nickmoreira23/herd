"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Music } from "lucide-react";
import { toast } from "sonner";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { FolderNav } from "@/components/shared/knowledge-commons/folder-nav";
import { FolderDialog } from "@/components/shared/knowledge-commons/folder-dialog";
import { DeleteDialog } from "@/components/shared/knowledge-commons/delete-dialog";
import { getAudioColumns } from "./audio-columns";
import { AudioUploadModal } from "./audio-upload-modal";
import { AudioViewer } from "./audio-viewer";
import type { AudioRow, FolderRow } from "@/lib/knowledge-commons/types";

interface AudiosListClientProps {
  initialAudios: AudioRow[];
  initialFolders: FolderRow[];
}

export function AudiosListClient({
  initialAudios,
  initialFolders,
}: AudiosListClientProps) {
  const [audios, setAudios] = useState<AudioRow[]>(initialAudios);
  const [folders, setFolders] = useState<FolderRow[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AudioRow | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] =
    useState<FolderRow | null>(null);
  const [viewerAudio, setViewerAudio] = useState<AudioRow | null>(null);

  // ── Display data ────────────────────────────────────────────────────
  const displayData = useMemo(() => {
    if (search) return audios;
    return audios.filter((a) => a.folderId === currentFolderId);
  }, [audios, search, currentFolderId]);

  // ── Data refresh ──────────────────────────────────────────────────
  const refreshData = useCallback(async () => {
    const [audiosRes, foldersRes] = await Promise.all([
      fetch("/api/audios"),
      fetch("/api/knowledge/folders?type=AUDIO"),
    ]);
    const audiosJson = await audiosRes.json();
    const foldersJson = await foldersRes.json();
    if (audiosJson.data) setAudios(audiosJson.data.audios);
    if (foldersJson.data) setFolders(foldersJson.data);
  }, []);

  // ── Action handlers ───────────────────────────────────────────────
  const handleView = useCallback((audio: AudioRow) => {
    setViewerAudio(audio);
  }, []);

  const handleDownload = useCallback((audio: AudioRow) => {
    const a = document.createElement("a");
    a.href = audio.fileUrl;
    a.download = audio.fileName;
    a.click();
  }, []);

  const handleToggleActive = useCallback(
    async (audio: AudioRow) => {
      const res = await fetch(`/api/audios/${audio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !audio.isActive }),
      });
      if (res.ok) {
        await refreshData();
        toast.success(audio.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshData],
  );

  const handleDeleteAudio = useCallback(
    async (audio: AudioRow) => {
      const res = await fetch(`/api/audios/${audio.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshData();
        toast.success("Audio deleted");
      } else {
        toast.error("Failed to delete audio");
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
    async (audio: AudioRow, folderId: string | null) => {
      const res = await fetch(`/api/audios/${audio.id}`, {
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
      getAudioColumns({
        onView: handleView,
        onDownload: handleDownload,
        onToggleActive: handleToggleActive,
        onDelete: (audio) => setDeleteTarget(audio),
        folders,
        onMoveToFolder: handleMoveToFolder,
      }),
    [handleView, handleDownload, handleToggleActive, folders, handleMoveToFolder],
  );

  // ── Filters ───────────────────────────────────────────────────────
  const filters: FilterDef<AudioRow>[] = useMemo(
    () => [
      {
        key: "fileType",
        label: "All Types",
        options: [
          { value: "MP3", label: "MP3" },
          { value: "WAV", label: "WAV" },
          { value: "OGG", label: "OGG" },
          { value: "FLAC", label: "FLAC" },
          { value: "AAC", label: "AAC" },
          { value: "M4A", label: "M4A" },
        ],
        filterFn: (item: AudioRow, val: string) => item.fileType === val,
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
        filterFn: (item: AudioRow, val: string) => item.status === val,
      },
    ],
    [],
  );

  // ── Render ────────────────────────────────────────────────────────
  return (
    <BlockListPage<AudioRow>
      blockName="audios"
      title="Audios"
      description="Upload and manage audio files for your knowledge base."
      data={displayData}
      getId={(a) => a.id}
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
            Upload Audio
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
          rootLabel="All Audios"
          countKey="audios"
          isSearching={!!search}
        />
      }
      showAgent={false}
      emptyIcon={Music}
      emptyTitle="No audios yet"
      emptyDescription="Upload audio files to your knowledge base. They'll be automatically transcribed with speaker diarization for search and AI access."
      modals={
        <>
          <BlockAgentPanel
            blockName="knowledge"
            blockDisplayName="Knowledge Base"
          />

          <AudioUploadModal
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
            folderType="AUDIO"
          />

          {/* Delete audio dialog */}
          <DeleteDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            documentName={deleteTarget?.name ?? ""}
            onConfirm={() => deleteTarget && handleDeleteAudio(deleteTarget)}
          />

          {/* Delete folder dialog */}
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

          <AudioViewer
            audio={viewerAudio}
            open={!!viewerAudio}
            onOpenChange={(open) => {
              if (!open) setViewerAudio(null);
            }}
            onUpdate={async () => {
              await refreshData();
              if (viewerAudio) {
                const res = await fetch(`/api/audios/${viewerAudio.id}`);
                const json = await res.json();
                if (json.data) setViewerAudio(json.data);
              }
            }}
          />
        </>
      }
    />
  );
}
