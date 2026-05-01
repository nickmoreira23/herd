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
import type { DocumentRow } from "@/lib/knowledge-commons/types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const FILE_TYPE_STYLES: Record<string, string> = {
  PDF: "bg-red-500/10 text-red-500 border-red-500/20",
  DOCX: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TXT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  MD: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  CSV: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

interface DocumentViewerProps {
  document: DocumentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function DocumentViewer({
  document: doc,
  open,
  onOpenChange,
  onUpdate,
}: DocumentViewerProps) {
  const t = useT();
  const locale = useLocale();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "text">("preview");

  useEffect(() => {
    if (doc) {
      setName(doc.name);
      setDescription(doc.description || "");
      setActiveTab(doc.fileType === "PDF" ? "preview" : "text");
      setTextContent(null);
    }
  }, [doc]);

  const fetchTextContent = useCallback(async () => {
    if (!doc) return;
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      const json = await res.json();
      if (json.data) {
        setTextContent(json.data.textContent);
      }
    } finally {
      setLoadingContent(false);
    }
  }, [doc]);

  useEffect(() => {
    if (open && doc && activeTab === "text") {
      fetchTextContent();
    }
  }, [open, doc, activeTab, fetchTextContent]);

  async function handleSave() {
    if (!doc) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (res.ok) {
        notifySuccess("documents.feedback.updated", t);
        onUpdate();
      } else {
        notifyError("error.documents.update_failed", t);
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleReprocess() {
    if (!doc) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/documents/${doc.id}/process`, {
        method: "POST",
      });
      if (res.ok) {
        notifySuccess("documents.feedback.processing_started", t);
        onUpdate();
      } else {
        notifyError("error.documents.processing_failed", t);
      }
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!doc) return;
    const a = document.createElement("a");
    a.href = doc.fileUrl;
    a.download = doc.fileName;
    a.click();
  }

  if (!doc) return null;

  const hasChanges = name !== doc.name || description !== (doc.description || "");
  const statusMeta = mediaStatusMeta(doc.status);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="sr-only">{t("documents.viewer.title")}</DialogTitle>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t("documents.viewer.field_name")}
                  </Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t("documents.viewer.field_description")}
                  </Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t("documents.viewer.field_description_placeholder")}
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
                  {t("documents.viewer.action_download")}
                </Button>
                <Button size="sm" onClick={handleSave} disabled={saving || !hasChanges}>
                  {saving ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  {t("documents.viewer.action_save")}
                </Button>
              </div>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <Badge variant="outline" className={`text-xs ${FILE_TYPE_STYLES[doc.fileType] || ""}`}>
              {doc.fileType}
            </Badge>
            <Badge variant="outline" className={`text-xs ${statusMeta.toneClass}`}>
              {doc.status === "PROCESSING" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {t(statusMeta.labelKey)}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
            <span className="text-xs text-muted-foreground">
              {t("documents.viewer.uploaded_at", {
                date: formatDate(new Date(doc.uploadedAt), locale, "short"),
              })}
            </span>
            {doc.chunkCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {t("documents.viewer.chunks_count", { count: doc.chunkCount })}
              </span>
            )}
            {(doc.status === "ERROR" || doc.status === "READY" || doc.status === "PENDING") && (
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
                {doc.status === "PENDING"
                  ? t("documents.viewer.action_process")
                  : t("documents.viewer.action_reprocess")}
              </Button>
            )}
          </div>

          {/* Error message */}
          {doc.status === "ERROR" && doc.errorMessage && (
            <div className="mt-3 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-xs text-red-500">{doc.errorMessage}</p>
            </div>
          )}

          {/* Tabs (for PDF — can switch between iframe preview and text) */}
          {doc.fileType === "PDF" && doc.status === "READY" && (
            <div className="flex gap-1 mt-3">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "preview"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("documents.viewer.tab_preview")}
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "text"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("documents.viewer.tab_text")}
              </button>
            </div>
          )}
        </DialogHeader>

        {/* Content area */}
        <div className="flex-1 overflow-auto min-h-0">
          {doc.status === "PENDING" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {t("documents.viewer.state_pending")}
            </div>
          )}

          {doc.status === "PROCESSING" && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("documents.viewer.state_processing")}
              </p>
            </div>
          )}

          {doc.status === "ERROR" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              {t("documents.viewer.state_error")}
            </div>
          )}

          {doc.status === "READY" && activeTab === "preview" && doc.fileType === "PDF" && (
            <iframe
              src={doc.fileUrl}
              className="w-full h-full border-0"
              title={doc.name}
            />
          )}

          {doc.status === "READY" && (activeTab === "text" || doc.fileType !== "PDF") && (
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
                  {t("documents.viewer.no_text")}
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
