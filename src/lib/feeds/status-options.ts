import type { MessageKey } from "@/lib/i18n/t";

/**
 * Status enum values for KnowledgeRSSFeed.status (KnowledgeDocumentStatus).
 *
 * The dictionary keys live under `feeds.statuses.{status}.label` and carry
 * domain-appropriate labels (e.g. "Syncing" instead of generic "Processing").
 */
export const FEED_STATUSES = ["PENDING", "PROCESSING", "READY", "ERROR"] as const;

export type FeedStatus = (typeof FEED_STATUSES)[number];

export function feedStatusLabelKey(status: string): MessageKey {
  return `feeds.statuses.${status}.label` as MessageKey;
}
