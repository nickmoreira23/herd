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
import type { ImageRow } from "@/lib/knowledge-commons/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FILE_TYPE_STYLES: Record<string, string> = {
  PNG: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  JPG: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  WEBP: "bg-teal-500/10 text-teal-500 border-teal-500/20",
  GIF: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  SVG: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  TIFF: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

interface ImageViewerProps {
  image: ImageRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function ImageViewer({
  image,
  open,
  onOpenChange,
  onUpdate,
}: ImageViewerProps) {
  const t = useT();
  const locale = useLocale();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "description">("preview");

  useEffect(() => {
    if (image) {
      setName(image.name);
      setDescription(image.description || "");
      setActiveTab("preview");
      setTextContent(null);
    }
  }, [image]);

  const fetchTextContent = useCallback(async () => {
    if (!image) return;
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/images/${image.id}`);
      const json = await res.json();
      if (json.data) {
        setTextContent(json.data.textContent);
      }
    } finally {
      setLoadingContent(false);
    }
  }, [image]);

  useEffect(() => {
    if (open && image && activeTab === "description") {
      fetchTextContent();
    }
  }, [open, image, activeTab, fetchTextContent]);

  async function handleSave() {
    if (!image) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/images/${image.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (res.ok) {
        notifySuccess("images.feedback.updated", t);
        onUpdate();
      } else {
        notifyError("error.images.update_failed", t);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleReprocess() {
    if (!image) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/images/${image.id}/process`, {
        method: "POST",
      });
      if (res.ok) {
        notifySuccess("images.feedback.processing_started", t);
        onUpdate();
      } else {
        notifyError("error.images.processing_failed", t);
      }
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!image) return;
    const a = document.createElement("a");
    a.href = image.fileUrl;
    a.download = image.fileName;
    a.click();
  }

  if (!image) return null;

  const hasChanges = name !== image.name || description !== (image.description || "");
  const statusMeta = mediaStatusMeta(image.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="sr-only">{t("images.viewer.title")}</DialogTitle>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t("images.viewer.field_name")}
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t("images.viewer.field_description")}
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("images.viewer.field_description_placeholder")}
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
                  {t("images.viewer.action_download")}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                  {saving ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  {t("images.viewer.action_save")}
                </Button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <Badge variant="outline" className={`text-xs ${FILE_TYPE_STYLES[image.fileType] || ""}`}>
              {image.fileType}
            </Badge>
            <Badge variant="outline" className={`text-xs ${statusMeta.toneClass}`}>
              {image.status === "PROCESSING" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {t(statusMeta.labelKey)}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatFileSize(image.fileSize)}</span>
            {image.width && image.height && (
              <span className="text-xs text-muted-foreground">
                {image.width}&times;{image.height}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {t("images.viewer.uploaded_at", {
                date: formatDate(new Date(image.uploadedAt), locale, "short"),
              })}
            </span>
            {image.chunkCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {t("images.viewer.chunks_count", { count: image.chunkCount })}
              </span>
            )}
            {(image.status === "ERROR" || image.status === "READY" || image.status === "PENDING") && (
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
                {image.status === "PENDING"
                  ? t("images.viewer.action_process")
                  : t("images.viewer.action_reprocess")}
              </Button>
            )}
          </div>

          {image.status === "ERROR" && image.errorMessage && (
            <div className="mt-3 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-xs text-red-500">{image.errorMessage}</p>
            </div>
          )}

          {image.status === "READY" && (
            <div className="flex gap-1 mt-3">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "preview"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("images.viewer.tab_preview")}
              </button>
              <button
                onClick={() => setActiveTab("description")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "description"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("images.viewer.tab_description")}
              </button>
            </div>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto min-h-0">
          {image.status === "PENDING" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {t("images.viewer.state_pending")}
            </div>
          )}

          {image.status === "PROCESSING" && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("images.viewer.state_processing")}
              </p>
            </div>
          )}

          {image.status === "ERROR" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {t("images.viewer.state_error")}
            </div>
          )}

          {image.status === "READY" && activeTab === "preview" && (
            <div className="flex items-center justify-center p-6 h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.fileUrl}
                alt={image.name}
                className="max-w-full max-h-full object-contain rounded-md"
              />
            </div>
          )}

          {image.status === "READY" && activeTab === "description" && (
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
                  {t("images.viewer.no_description")}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
