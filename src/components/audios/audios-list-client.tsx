"use client";

import { useState, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FolderPlus, Music } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import { BlockListPage } from "@/components/shared/block-list-page";
import type { FilterDef } from "@/components/shared/block-list-page";
import { BlockAgentPanel } from "@/components/shared/block-agent-panel";
import { FolderNav } from "@/components/shared/knowledge-commons/folder-nav";
import { FolderDialog } from "@/components/shared/knowledge-commons/folder-dialog";
import { DeleteDialog } from "@/components/shared/knowledge-commons/delete-dialog";
import { MEDIA_STATUS_OPTIONS } from "@/lib/knowledge/media-status";
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
  const t = useT();
  const locale = useLocale();
  const [audios, setAudios] = useState<AudioRow[]>(initialAudios);
  const [folders, setFolders] = useState<FolderRow[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AudioRow | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderRow | null>(null);
  const [viewerAudio, setViewerAudio] = useState<AudioRow | null>(null);

  const displayData = useMemo(() => {
    if (search) return audios;
    return audios.filter((a) => a.folderId === currentFolderId);
  }, [audios, search, currentFolderId]);

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
        notifySuccess(
          audio.isActive ? "audios.feedback.deactivated" : "audios.feedback.activated",
          t,
        );
      }
    },
    [refreshData, t],
  );

  const handleDeleteAudio = useCallback(
    async (audio: AudioRow) => {
      const res = await fetch(`/api/audios/${audio.id}`, { method: "DELETE" });
      if (res.ok) {
        await refreshData();
        notifySuccess("audios.feedback.deleted", t);
      } else {
        notifyError("error.audios.delete_failed", t);
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
        notifySuccess("audios.feedback.folder_deleted", t);
      } else {
        notifyError("error.audios.folder_delete_failed", t);
      }
      setDeleteFolderTarget(null);
    },
    [refreshData, currentFolderId, t],
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
        notifySuccess(
          folderId ? "audios.feedback.moved_to_folder" : "audios.feedback.moved_to_root",
          t,
        );
      }
    },
    [refreshData, t],
  );

  const columns = useMemo(
    () =>
      getAudioColumns(
        {
          onView: handleView,
          onDownload: handleDownload,
          onToggleActive: handleToggleActive,
          onDelete: (audio) => setDeleteTarget(audio),
          folders,
          onMoveToFolder: handleMoveToFolder,
        },
        t,
        locale,
      ),
    [handleView, handleDownload, handleToggleActive, folders, handleMoveToFolder, t, locale],
  );

  const filters: FilterDef<AudioRow>[] = useMemo(
    () => [
      {
        key: "fileType",
        label: t("audios.list.filter_all_types"),
        options: ["MP3", "WAV", "OGG", "FLAC", "AAC", "M4A"].map((v) => ({
          value: v,
          label: v,
        })),
        filterFn: (item: AudioRow, val: string) => item.fileType === val,
      },
      {
        key: "status",
        label: t("audios.list.filter_all_status"),
        options: MEDIA_STATUS_OPTIONS.map((s) => ({
          value: s.value,
          label: t(s.labelKey),
        })),
        filterFn: (item: AudioRow, val: string) => item.status === val,
      },
    ],
    [t],
  );

  return (
    <BlockListPage<AudioRow>
      blockName="audios"
      title={t("audios.list.title")}
      description={t("audios.list.description")}
      data={displayData}
      getId={(a) => a.id}
      columns={columns}
      search={search}
      onSearchChange={setSearch}
      searchPlaceholder={t("audios.list.search_placeholder")}
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
            {t("audios.list.new_folder_button")}
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Plus className="mr-1 h-3 w-3" />
            {t("audios.list.upload_button")}
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
          rootLabel={t("audios.list.breadcrumb_root")}
          countKey="audios"
          isSearching={!!search}
        />
      }
      showAgent={false}
      emptyIcon={Music}
      emptyTitle={t("audios.empty.title")}
      emptyDescription={t("audios.empty.description")}
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

          <DeleteDialog
            open={!!deleteTarget}
            onOpenChange={(open) => {
              if (!open) setDeleteTarget(null);
            }}
            documentName={deleteTarget?.name ?? ""}
            onConfirm={() => deleteTarget && handleDeleteAudio(deleteTarget)}
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
