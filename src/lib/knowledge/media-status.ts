import type { MessageKey } from "@/lib/i18n/t";

/**
 * Shared status enum for knowledge media (KnowledgeDocument, KnowledgeImage,
 * KnowledgeVideo, KnowledgeAudio). All four models use `KnowledgeDocumentStatus`
 * with the same four values, so we centralize labels under a single namespace
 * `knowledge.media.statuses.*`.
 *
 * Use `MEDIA_STATUS_OPTIONS` to render filter dropdowns and `mediaStatusLabelKey`
 * to look up the translation key for a single status value.
 */
export const MEDIA_STATUSES = ["PENDING", "PROCESSING", "READY", "ERROR"] as const;

export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export interface MediaStatusMeta {
  value: MediaStatus;
  labelKey: MessageKey;
  /** Tailwind classes for badge tone. */
  toneClass: string;
  /** Whether the badge should render a spinning icon (for in-progress states). */
  spinning?: boolean;
}

export const MEDIA_STATUS_OPTIONS: readonly MediaStatusMeta[] = [
  {
    value: "PENDING",
    labelKey: "knowledge.media.statuses.pending.label",
    toneClass: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  },
  {
    value: "PROCESSING",
    labelKey: "knowledge.media.statuses.processing.label",
    toneClass: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    spinning: true,
  },
  {
    value: "READY",
    labelKey: "knowledge.media.statuses.ready.label",
    toneClass: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  {
    value: "ERROR",
    labelKey: "knowledge.media.statuses.error.label",
    toneClass: "bg-red-500/10 text-red-500 border-red-500/20",
  },
] as const;

export function mediaStatusLabelKey(status: string): MessageKey {
  return `knowledge.media.statuses.${status.toLowerCase()}.label` as MessageKey;
}

export function mediaStatusMeta(status: string): MediaStatusMeta {
  return (
    MEDIA_STATUS_OPTIONS.find((s) => s.value === status) ?? MEDIA_STATUS_OPTIONS[0]
  );
}
