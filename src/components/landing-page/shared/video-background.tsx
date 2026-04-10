"use client";

import { useEffect, useRef, useState } from "react";
import type { SectionBackground } from "@/types/landing-page";
import { youTubeThumbnailUrl } from "@/lib/landing-page/section-styles";
import { Play } from "lucide-react";

interface VideoBackgroundProps {
  background: SectionBackground;
  isEditor?: boolean;
}

/**
 * Renders a video (or poster fallback) as an absolute-positioned background layer.
 *
 * Following Vidyard best practices:
 * - Muted is required for autoplay (browser policy)
 * - playsinline for iOS
 * - Poster image for instant visual feedback
 * - preload="metadata" (not "auto") to avoid unnecessary bandwidth
 * - prefers-reduced-motion: hides video, poster CSS background shows instead
 * - saveData: skip video autoplay on metered connections
 *
 * YouTube backgrounds:
 * - Editor: poster image only (to avoid perf issues)
 * - Published: YouTube iframe embed with autoplay, muted, loop, no controls,
 *   scaled up to hide letterboxing and UI chrome
 */
export function VideoBackground({ background, isEditor = false }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [shouldPlay, setShouldPlay] = useState(false);
  const settings = background.videoSettings ?? { muted: true, loop: true, autoplay: true };

  const posterUrl =
    background.posterUrl ||
    (background.youtubeId ? youTubeThumbnailUrl(background.youtubeId) : undefined);

  // Determine if we should attempt video playback (published mode only)
  useEffect(() => {
    if (isEditor) {
      setShouldPlay(false);
      return;
    }

    // Check for save-data / reduced motion preferences
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const saveData =
      "connection" in navigator &&
      (navigator as unknown as { connection: { saveData: boolean } }).connection
        ?.saveData;

    if (prefersReducedMotion || saveData) {
      setShouldPlay(false);
      return;
    }

    // Play if autoplay is enabled and there's a video source (direct or YouTube)
    if (settings.autoplay && (background.videoUrl || background.youtubeId)) {
      setShouldPlay(true);
    }
  }, [isEditor, settings.autoplay, background.videoUrl, background.youtubeId]);

  // ─── YouTube backgrounds ─────────────────────────────────────────
  if (background.youtubeId) {
    // Editor: show poster with badge (no iframe for performance)
    if (isEditor) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            overflow: "hidden",
          }}
          aria-hidden="true"
        >
          {posterUrl && (
            <img
              src={posterUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "rgba(0,0,0,0.6)",
              color: "white",
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Play style={{ width: 10, height: 10 }} />
            YouTube BG
          </div>
        </div>
      );
    }

    // Published: render YouTube iframe as background video
    // Build embed URL with background-friendly params
    const ytParams = new URLSearchParams({
      autoplay: settings.autoplay ? "1" : "0",
      mute: "1", // Must be muted for autoplay — browser policy
      loop: settings.loop ? "1" : "0",
      playlist: background.youtubeId, // Required for YouTube loop to work
      controls: "0",
      showinfo: "0",
      rel: "0",
      modestbranding: "1",
      iv_load_policy: "3", // Hide annotations
      disablekb: "1",
      fs: "0",
      playsinline: "1",
    });
    const ytEmbedUrl = `https://www.youtube.com/embed/${background.youtubeId}?${ytParams.toString()}`;

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        {/* Poster image as immediate fallback while iframe loads */}
        {posterUrl && (
          <img
            src={posterUrl}
            alt=""
            style={{
              position: "absolute",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              zIndex: 0,
            }}
          />
        )}

        {shouldPlay && (
          <iframe
            src={ytEmbedUrl}
            allow="autoplay; encrypted-media"
            style={{
              // Scale up the iframe to crop out YouTube's UI chrome and
              // eliminate letterboxing — ensures full cover like object-fit: cover
              position: "absolute",
              top: "50%",
              left: "50%",
              width: "120%",
              height: "120%",
              transform: "translate(-50%, -50%)",
              border: "none",
              pointerEvents: "none", // Clicks pass through to section content
              zIndex: 1,
            }}
            tabIndex={-1}
            loading="lazy"
          />
        )}

        {/* Hide iframe when user prefers reduced motion */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media (prefers-reduced-motion: reduce) {
                iframe { display: none !important; }
              }
            `,
          }}
        />
      </div>
    );
  }

  // ─── Self-hosted / direct video ──────────────────────────────────
  if (background.videoUrl) {
    // Editor: show poster with badge
    if (isEditor) {
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 0,
            overflow: "hidden",
          }}
          aria-hidden="true"
        >
          {posterUrl ? (
            <img
              src={posterUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                backgroundColor: "#1a1a2e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Play style={{ width: 24, height: 24, color: "rgba(255,255,255,0.5)" }} />
            </div>
          )}
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              backgroundColor: "rgba(0,0,0,0.6)",
              color: "white",
              fontSize: 10,
              padding: "2px 6px",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Play style={{ width: 10, height: 10 }} />
            Video BG
          </div>
        </div>
      );
    }

    // Published: render actual <video> element
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          overflow: "hidden",
        }}
        aria-hidden="true"
      >
        {shouldPlay ? (
          <video
            ref={videoRef}
            muted={settings.muted}
            autoPlay={settings.autoplay}
            loop={settings.loop}
            playsInline
            preload="metadata"
            poster={posterUrl}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          >
            <source src={background.videoUrl} type="video/mp4" />
          </video>
        ) : posterUrl ? (
          <img
            src={posterUrl}
            alt=""
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
        ) : null}

        {/* CSS to hide video when reduced motion is preferred */}
        <style
          dangerouslySetInnerHTML={{
            __html: `
              @media (prefers-reduced-motion: reduce) {
                video { display: none !important; }
              }
            `,
          }}
        />
      </div>
    );
  }

  // No video source configured
  return null;
}
