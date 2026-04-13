"use client";

import { Image, Play, FileText, Presentation, ExternalLink } from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────

export interface MediaOutputItem {
  type: "image" | "audio" | "video" | "presentation";
  url: string;
  mimeType?: string;
  fileName?: string;
  title?: string;
}

interface MediaOutputProps {
  items: MediaOutputItem[];
}

// ─── Component ─────────────────────────────────────────────────

export function MediaOutput({ items }: MediaOutputProps) {
  if (items.length === 0) return null;

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <MediaCard key={`${item.type}-${i}`} item={item} />
      ))}
    </div>
  );
}

function MediaCard({ item }: { item: MediaOutputItem }) {
  switch (item.type) {
    case "image":
      return (
        <div className="rounded-lg border overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt={item.fileName || "Generated image"}
            className="w-full max-h-[300px] object-contain bg-muted/30"
          />
          <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground border-t">
            <Image className="h-3 w-3" />
            <span>Generated Image</span>
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto hover:text-foreground"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      );

    case "audio":
      return (
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-2">
            <Play className="h-3 w-3" />
            <span>{item.fileName || "Generated Audio"}</span>
          </div>
          <audio controls className="w-full h-8" preload="metadata">
            <source src={item.url} type={item.mimeType || "audio/mpeg"} />
          </audio>
        </div>
      );

    case "video":
      return (
        <div className="rounded-lg border overflow-hidden">
          <video
            controls
            className="w-full max-h-[300px]"
            preload="metadata"
          >
            <source src={item.url} type={item.mimeType || "video/mp4"} />
          </video>
          <div className="flex items-center gap-2 px-3 py-1.5 text-[11px] text-muted-foreground border-t">
            <Play className="h-3 w-3" />
            <span>Generated Video</span>
          </div>
        </div>
      );

    case "presentation":
      return (
        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-500/10">
            <Presentation className="h-5 w-5 text-orange-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {item.title || "Generated Presentation"}
            </p>
            <p className="text-[11px] text-muted-foreground">
              Click to open in Gamma
            </p>
          </div>
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </a>
      );

    default:
      return (
        <div className="rounded-lg border p-3 text-xs text-muted-foreground">
          <FileText className="h-4 w-4 inline mr-1" />
          <a href={item.url} target="_blank" rel="noopener noreferrer">
            {item.fileName || item.url}
          </a>
        </div>
      );
  }
}
