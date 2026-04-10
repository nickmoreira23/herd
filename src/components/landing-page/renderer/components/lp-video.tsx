"use client";

import { useState } from "react";
import type { ComponentRendererProps } from "../component-renderer";
import { componentStylesToCSS } from "../component-renderer";
import { parseYouTubeId } from "@/lib/landing-page/section-styles";

// ─── URL Parsers ─────────────────────────────────────────────────────

function getVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match ? match[1] : null;
}

// ─── Lite YouTube Embed ──────────────────────────────────────────────

function LiteYouTube({
  videoId,
  style,
}: {
  videoId: string;
  style: React.CSSProperties;
}) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
        style={{
          ...style,
          border: "none",
          aspectRatio: style.aspectRatio || "16/9",
          width: style.width || "100%",
        }}
        allow="autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      style={{
        ...style,
        position: "relative",
        cursor: "pointer",
        border: "none",
        padding: 0,
        background: "#000",
        aspectRatio: style.aspectRatio || "16/9",
        width: style.width || "100%",
        overflow: "hidden",
        display: "block",
      }}
      aria-label="Play video"
    >
      {/* Thumbnail */}
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt="Video thumbnail"
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />
      {/* Play button */}
      <svg
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 68,
          height: 48,
        }}
        viewBox="0 0 68 48"
      >
        <path
          d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
          fill="red"
        />
        <path d="M45 24L27 14v20" fill="white" />
      </svg>
    </button>
  );
}

// ─── Lite Vimeo Embed ────────────────────────────────────────────────

function LiteVimeo({
  videoId,
  style,
}: {
  videoId: string;
  style: React.CSSProperties;
}) {
  const [activated, setActivated] = useState(false);

  if (activated) {
    return (
      <iframe
        src={`https://player.vimeo.com/video/${videoId}?autoplay=1`}
        style={{
          ...style,
          border: "none",
          aspectRatio: style.aspectRatio || "16/9",
          width: style.width || "100%",
        }}
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        loading="lazy"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setActivated(true)}
      style={{
        ...style,
        position: "relative",
        cursor: "pointer",
        border: "none",
        padding: 0,
        background: "#1a1a2e",
        aspectRatio: style.aspectRatio || "16/9",
        width: style.width || "100%",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label="Play video"
    >
      {/* Play button */}
      <svg width="68" height="48" viewBox="0 0 68 48">
        <rect width="68" height="48" rx="8" fill="rgba(255,255,255,0.2)" />
        <path d="M45 24L27 14v20" fill="white" />
      </svg>
    </button>
  );
}

// ─── Direct Video ────────────────────────────────────────────────────

function DirectVideo({
  url,
  controls,
  autoplay,
  style,
}: {
  url: string;
  controls: boolean;
  autoplay: boolean;
  style: React.CSSProperties;
}) {
  return (
    <video
      src={url}
      controls={controls}
      autoPlay={autoplay}
      muted={autoplay}
      playsInline
      preload={autoplay ? "auto" : "none"}
      style={{
        ...style,
        width: style.width || "100%",
        aspectRatio: style.aspectRatio || "16/9",
      }}
    />
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export function LpVideo({ node, isEditor }: ComponentRendererProps) {
  const url = (node.props.url as string) || "";
  const controls = (node.props.controls as boolean) ?? true;
  const autoplay = (node.props.autoplay as boolean) ?? false;
  const style = componentStylesToCSS(node.styles);

  if (!url) {
    if (isEditor) {
      return (
        <div
          style={{ ...style, minHeight: 120, aspectRatio: "16/9" }}
          className="flex items-center justify-center bg-muted rounded text-xs text-muted-foreground"
        >
          No video URL set
        </div>
      );
    }
    return null;
  }

  const youtubeId = parseYouTubeId(url);
  const vimeoId = getVimeoId(url);

  // Editor preview: simple thumbnail
  if (isEditor) {
    if (youtubeId) {
      return (
        <div style={{ ...style, position: "relative", aspectRatio: "16/9" }}>
          <img
            src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
            alt="Video thumbnail"
            style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: style.borderRadius }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0,0,0,0.3)",
              borderRadius: style.borderRadius,
            }}
          >
            <svg width="48" height="34" viewBox="0 0 68 48">
              <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55C3.97 2.33 2.27 4.81 1.48 7.74.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="red" />
              <path d="M45 24L27 14v20" fill="white" />
            </svg>
          </div>
        </div>
      );
    }
    return (
      <div
        style={{ ...style, minHeight: 120, aspectRatio: "16/9" }}
        className="flex items-center justify-center bg-muted rounded text-xs text-muted-foreground"
      >
        Video: {url}
      </div>
    );
  }

  // Published mode: lite embeds
  if (youtubeId) return <LiteYouTube videoId={youtubeId} style={style} />;
  if (vimeoId) return <LiteVimeo videoId={vimeoId} style={style} />;

  return <DirectVideo url={url} controls={controls} autoplay={autoplay} style={style} />;
}
