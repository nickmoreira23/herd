"use client";

import { useState, useRef, useCallback } from "react";
import { Paperclip, X, Image, FileText, Music, Video, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ─────────────────────────────────────────────────────

export interface PendingAttachment {
  id: string;
  type: "image" | "audio" | "video" | "document";
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
  previewUrl?: string;
}

interface MediaInputProps {
  /** Which attachment types the agent accepts */
  accepts: {
    images?: boolean;
    audio?: boolean;
    video?: boolean;
    documents?: boolean;
  };
  /** Currently attached files */
  attachments: PendingAttachment[];
  /** Called when new attachments are added */
  onAttach: (attachments: PendingAttachment[]) => void;
  /** Called when an attachment is removed */
  onRemove: (id: string) => void;
  disabled?: boolean;
}

// ─── MIME accept strings ───────────────────────────────────────

function buildAcceptString(accepts: MediaInputProps["accepts"]): string {
  const parts: string[] = [];
  if (accepts.images) parts.push("image/jpeg,image/png,image/gif,image/webp");
  if (accepts.audio) parts.push("audio/mpeg,audio/wav,audio/ogg,audio/flac,audio/aac,audio/mp4");
  if (accepts.video) parts.push("video/mp4,video/quicktime,video/webm");
  if (accepts.documents) parts.push("application/pdf,.docx,text/plain,text/markdown,text/csv");
  return parts.join(",");
}

// ─── Type icon ─────────────────────────────────────────────────

const typeIcons = {
  image: Image,
  audio: Music,
  video: Video,
  document: FileText,
};

// ─── Component ─────────────────────────────────────────────────

export function MediaInput({
  accepts,
  attachments,
  onAttach,
  onRemove,
  disabled,
}: MediaInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasAnyAccept =
    accepts.images || accepts.audio || accepts.video || accepts.documents;

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setIsUploading(true);

      const newAttachments: PendingAttachment[] = [];

      for (const file of Array.from(files)) {
        try {
          const formData = new FormData();
          formData.append("file", file);

          const res = await fetch("/api/chat/upload", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            const json = await res.json().catch(() => ({}));
            console.error("Upload failed:", (json as { error?: string }).error || res.statusText);
            continue;
          }

          const data = await res.json();
          const info = data.data as {
            type: string;
            fileName: string;
            fileUrl: string;
            fileSize: number;
            mimeType: string;
          };

          const attachment: PendingAttachment = {
            id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: info.type as PendingAttachment["type"],
            fileName: info.fileName,
            fileUrl: info.fileUrl,
            mimeType: info.mimeType,
            fileSize: info.fileSize,
            previewUrl: info.type === "image" ? info.fileUrl : undefined,
          };
          newAttachments.push(attachment);
        } catch (err) {
          console.error("Upload error:", err);
        }
      }

      if (newAttachments.length > 0) {
        onAttach(newAttachments);
      }

      setIsUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [onAttach]
  );

  if (!hasAnyAccept) return null;

  return (
    <div className="flex flex-col gap-1.5">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {attachments.map((att) => {
            const Icon = typeIcons[att.type] || FileText;
            return (
              <div
                key={att.id}
                className="relative flex items-center gap-1.5 rounded-lg border bg-muted/50 px-2 py-1 text-xs"
              >
                {att.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={att.previewUrl}
                    alt={att.fileName}
                    className="h-8 w-8 rounded object-cover"
                  />
                ) : (
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                )}
                <span className="max-w-[120px] truncate">{att.fileName}</span>
                <button
                  onClick={() => onRemove(att.id)}
                  className="ml-0.5 rounded-full p-0.5 hover:bg-accent"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Attach button */}
      <div className="flex items-center">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={buildAcceptString(accepts)}
          className="hidden"
          onChange={handleFileSelect}
          disabled={disabled || isUploading}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isUploading}
          className={cn(
            "flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/50",
            (disabled || isUploading) && "opacity-50 cursor-not-allowed"
          )}
          title="Attach file"
        >
          {isUploading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Paperclip className="h-3.5 w-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
