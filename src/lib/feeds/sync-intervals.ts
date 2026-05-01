import type { MessageKey } from "@/lib/i18n/t";

/**
 * KnowledgeRSSFrequency enum values. Sync cadence for RSS feeds.
 *
 * Translation keys under `feeds.sync_intervals.{value}.{label,description}`.
 */
export const FEED_SYNC_INTERVALS = ["HOURLY", "DAILY", "WEEKLY"] as const;

export type FeedSyncInterval = (typeof FEED_SYNC_INTERVALS)[number];

export function feedSyncIntervalLabelKey(value: string): MessageKey {
  return `feeds.sync_intervals.${value}.label` as MessageKey;
}

export function feedSyncIntervalDescriptionKey(value: string): MessageKey {
  return `feeds.sync_intervals.${value}.description` as MessageKey;
}
