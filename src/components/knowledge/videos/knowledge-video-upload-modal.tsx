"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, Loader2, Video } from "lucide-react";
import { toast } from "sonner";

interface KnowledgeVideoUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  folderId?: string | null;
}

const ACCEPTED_TYPES = ".mp4,.mov,.webm,.avi";

export function KnowledgeVideoUploadModal({ open, onOpenChange, onComplete, folderId }: KnowledgeVideoUploadModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setName("");
    setDescription("");
    setFile(null);
    setUploading(false);
    setDragOver(false);
    setVideoReady(false);
  }

  function handleFileSelect(selectedFile: File) {
    setFile(selectedFile);
    setVideoReady(false);
    if (!name) setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
  }

  async function handleUpload() {
    if (!file) { toast.error("Select a file"); return; }
    if (!name.trim()) { toast.error("Name is required"); return; }

    setUploading(true);
    try {
      // Step 1: Upload file
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/knowledge/videos/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => null);
        throw new Error(err?.error || "File upload failed");
      }
      const uploadJson = await uploadRes.json();

      // Step 2: Create video record
      const videoRes = await fetch("/api/knowledge/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          fileType: uploadJson.data.fileType,
          fileName: uploadJson.data.fileName,
          fileUrl: uploadJson.data.fileUrl,
          fileSize: uploadJson.data.fileSize,
          mimeType: uploadJson.data.mimeType,
          duration: uploadJson.data.duration,
          thumbnailUrl: uploadJson.data.thumbnailUrl,
          folderId: folderId || undefined,
        }),
      });
      if (!videoRes.ok) throw new Error("Failed to save video");
      const videoJson = await videoRes.json();

      // Trigger processing (fire-and-forget)
      fetch(`/api/knowledge/videos/${videoJson.data.id}/process`, {
        method: "POST",
      }).catch(() => {});

      toast.success("Video uploaded. Transcription started...");
      reset();
      onOpenChange(false);
      onComplete();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!uploading) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Video</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-colors cursor-pointer ${
              dragOver ? "border-brand bg-brand/5" : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400"
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const dropped = e.dataTransfer.files[0];
              if (dropped) handleFileSelect(dropped);
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_TYPES}
              className="hidden"
              onChange={(e) => {
                const selected = e.target.files?.[0];
                if (selected) handleFileSelect(selected);
              }}
            />
            {file ? (
              <div className="flex flex-col items-center gap-2 max-w-full overflow-hidden">
                <Video className="h-8 w-8 text-brand shrink-0" />
                <p className="text-sm font-medium truncate max-w-full px-2" title={file.name}>{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                </p>
                <video
                  src={URL.createObjectURL(file)}
                  controls
                  muted
                  className="max-h-40 rounded-md mt-2"
                  onCanPlay={() => setVideoReady(true)}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop a file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  MP4, MOV, WEBM, or AVI
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">Videos will be transcribed with speaker diarization</p>

          {/* Fields */}
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Video name" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this video about?"
              rows={2}
            />
          </div>

          <Button onClick={handleUpload} disabled={uploading || !file || !videoReady} className="w-full">
            {uploading ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading...</>
            ) : (
              <><Upload className="h-3.5 w-3.5 mr-1.5" />Upload Video</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
