import type { MessageKey } from "@/lib/i18n/t";

/**
 * KnowledgeLink.scrapeMode values (stored as String, not a Prisma enum).
 *
 * - SINGLE: scrape a single URL.
 * - FULL_SITE: crawl a domain up to maxPages.
 *
 * Translation keys live under `links.scrape_modes.{value}.{label,description}`.
 */
export const LINK_SCRAPE_MODES = ["SINGLE", "FULL_SITE"] as const;

export type LinkScrapeMode = (typeof LINK_SCRAPE_MODES)[number];

export function linkScrapeModeLabelKey(value: string): MessageKey {
  return `links.scrape_modes.${value}.label` as MessageKey;
}

export function linkScrapeModeDescriptionKey(value: string): MessageKey {
  return `links.scrape_modes.${value}.description` as MessageKey;
}
