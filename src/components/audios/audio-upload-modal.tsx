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
import { Upload, Loader2, Music } from "lucide-react";
import { useT } from "@/lib/i18n/locale-context";
import { notifyError, notifySuccess } from "@/lib/i18n/notify";

interface AudioUploadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  folderId?: string | null;
}

const ACCEPTED_TYPES = ".mp3,.wav,.ogg,.flac,.aac,.m4a";

export function AudioUploadModal({ open, onOpenChange, onComplete, folderId }: AudioUploadModalProps) {
  const t = useT();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reset() {
    setName("");
    setDescription("");
    setFile(null);
    setUploading(false);
    setDragOver(false);
    setAudioReady(false);
  }

  function handleFileSelect(selectedFile: File) {
    setFile(selectedFile);
    setAudioReady(false);
    if (!name) setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
  }

  async function handleUpload() {
    if (!file) { notifyError("error.audios.select_file", t); return; }
    if (!name.trim()) { notifyError("error.audios.name_required", t); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch("/api/audios/upload", {
        method: "POST",
        body: formData,
      });
      if (!uploadRes.ok) {
        throw new Error("upload");
      }
      const uploadJson = await uploadRes.json();

      const audioRes = await fetch("/api/audios", {
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
          folderId: folderId || undefined,
        }),
      });
      if (!audioRes.ok) throw new Error("save");
      const audioJson = await audioRes.json();

      fetch(`/api/audios/${audioJson.data.id}/process`, {
        method: "POST",
      }).catch(() => {});

      notifySuccess("audios.feedback.uploaded", t);
      reset();
      onOpenChange(false);
      onComplete();
    } catch (err) {
      const code =
        err instanceof Error && err.message === "save"
          ? "error.audios.save_failed"
          : "error.audios.upload_failed";
      notifyError(code, t);
      setUploading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!uploading) { onOpenChange(v); if (!v) reset(); } }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("audios.upload.title")}</DialogTitle>
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
                <Music className="h-8 w-8 text-brand shrink-0" />
                <p className="text-sm font-medium truncate max-w-full px-2" title={file.name}>{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {file.size < 1024 * 1024
                    ? `${(file.size / 1024).toFixed(1)} KB`
                    : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
                </p>
                <audio
                  src={URL.createObjectURL(file)}
                  controls
                  className="w-full max-w-xs mt-2"
                  onCanPlay={() => setAudioReady(true)}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Upload className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  {t("audios.upload.drop_here")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("audios.upload.accepted_formats")}
                </p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("audios.upload.transcription_note")}
          </p>

          {/* Fields */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t("audios.upload.field_name")}</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("audios.upload.field_name_placeholder")}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{t("audios.upload.field_description")}</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("audios.upload.field_description_placeholder")}
              rows={2}
            />
          </div>

          <Button onClick={handleUpload} disabled={uploading || !file || !audioReady} className="w-full">
            {uploading ? (
              <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />{t("audios.upload.button_uploading")}</>
            ) : (
              <><Upload className="h-3.5 w-3.5 mr-1.5" />{t("audios.upload.button_idle")}</>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
