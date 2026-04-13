"use client";

import { useState, useRef, useCallback } from "react";
import {
  ImageIcon,
  Film,
  Upload,
  Loader2,
  X,
  Expand,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import type { CellRendererProps, CellEditorProps } from "./index";

// ─── Types ─────────────────────────────────────────────────────

export interface MediaValue {
  url: string;
  filename: string;
  size: number;
  type: string;
  mediaType: "image" | "video";
}

function isMediaValue(v: unknown): v is MediaValue {
  return (
    typeof v === "object" &&
    v !== null &&
    "url" in v &&
    "mediaType" in v
  );
}

/** Normalize cell value to an array of MediaValue. Supports legacy single object. */
function toMediaArray(value: unknown): MediaValue[] {
  if (Array.isArray(value)) return value.filter(isMediaValue);
  if (isMediaValue(value)) return [value];
  return [];
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Gallery Modal ─────────────────────────────────────────────

function MediaGalleryModal({
  items,
  initialIndex,
  onClose,
}: {
  items: MediaValue[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const current = items[index];
  if (!current) return null;

  const hasPrev = index > 0;
  const hasNext = index < items.length - 1;

  const goPrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasPrev) setIndex(index - 1);
  };
  const goNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasNext) setIndex(index + 1);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === "ArrowLeft" && hasPrev) setIndex(index - 1);
        if (e.key === "ArrowRight" && hasNext) setIndex(index + 1);
        if (e.key === "Escape") onClose();
      }}
      tabIndex={0}
    >
      <div
        className="relative max-w-[90vw] max-h-[90vh] flex flex-col items-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white hover:text-white/80 transition-colors z-10"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Navigation arrows */}
        {items.length > 1 && hasPrev && (
          <button
            onClick={goPrev}
            className="absolute left-[-48px] top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-8 w-8" />
          </button>
        )}
        {items.length > 1 && hasNext && (
          <button
            onClick={goNext}
            className="absolute right-[-48px] top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors"
          >
            <ChevronRight className="h-8 w-8" />
          </button>
        )}

        {/* Media content */}
        {current.mediaType === "image" ? (
          <img
            src={current.url}
            alt={current.filename}
            className="max-w-[90vw] max-h-[80vh] object-contain rounded-lg"
          />
        ) : (
          <video
            key={current.url}
            src={current.url}
            controls
            autoPlay
            className="max-w-[90vw] max-h-[80vh] rounded-lg"
          />
        )}

        {/* Footer info */}
        <div className="mt-3 text-center text-white/70 text-xs">
          {current.filename} &middot; {formatSize(current.size)}
          {items.length > 1 && (
            <span className="ml-2 text-white/50">
              {index + 1} / {items.length}
            </span>
          )}
        </div>

        {/* Thumbnail strip */}
        {items.length > 1 && (
          <div className="flex items-center gap-1.5 mt-3">
            {items.map((item, i) => (
              <button
                key={item.url}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                className={`w-10 h-10 rounded overflow-hidden border-2 transition-colors flex-shrink-0 ${
                  i === index
                    ? "border-white"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                {item.mediaType === "image" ? (
                  <img
                    src={item.url}
                    alt={item.filename}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Film className="h-3 w-3 text-muted-foreground" />
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Renderer ──────────────────────────────────────────────────

export function MediaCellRenderer({ value }: CellRendererProps) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);
  const items = toMediaArray(value);

  if (items.length === 0) {
    return (
      <span className="text-muted-foreground/50 text-xs italic">
        No media
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1 cursor-pointer group/media">
        {/* Show up to 3 thumbnails */}
        {items.slice(0, 3).map((item, i) => (
          <div
            key={item.url}
            className="relative w-8 h-8 rounded overflow-hidden bg-muted flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              setGalleryIndex(i);
            }}
          >
            {item.mediaType === "image" ? (
              <img
                src={item.url}
                alt={item.filename}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Film className="h-3.5 w-3.5 text-muted-foreground" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover/media:bg-black/30 transition-colors flex items-center justify-center">
              <Expand className="h-3 w-3 text-white opacity-0 group-hover/media:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
        {/* Overflow count */}
        {items.length > 3 && (
          <div
            className="w-8 h-8 rounded bg-muted flex items-center justify-center flex-shrink-0 text-[10px] font-medium text-muted-foreground"
            onClick={(e) => {
              e.stopPropagation();
              setGalleryIndex(3);
            }}
          >
            +{items.length - 3}
          </div>
        )}
        {/* Single item: show filename */}
        {items.length === 1 && (
          <span className="text-xs truncate max-w-[100px] text-muted-foreground">
            {items[0].filename}
          </span>
        )}
        {/* Multiple items: show count */}
        {items.length > 1 && items.length <= 3 && (
          <span className="text-[10px] text-muted-foreground ml-0.5">
            {items.length} files
          </span>
        )}
      </div>

      {galleryIndex !== null && (
        <MediaGalleryModal
          items={items}
          initialIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      )}
    </>
  );
}

// ─── Editor ────────────────────────────────────────────────────

export function MediaCellEditor({
  value,
  field,
  onChange,
  onCommit,
  onCancel,
}: CellEditorProps) {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const items = toMediaArray(value);

  const uploadFile = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch(
          `/api/tables/${field.tableId}/upload`,
          { method: "POST", body: formData }
        );

        if (!res.ok) {
          const err = await res.json().catch(() => null);
          toast.error(err?.error || "Upload failed");
          return;
        }

        const json = await res.json();
        if (json.data) {
          const newItems = [...items, json.data];
          onChange(newItems);
          onCommit();
        }
      } catch {
        toast.error("Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [field.tableId, items, onChange, onCommit]
  );

  const uploadFiles = useCallback(
    async (files: FileList) => {
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
    },
    [uploadFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(false);

      if (e.dataTransfer.files.length > 0) {
        uploadFiles(e.dataTransfer.files);
      }
    },
    [uploadFiles]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        uploadFiles(e.target.files);
      }
    },
    [uploadFiles]
  );

  const handleRemove = useCallback(
    (idx: number, e: React.MouseEvent) => {
      e.stopPropagation();
      const newItems = items.filter((_, i) => i !== idx);
      onChange(newItems.length > 0 ? newItems : null);
      onCommit();
    },
    [items, onChange, onCommit]
  );

  if (uploading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Uploading...</span>
      </div>
    );
  }

  return (
    <div className="p-1 space-y-1.5">
      {/* Existing media items */}
      {items.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {items.map((media, i) => (
            <div
              key={media.url}
              className="relative w-10 h-10 rounded overflow-hidden bg-muted group/thumb"
            >
              {media.mediaType === "image" ? (
                <img
                  src={media.url}
                  alt={media.filename}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              <button
                onClick={(e) => handleRemove(i, e)}
                className="absolute top-0 right-0 bg-black/60 rounded-bl p-0.5 opacity-0 group-hover/thumb:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5 text-white" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add more / initial drop zone */}
      <div
        className={`flex items-center justify-center gap-1.5 p-2 border-2 border-dashed rounded transition-colors cursor-pointer ${
          dragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/20 hover:border-muted-foreground/40"
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onCancel();
        }}
      >
        {items.length > 0 ? (
          <Plus className="h-3.5 w-3.5 text-muted-foreground" />
        ) : (
          <Upload className="h-3.5 w-3.5 text-muted-foreground" />
        )}
        <span className="text-[10px] text-muted-foreground">
          {items.length > 0 ? "Add more" : "Drop files or click"}
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
}
