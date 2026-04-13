"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  Loader2,
  Image as ImageIcon,
  Video,
  Check,
  Link2,
  Library,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { parseYouTubeId, youTubeThumbnailUrl } from "@/lib/landing-page/section-styles";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────────

export interface MediaPickerResult {
  url: string;
  thumbnailUrl?: string;
  youtubeId?: string;
}

interface MediaPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaType: "image" | "video";
  onSelect: (result: MediaPickerResult) => void;
}

interface KBImage {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  width: number | null;
  height: number | null;
  status: string;
}

interface KBVideo {
  id: string;
  name: string;
  fileUrl: string;
  mimeType: string;
  duration: number | null;
  thumbnailUrl: string | null;
  status: string;
}

const ACCEPTED_IMAGE_TYPES = ".png,.jpg,.jpeg,.webp,.gif,.svg,.tiff,.tif";
const ACCEPTED_VIDEO_TYPES = ".mp4,.mov,.webm,.avi";

// ─── Library Tab ────────────────────────────────────────────────────

function LibraryTab({
  mediaType,
  onSelect,
}: {
  mediaType: "image" | "video";
  onSelect: (result: MediaPickerResult) => void;
}) {
  const [items, setItems] = useState<(KBImage | KBVideo)[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const endpoint =
      mediaType === "image" ? "/api/images" : "/api/videos";
    fetch(endpoint)
      .then((res) => res.json())
      .then((json) => {
        const data = mediaType === "image" ? json.images : json.videos;
        setItems(data || []);
      })
      .catch(() => toast.error("Failed to load library"))
      .finally(() => setLoading(false));
  }, [mediaType]);

  const filtered = items.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = () => {
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;
    if (mediaType === "image") {
      onSelect({ url: item.fileUrl });
    } else {
      const vid = item as KBVideo;
      onSelect({
        url: vid.fileUrl,
        thumbnailUrl: vid.thumbnailUrl || undefined,
      });
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Search ${mediaType}s...`}
          className="h-8 text-xs pl-8"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          {mediaType === "image" ? (
            <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
          ) : (
            <Video className="h-8 w-8 text-muted-foreground mb-2" />
          )}
          <p className="text-xs text-muted-foreground">
            {search ? "No results found" : `No ${mediaType}s in your library yet`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1">
          {filtered.map((item) => {
            const isImage = mediaType === "image";
            const thumb = isImage
              ? (item as KBImage).fileUrl
              : (item as KBVideo).thumbnailUrl;
            const isActive = selectedId === item.id;

            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "relative aspect-video rounded-md overflow-hidden border-2 transition-all cursor-pointer group",
                  isActive
                    ? "border-blue-500 ring-2 ring-blue-500/20"
                    : "border-transparent hover:border-muted-foreground/30"
                )}
                onClick={() => setSelectedId(item.id)}
                onDoubleClick={() => {
                  setSelectedId(item.id);
                  // Select on double-click immediately
                  if (isImage) {
                    onSelect({ url: (item as KBImage).fileUrl });
                  } else {
                    const vid = item as KBVideo;
                    onSelect({
                      url: vid.fileUrl,
                      thumbnailUrl: vid.thumbnailUrl || undefined,
                    });
                  }
                }}
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    {isImage ? (
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Video className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                )}
                {/* Name overlay */}
                <div className="absolute bottom-0 inset-x-0 bg-black/60 px-1.5 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-[10px] text-white truncate">{item.name}</p>
                </div>
                {/* Selection check */}
                {isActive && (
                  <div className="absolute top-1 right-1 h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-white" />
                  </div>
                )}
                {/* Duration badge for videos */}
                {!isImage && (item as KBVideo).duration && (
                  <div className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] px-1 py-0.5 rounded">
                    {formatDuration((item as KBVideo).duration!)}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      <Button
        size="sm"
        className="w-full"
        disabled={!selectedId}
        onClick={handleConfirm}
      >
        Select {mediaType}
      </Button>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Upload Tab ─────────────────────────────────────────────────────

function UploadTab({
  mediaType,
  onSelect,
}: {
  mediaType: "image" | "video";
  onSelect: (result: MediaPickerResult) => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptTypes =
    mediaType === "image" ? ACCEPTED_IMAGE_TYPES : ACCEPTED_VIDEO_TYPES;

  const handleFileSelect = useCallback(
    (selected: File) => {
      setFile(selected);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (mediaType === "image" || selected.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        // For video, create a poster from first frame
        const video = document.createElement("video");
        video.preload = "metadata";
        video.src = URL.createObjectURL(selected);
        video.onloadeddata = () => {
          video.currentTime = 1; // seek to 1s for a meaningful frame
        };
        video.onseeked = () => {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          canvas.getContext("2d")?.drawImage(video, 0, 0);
          setPreviewUrl(canvas.toDataURL("image/jpeg"));
          URL.revokeObjectURL(video.src);
        };
      }
    },
    [mediaType, previewUrl]
  );

  async function handleUpload() {
    if (!file) return;
    setUploading(true);
    try {
      const endpoint =
        mediaType === "image"
          ? "/api/images/upload"
          : "/api/videos/upload";

      // Step 1: Upload the file
      const formData = new FormData();
      formData.append("file", file);
      const uploadRes = await fetch(endpoint, { method: "POST", body: formData });
      if (!uploadRes.ok) {
        const err = await uploadRes.json().catch(() => null);
        throw new Error(err?.error || "Upload failed");
      }
      const uploadJson = await uploadRes.json();

      // Step 2: Create the KB record
      const recordEndpoint =
        mediaType === "image" ? "/api/images" : "/api/videos";
      const name = file.name.replace(/\.[^/.]+$/, "");
      const body: Record<string, unknown> = {
        name,
        fileType: uploadJson.data.fileType,
        fileName: uploadJson.data.fileName,
        fileUrl: uploadJson.data.fileUrl,
        fileSize: uploadJson.data.fileSize,
        mimeType: uploadJson.data.mimeType,
      };
      if (mediaType === "image") {
        body.width = uploadJson.data.width;
        body.height = uploadJson.data.height;
      } else {
        body.duration = uploadJson.data.duration;
        body.thumbnailUrl = uploadJson.data.thumbnailUrl;
      }
      const recordRes = await fetch(recordEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!recordRes.ok) throw new Error("Failed to save record");
      const recordJson = await recordRes.json();

      // Step 3: Fire-and-forget processing
      const processEndpoint =
        mediaType === "image"
          ? `/api/images/${recordJson.data.id}/process`
          : `/api/videos/${recordJson.data.id}/process`;
      fetch(processEndpoint, { method: "POST" }).catch(() => {});

      toast.success(`${mediaType === "image" ? "Image" : "Video"} uploaded`);

      // Return the result
      if (mediaType === "image") {
        onSelect({ url: uploadJson.data.fileUrl });
      } else {
        onSelect({
          url: uploadJson.data.fileUrl,
          thumbnailUrl: uploadJson.data.thumbnailUrl || undefined,
        });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "relative rounded-lg border-2 border-dashed p-6 text-center transition-colors cursor-pointer",
          dragOver
            ? "border-blue-500 bg-blue-500/5"
            : "border-muted-foreground/20 hover:border-muted-foreground/40"
        )}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
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
          accept={acceptTypes}
          className="hidden"
          onChange={(e) => {
            const selected = e.target.files?.[0];
            if (selected) handleFileSelect(selected);
          }}
        />
        {file && previewUrl ? (
          <div className="flex flex-col items-center gap-2">
            <img
              src={previewUrl}
              alt={file.name}
              className="max-h-28 max-w-full rounded-md object-contain"
            />
            <p className="text-xs font-medium truncate max-w-full">{file.name}</p>
            <p className="text-[10px] text-muted-foreground">
              {file.size < 1024 * 1024
                ? `${(file.size / 1024).toFixed(1)} KB`
                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`}
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <Upload className="h-6 w-6 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">
              Drop {mediaType === "image" ? "an image" : "a video"} here or click
              to browse
            </p>
            <p className="text-[10px] text-muted-foreground">
              {mediaType === "image"
                ? "PNG, JPG, WEBP, GIF, SVG"
                : "MP4, MOV, WEBM, AVI"}
            </p>
          </div>
        )}
      </div>

      <Button
        size="sm"
        className="w-full"
        disabled={!file || uploading}
        onClick={handleUpload}
      >
        {uploading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="h-3.5 w-3.5 mr-1.5" />
            Upload & Select
          </>
        )}
      </Button>
    </div>
  );
}

