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
import type { AudioRow } from "@/lib/knowledge-commons/types";

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

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  PROCESSING: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  READY: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  ERROR: "bg-red-500/10 text-red-500 border-red-500/20",
};

const FILE_TYPE_STYLES: Record<string, string> = {
  MP3: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  WAV: "bg-violet-500/10 text-violet-500 border-violet-500/20",
  OGG: "bg-green-500/10 text-green-500 border-green-500/20",
  FLAC: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  AAC: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
  M4A: "bg-orange-500/10 text-orange-500 border-orange-500/20",
};

interface AudioViewerProps {
  audio: AudioRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export function AudioViewer({
  audio,
  open,
  onOpenChange,
  onUpdate,
}: AudioViewerProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState<"player" | "transcript">("player");

  useEffect(() => {
    if (audio) {
      setName(audio.name);
      setDescription(audio.description || "");
      setActiveTab("player");
      setTextContent(null);
    }
  }, [audio]);

  const fetchTextContent = useCallback(async () => {
    if (!audio) return;
    setLoadingContent(true);
    try {
      const res = await fetch(`/api/audios/${audio.id}`);
      const json = await res.json();
      if (json.data) {
        setTextContent(json.data.textContent);
      }
    } finally {
      setLoadingContent(false);
    }
  }, [audio]);

  useEffect(() => {
    if (open && audio && activeTab === "transcript") {
      fetchTextContent();
    }
  }, [open, audio, activeTab, fetchTextContent]);

  async function handleSave() {
    if (!audio) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/audios/${audio.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success("Audio updated");
        onUpdate();
      } else {
        toast.error("Failed to update");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleReprocess() {
    if (!audio) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/audios/${audio.id}/process`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success("Transcription started");
        onUpdate();
      } else {
        toast.error("Transcription failed");
      }
    } finally {
      setProcessing(false);
    }
  }

  function handleDownload() {
    if (!audio) return;
    const a = document.createElement("a");
    a.href = audio.fileUrl;
    a.download = audio.fileName;
    a.click();
  }

  if (!audio) return null;

  const hasChanges = name !== audio.name || description !== (audio.description || "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="sr-only">Audio Viewer</DialogTitle>
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
            <Badge variant="outline" className={`text-xs ${FILE_TYPE_STYLES[audio.fileType] || ""}`}>
              {audio.fileType}
            </Badge>
            <Badge variant="outline" className={`text-xs ${STATUS_STYLES[audio.status] || ""}`}>
              {audio.status === "PROCESSING" && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
              {audio.status}
            </Badge>
            {audio.duration != null && (
              <span className="text-xs text-muted-foreground">{formatDuration(audio.duration)}</span>
            )}
            <span className="text-xs text-muted-foreground">{formatFileSize(audio.fileSize)}</span>
            <span className="text-xs text-muted-foreground">
              Uploaded {new Date(audio.uploadedAt).toLocaleDateString()}
            </span>
            {audio.chunkCount > 0 && (
              <span className="text-xs text-muted-foreground">{audio.chunkCount} chunks</span>
            )}
            {(audio.status === "ERROR" || audio.status === "READY" || audio.status === "PENDING") && (
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
                {audio.status === "PENDING" ? "Transcribe" : "Re-transcribe"}
              </Button>
            )}
          </div>

          {/* Error message */}
          {audio.status === "ERROR" && audio.errorMessage && (
            <div className="mt-3 rounded-md bg-red-500/10 border border-red-500/20 px-3 py-2">
              <p className="text-xs text-red-500">{audio.errorMessage}</p>
            </div>
          )}

          {/* Tabs */}
          {audio.status === "READY" && (
            <div className="flex gap-1 mt-3">
              <button
                onClick={() => setActiveTab("player")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "player"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Player
              </button>
              <button
                onClick={() => setActiveTab("transcript")}
                className={`px-3 py-1 text-xs rounded-md transition-colors ${
                  activeTab === "transcript"
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Transcript
              </button>
            </div>
          )}
        </DialogHeader>

        {/* Content area */}
        <div className="flex-1 overflow-auto min-h-0">
          {audio.status === "PENDING" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Audio has not been transcribed yet. Click &ldquo;Transcribe&rdquo; to start.
            </div>
          )}

          {audio.status === "PROCESSING" && (
            <div className="flex flex-col items-center justify-center h-full gap-2">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <p className="text-sm text-muted-foreground">Transcribing audio...</p>
            </div>
          )}

          {audio.status === "ERROR" && (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              Transcription failed. Click &ldquo;Re-transcribe&rdquo; to try again.
            </div>
          )}

          {audio.status === "READY" && activeTab === "player" && (
            <div className="flex items-center justify-center p-6 h-full">
              <audio
                src={audio.fileUrl}
                controls
                className="w-full max-w-lg"
              />
            </div>
          )}

          {audio.status === "READY" && activeTab === "transcript" && (
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
                  No transcript available.
                </p>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
