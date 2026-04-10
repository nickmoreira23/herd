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
import { toast } from "sonner";
import type { KnowledgeDocumentRow } from "./types";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  READY: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ERROR: "bg-red-500/10 text-red-500 border-red-500/20",
};

const FILE_TYPE_STYLES: Record<string, string> = {
  PDF: "bg-red-500/10 text-red-500 border-red-500/20",
  DOCX: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  TXT: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
  MD: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  CSV: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
};

interface KnowledgeDocumentViewerProps {
  document: KnowledgeDocumentRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function KnowledgeDocumentViewer({
  document: doc,
  open,
  onOpenChange,
  onUpdate,
}: KnowledgeDocumentViewerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "text">("preview");

  // Sync form state when doc changes
  useEffect(() => {
    if (doc) {
      setName(doc.name);
      setDescription(doc.description || "");
      setActiveTab(doc.fileType === "PDF" ? "preview" : "text");
      setTextContent(null);
    }
  }, [doc]);

  // Fetch text content when viewing text tab
  const fetchTextContent = useCallback(async () => {
    if (!doc) return;
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/knowledge/documents/${doc.id}`);
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
      const res = await fetch(`/api/knowledge/documents/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Document updated");
        onUpdate();
      } else {
        toast.error("Failed to update");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleReprocess() {
    if (!doc) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/knowledge/documents/${doc.id}/process`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Processing started");
        onUpdate();
      } else {
        toast.error("Processing failed");
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="sr-only">Document Viewer</DialogTitle>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-sm font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows={2}
                    className="text-sm resize-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDownload}
                >
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={saving || !hasChanges}
                >
                  {saving ? (
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <Badge variant="outline" className={`text-xs ${FILE_TYPE_STYLES[doc.fileType] || ""}`}>
              {doc.fileType}
            </Badge>
            <Badge variant="outline" className={`text-xs ${STATUS_STYLES[doc.status] || ""}`}>
              {doc.status === "PROCESSING" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {doc.status}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatFileSize(doc.fileSize)}</span>
            <span className="text-xs text-muted-foreground">
              Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
            </span>
            {doc.chunkCount > 0 && (
              <span className="text-xs text-muted-foreground">{doc.chunkCount} chunks</span>
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
                {doc.status === "PENDING" ? "Process" : "Re-process"}
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
                Preview
              </button>
              <button
                onClick={() => setActiveTab("text")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "text"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Extracted Text
              </button>
            </div>
          )}
        </DialogHeader>

        {/* Content area */}
        <div className="flex-1 overflow-auto min-h-0">
          {doc.status === "PENDING" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Document has not been processed yet. Click &ldquo;Process&rdquo; to extract text.
            </div>
          )}

          {doc.status === "PROCESSING" && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Processing document...</p>
            </div>
          )}

          {doc.status === "ERROR" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Processing failed. Click &ldquo;Re-process&rdquo; to try again.
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
                  No text content extracted.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
