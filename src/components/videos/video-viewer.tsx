"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Loader2, Save, RefreshCw, Download } from "lucide-react";
import { useT, useLocale } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";
import { formatDate } from "@/lib/i18n/format-date";
import { mediaStatusMeta } from "@/lib/knowledge/media-status";
import type { VideoRow } from "@/lib/knowledge-commons/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (hrs >= 1) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

const FILE_TYPE_STYLES: Record<string, string> = {
  MP4: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  MOV: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  WEBM: "bg-green-500/10 text-green-500 border-green-500/20",
  AVI: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

interface VideoViewerProps {
  video: VideoRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function VideoViewer({
  video,
  open,
  onOpenChange,
  onUpdate,
}: VideoViewerProps) {
  const t = useT();
  const locale = useLocale();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "transcript">("preview");

  useEffect(() => {
    if (video) {
      setName(video.name);
      setDescription(video.description || "");
      setActiveTab("preview");
      setTextContent(null);
    }
  }, [video]);

  const fetchTextContent = useCallback(async () => {
    if (!video) return;
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/videos/${video.id}`);
      const json = await res.json();
      if (json.data) {
        setTextContent(json.data.textContent);
      }
    } finally {
      setLoadingContent(false);
    }
  }, [video]);

  useEffect(() => {
    if (open && video && activeTab === "transcript") {
      fetchTextContent();
    }
  }, [open, video, activeTab, fetchTextContent]);

  async function handleSave() {
    if (!video) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (res.ok) {
        notifySuccess("videos.feedback.updated", t);
        onUpdate();
      } else {
        notifyError("error.videos.update_failed", t);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleReprocess() {
    if (!video) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/videos/${video.id}/process`, {
        method: "POST",
      });
      if (res.ok) {
        notifySuccess("videos.feedback.transcription_started", t);
        onUpdate();
      } else {
        notifyError("error.videos.transcription_failed", t);
      }
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!video) return;
    const a = document.createElement("a");
    a.href = video.fileUrl;
    a.download = video.fileName;
    a.click();
  }

  if (!video) return null;

  const hasChanges = name !== video.name || description !== (video.description || "");
  const statusMeta = mediaStatusMeta(video.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="sr-only">{t("videos.viewer.title")}</DialogTitle>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t("videos.viewer.field_name")}
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t("videos.viewer.field_description")}
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("videos.viewer.field_description_placeholder")}
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleDownload}>
                  <Download className="h-3 w-3 mr-1" />
                  {t("videos.viewer.action_download")}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                  {saving ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  {t("videos.viewer.action_save")}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <Badge variant="outline" className={`text-xs ${FILE_TYPE_STYLES[video.fileType] || ""}`}>
              {video.fileType}
            </Badge>
            <Badge variant="outline" className={`text-xs ${statusMeta.toneClass}`}>
              {video.status === "PROCESSING" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {t(statusMeta.labelKey)}
            </Badge>
            {video.duration != null && (
              <span className="text-xs text-muted-foreground">{formatDuration(video.duration)}</span>
            )}
            <span className="text-xs text-muted-foreground">{formatFileSize(video.fileSize)}</span>
            <span className="text-xs text-muted-foreground">
              {t("videos.viewer.uploaded_at", {
                date: formatDate(new Date(video.uploadedAt), locale, "short"),
              })}
            </span>
            {video.chunkCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {t("videos.viewer.chunks_count", { count: video.chunkCount })}
              </span>
            )}
            {(video.status === "ERROR" || video.status === "READY" || video.status === "PENDING") && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleReprocess}
                disabled={processing}
                className="h-6 text-xs"
              >
                {processing ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3 w-3 mr-1" />
                )}
                {video.status === "PENDING"
                  ? t("videos.viewer.action_transcribe")
                  : t("videos.viewer.action_retranscribe")}
              </Button>
            )}
          </div>

          {video.status === "ERROR" && video.errorMessage && (
            <div className="mt-3 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-xs text-red-500">{video.errorMessage}</p>
            </div>
          )}

          {video.status === "READY" && (
            <div className="flex gap-1 mt-3">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "preview"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("videos.viewer.tab_preview")}
              </button>
              <button
                onClick={() => setActiveTab("transcript")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "transcript"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("videos.viewer.tab_transcript")}
              </button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {video.status === "PENDING" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {t("videos.viewer.state_pending")}
            </div>
          )}

          {video.status === "PROCESSING" && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("videos.viewer.state_processing")}
              </p>
            </div>
          )}

          {video.status === "ERROR" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {t("videos.viewer.state_error")}
            </div>
          )}

          {video.status === "READY" && activeTab === "preview" && (
            <div className="flex items-center justify-center p-6 h-full">
              <video
                src={video.fileUrl}
                controls
                className="max-h-full max-w-full rounded-md"
              />
            </div>
          )}

          {video.status === "READY" && activeTab === "transcript" && (
            <div className="p-6">
              {loadingContent ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : textContent ? (
                <pre className="text-sm whitespace-pre-wrap font-mono text-foreground/80 leading-relaxed">
                  {textContent}
                </pre>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-12">
                  {t("videos.viewer.no_transcript")}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
