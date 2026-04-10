"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Loader2, FileUp } from "lucide-react";
import { toast } from "sonner";

interface DocumentUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

const CATEGORIES = [
  { value: "CONTRACT", label: "Contract" },
  { value: "TERMS", label: "Terms" },
  { value: "PRESENTATION", label: "Presentation" },
  { value: "POLICY", label: "Policy" },
  { value: "OTHER", label: "Other" },
];

export function DocumentUploadModal({ open, onOpenChange, onComplete }: DocumentUploadModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("OTHER");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setName("");
    setDescription("");
    setCategory("OTHER");
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
      // Upload file
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) { toast.error("File upload failed"); return; }
      const uploadJson = await uploadRes.json();

      // Create document record
      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          category,
          fileName: uploadJson.data.fileName,
          fileUrl: uploadJson.data.fileUrl,
          fileSize: uploadJson.data.fileSize,
          mimeType: uploadJson.data.mimeType,
        }),
      });
      if (!docRes.ok) { toast.error("Failed to save document"); return; }

      toast.success("Document uploaded");
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
              </div>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-1.5">
            <Label className="text-xs">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={(v) => v && setCategory(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
