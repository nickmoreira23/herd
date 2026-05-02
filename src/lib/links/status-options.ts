import type { MessageKey } from "@/lib/i18n/t";

/**
 * Status enum values for KnowledgeLink.status (KnowledgeDocumentStatus).
 *
 * Dictionary keys live under `links.statuses.{status}.label` with
 * domain-appropriate copy (e.g. "Scraping" / "Crawling" instead of generic
 * "Processing"). Variants are selected via separate keys at call sites.
 */
export const LINK_STATUSES = ["PENDING", "PROCESSING", "READY", "ERROR"] as const;

export type LinkStatus = (typeof LINK_STATUSES)[number];

export function linkStatusLabelKey(status: string): MessageKey {
  return `links.statuses.${status}.label` as MessageKey;
}
