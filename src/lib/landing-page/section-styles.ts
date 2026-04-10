import type { SectionBackground } from "@/types/landing-page";

// ─── YouTube / Video URL Utilities ──────────────────────────────────

/**
 * Extract YouTube video ID from various URL formats.
 * Supports youtube.com/watch, /embed/, /shorts/, and youtu.be/ links.
 */
export function parseYouTubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/
  );
  return match ? match[1] : null;
}

/**
 * Get the best-quality poster/thumbnail URL for a YouTube video.
 */
export function youTubePosterUrl(id: string): string {
  return `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
}

/**
 * Get the standard quality thumbnail (always available, unlike maxresdefault).
 */
export function youTubeThumbnailUrl(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

// ─── Section Background Styles ──────────────────────────────────────

export function sectionBackgroundStyles(bg: SectionBackground): React.CSSProperties {
  const styles: React.CSSProperties = {};
  if (bg.type === "color") {
    styles.backgroundColor = bg.value;
  } else if (bg.type === "gradient") {
    styles.backgroundImage = bg.value;
  } else if (bg.type === "image") {
    styles.backgroundImage = `url(${bg.value})`;
    styles.backgroundSize = "cover";
    styles.backgroundPosition = "center";
  } else if (bg.type === "video") {
    // For video backgrounds, use poster image as CSS fallback.
    // The actual <video> element is rendered separately as an overlay.
    const poster = bg.posterUrl
      || (bg.youtubeId ? youTubeThumbnailUrl(bg.youtubeId) : undefined);
    if (poster) {
      styles.backgroundImage = `url(${poster})`;
      styles.backgroundSize = "cover";
      styles.backgroundPosition = "center";
    }
  }
  return styles;
}

export function alignmentToFlex(alignment: string): "flex-start" | "center" | "flex-end" {
  if (alignment === "left" || alignment === "top") return "flex-start";
  if (alignment === "right" || alignment === "bottom") return "flex-end";
  return "center";
}