// ─── URL Tab ────────────────────────────────────────────────────────

function UrlTab({
  mediaType,
  onSelect,
}: {
  mediaType: "image" | "video";
  onSelect: (result: MediaPickerResult) => void;
}) {
  const [url, setUrl] = useState("");
  const [imgError, setImgError] = useState(false);

  const youtubeId = mediaType === "video" ? parseYouTubeId(url) : null;
  const posterUrl = youtubeId ? youTubeThumbnailUrl(youtubeId) : null;

  const isValid =
    url.trim().length > 0 &&
    (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("/"));

  function handleConfirm() {
    if (!isValid) return;
    if (youtubeId) {
      onSelect({ url, youtubeId, thumbnailUrl: posterUrl || undefined });
    } else {
      onSelect({ url });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="space-y-1.5">
        <Label className="text-xs">
          {mediaType === "image" ? "Image URL" : "Video URL"}
        </Label>
        <Input
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setImgError(false);
          }}
          placeholder={
            mediaType === "image"
              ? "https://example.com/image.jpg"
              : "YouTube URL or direct video URL"
          }
          className="h-8 text-xs"
        />
      </div>

      {/* Preview */}
      {mediaType === "image" && url && isValid && !imgError && (
        <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted border">
          <img
            src={url}
            alt="Preview"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        </div>
      )}
      {mediaType === "image" && imgError && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted rounded-md">
          <ImageIcon className="h-4 w-4" />
          <span>Unable to load image</span>
        </div>
      )}
      {mediaType === "video" && youtubeId && posterUrl && (
        <div className="relative w-full h-32 rounded-md overflow-hidden bg-muted border">
          <img
            src={posterUrl}
            alt="YouTube thumbnail"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
            <svg width="40" height="28" viewBox="0 0 68 48">
              <path
                d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
                fill="red"
              />
              <path d="M45 24L27 14v20" fill="white" />
            </svg>
          </div>
          <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] px-1.5 py-0.5 rounded">
            YouTube
          </div>
        </div>
      )}
      {mediaType === "video" && url && isValid && !youtubeId && (
        <p className="text-[10px] text-muted-foreground">
          Direct video URL detected. Video will play as background on published page.
        </p>
      )}

      <Button
        size="sm"
        className="w-full"
        disabled={!isValid}
        onClick={handleConfirm}
      >
        <Link2 className="h-3.5 w-3.5 mr-1.5" />
        Use this URL
      </Button>
    </div>
  );
}

// ─── Main Dialog ────────────────────────────────────────────────────

export function MediaPickerDialog({
  open,
  onOpenChange,
  mediaType,
  onSelect,
}: MediaPickerDialogProps) {
  const handleSelect = (result: MediaPickerResult) => {
    onSelect(result);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mediaType === "image" ? "Select Image" : "Select Video"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="library">
          <TabsList className="w-full">
            <TabsTrigger value="library">
              <Library className="h-3.5 w-3.5 mr-1" />
              Library
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="h-3.5 w-3.5 mr-1" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="url">
              <Link2 className="h-3.5 w-3.5 mr-1" />
              URL
            </TabsTrigger>
          </TabsList>

          <TabsContent value="library">
            <LibraryTab mediaType={mediaType} onSelect={handleSelect} />
          </TabsContent>

          <TabsContent value="upload">
            <UploadTab mediaType={mediaType} onSelect={handleSelect} />
          </TabsContent>

          <TabsContent value="url">
            <UrlTab mediaType={mediaType} onSelect={handleSelect} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
