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
import { Upload, Loader2, FileUp } from "lucide-react";
import { toast } from "sonner";

interface KnowledgeUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  folderId?: string | null;
}

const ACCEPTED_TYPES = ".pdf,.docx,.txt,.md,.csv";

export function KnowledgeUploadModal({ open, onOpenChange, onComplete, folderId }: KnowledgeUploadModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setName("");
    setDescription("");
    setFile(null);
    setUploading(false);
    setDragOver(false);
  }

  function handleFileSelect(selectedFile: File) {
    setFile(selectedFile);
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
      const uploadRes = await fetch("/api/knowledge/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => null);
        toast.error(err?.error || "File upload failed");
        return;
      }
      const uploadJson = await uploadRes.json();

      // Step 2: Create document record
      const docRes = await fetch("/api/knowledge/documents", {
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
          folderId: folderId || undefined,
        }),
      });
      if (!docRes.ok) { toast.error("Failed to save document"); return; }
      const docJson = await docRes.json();

      // Trigger processing (fire-and-forget)
      fetch(`/api/knowledge/documents/${docJson.data.id}/process`, {
        method: "POST",
      }).catch(() => {});

      toast.success("Document uploaded. Processing started...");
      reset();
      onOpenChange(false);
      onComplete();
    } finally {
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!uploading) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
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
              <div className="flex flex-col items-center gap-1">
                <FileUp className="h-8 w-8 text-brand" />
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Drop a file here or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  PDF, DOCX, TXT, MD, or CSV
                </p>
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this document about?"
              rows={2}
            />
          </div>

          <Button onClick={handleUpload} disabled={uploading || !file} className="w-full">
            {uploading ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading...</>
            ) : (
              <><Upload className="h-3.5 w-3.5 mr-1.5" />Upload Document</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
