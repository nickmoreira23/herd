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
import type { ImageRow } from "@/lib/knowledge-commons/types";

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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState<"preview" | "description">("preview");

  // Sync form state when image changes
  useEffect(() => {
    if (image) {
      setName(image.name);
      setDescription(image.description || "");
      setActiveTab("preview");
      setTextContent(null);
    }
  }, [image]);

  // Fetch text content when viewing description tab
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
        toast.success("Image updated");
        onUpdate();
      } else {
        toast.error("Failed to update");
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
    if (!image) return;
    const a = document.createElement("a");
    a.href = image.fileUrl;
    a.download = image.fileName;
    a.click();
  }

  if (!image) return null;

  const hasChanges = name !== image.name || description !== (image.description || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="sr-only">Image Viewer</DialogTitle>
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
            <Badge variant="outline" className={`text-xs ${FILE_TYPE_STYLES[image.fileType] || ""}`}>
              {image.fileType}
            </Badge>
            <Badge variant="outline" className={`text-xs ${STATUS_STYLES[image.status] || ""}`}>
              {image.status === "PROCESSING" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {image.status}
            </Badge>
            <span className="text-xs text-muted-foreground">{formatFileSize(image.fileSize)}</span>
            {image.width && image.height && (
              <span className="text-xs text-muted-foreground">
                {image.width}&times;{image.height}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              Uploaded {new Date(image.uploadedAt).toLocaleDateString()}
            </span>
            {image.chunkCount > 0 && (
              <span className="text-xs text-muted-foreground">{image.chunkCount} chunks</span>
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
                {image.status === "PENDING" ? "Process" : "Re-process"}
              </Button>
            )}
          </div>

          {/* Error message */}
          {image.status === "ERROR" && image.errorMessage && (
            <div className="mt-3 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-xs text-red-500">{image.errorMessage}</p>
            </div>
          )}

          {/* Tabs */}
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
                Preview
              </button>
              <button
                onClick={() => setActiveTab("description")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "description"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                AI Description
              </button>
            </div>
          )}
        </DialogHeader>

        {/* Content area */}
        <div className="flex-1 overflow-auto min-h-0">
          {image.status === "PENDING" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Image has not been processed yet. Click &ldquo;Process&rdquo; to generate a description.
            </div>
          )}

          {image.status === "PROCESSING" && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Processing image...</p>
            </div>
          )}

          {image.status === "ERROR" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Processing failed. Click &ldquo;Re-process&rdquo; to try again.
            </div>
          )}

          {image.status === "READY" && activeTab === "preview" && (
            <div className="flex items-center justify-center p-6 h-full">
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
                  No AI description generated yet.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
