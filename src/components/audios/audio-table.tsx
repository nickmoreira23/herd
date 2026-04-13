"use client";

import { useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/shared/data-table";
import { getAudioColumns } from "./audio-columns";
import { AudioUploadModal } from "./audio-upload-modal";
import { DeleteDialog } from "@/components/shared/knowledge-commons/delete-dialog";
import { AudioViewer } from "./audio-viewer";
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
import { toast } from "sonner";
import type { AudioRow, FolderRow } from "@/lib/knowledge-commons/types";
import { PageHeader } from "@/components/layout/page-header";

const FILE_TYPE_OPTIONS = [
  { value: "All Types", filterKey: "ALL" },
  { value: "MP3", filterKey: "MP3" },
  { value: "WAV", filterKey: "WAV" },
  { value: "OGG", filterKey: "OGG" },
  { value: "FLAC", filterKey: "FLAC" },
  { value: "AAC", filterKey: "AAC" },
  { value: "M4A", filterKey: "M4A" },
] as const;

const STATUS_OPTIONS = [
  { value: "All Status", filterKey: "ALL" },
  { value: "Pending", filterKey: "PENDING" },
  { value: "Processing", filterKey: "PROCESSING" },
  { value: "Ready", filterKey: "READY" },
  { value: "Error", filterKey: "ERROR" },
] as const;

interface AudioTableProps {
  initialAudios: AudioRow[];
  initialFolders: FolderRow[];
}

export function AudioTable({
  initialAudios,
  initialFolders,
}: AudioTableProps) {
  const [audios, setAudios] = useState<AudioRow[]>(initialAudios);
  const [folders, setFolders] = useState<FolderRow[]>(initialFolders);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [fileTypeValue, setFileTypeValue] = useState("All Types");
  const [statusValue, setStatusValue] = useState("All Status");
  const [showUpload, setShowUpload] = useState(false);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState<FolderRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AudioRow | null>(null);
  const [deleteFolderTarget, setDeleteFolderTarget] = useState<FolderRow | null>(null);
  const [viewerAudio, setViewerAudio] = useState<AudioRow | null>(null);

  const fileTypeFilter = FILE_TYPE_OPTIONS.find((f) => f.value === fileTypeValue)?.filterKey ?? "ALL";
  const statusFilter = STATUS_OPTIONS.find((s) => s.value === statusValue)?.filterKey ?? "ALL";

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

  const currentAudios = useMemo(() => {
    let filtered = audios.filter((a) => a.folderId === currentFolderId);

    if (fileTypeFilter !== "ALL") {
      filtered = filtered.filter((a) => a.fileType === fileTypeFilter);
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)) ||
          a.fileName.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [audios, currentFolderId, fileTypeFilter, statusFilter, search]);

  const searchResults = useMemo(() => {
    if (!search) return null;
    const q = search.toLowerCase();
    let filtered = audios.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        (a.description && a.description.toLowerCase().includes(q)) ||
        a.fileName.toLowerCase().includes(q)
    );
    if (fileTypeFilter !== "ALL") {
      filtered = filtered.filter((a) => a.fileType === fileTypeFilter);
    }
    if (statusFilter !== "ALL") {
      filtered = filtered.filter((a) => a.status === statusFilter);
    }
    return filtered;
  }, [audios, search, fileTypeFilter, statusFilter]);

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
        toast.success(audio.isActive ? "Deactivated" : "Activated");
      }
    },
    [refreshData]
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
    [refreshData]
  );

  const handleDeleteFolder = useCallback(
    async (folder: FolderRow) => {
      const res = await fetch(`/api/knowledge/folders/${folder.id}`, { method: "DELETE" });
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
    [refreshData, currentFolderId]
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
    [refreshData]
  );

  const columns = useMemo(
    () =>
      getAudioColumns({
        onView: handleView,
        onDownload: handleDownload,
        onToggleActive: handleToggleActive,
        onDelete: (audio) => setDeleteTarget(audio),
        folders: folders,
        onMoveToFolder: handleMoveToFolder,
      }),
    [handleView, handleDownload, handleToggleActive, folders, handleMoveToFolder]
  );

  const displayAudios = searchResults ?? currentAudios;

  return (
    <>
      <div className="flex flex-col min-h-full pt-2 pl-2">
        <PageHeader
          title="Audios"
          description="Audio content transcribed with AI-powered speaker diarization for your knowledge base."
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
                Upload Audio
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
              All Audios
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
                      {folder._count.audios} audio{folder._count.audios !== 1 ? "s" : ""}
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
            data={displayAudios}
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
                    {displayAudios.length} item{displayAudios.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            )}
          />
        </div>
      </div>

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
        onConfirm={() => deleteFolderTarget && handleDeleteFolder(deleteFolderTarget)}
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
  );
}
