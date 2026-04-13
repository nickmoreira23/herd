import type { CheerioAPI } from "cheerio";

const TRACKING_PARAMS = new Set([
  "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
  "ref", "fbclid", "gclid", "mc_cid", "mc_eid",
]);

const SKIP_EXTENSIONS = new Set([
  ".pdf", ".zip", ".gz", ".tar", ".rar",
  ".jpg", ".jpeg", ".png", ".gif", ".svg", ".webp", ".ico",
  ".mp3", ".mp4", ".avi", ".mov", ".wmv",
  ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
  ".exe", ".dmg", ".apk",
]);

export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.hash = "";
    // Remove tracking params
    for (const param of [...url.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(param.toLowerCase())) {
        url.searchParams.delete(param);
      }
    }
    // Lowercase hostname
    url.hostname = url.hostname.toLowerCase();
    // Strip trailing slash (except root)
    if (url.pathname.length > 1 && url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1);
    }
    return url.href;
  } catch {
    return raw;
  }
}

export function isInScope(url: string, baseUrl: string): boolean {
  try {
    const target = new URL(url);
    const base = new URL(baseUrl);

    // Must be same hostname
    if (target.hostname.toLowerCase() !== base.hostname.toLowerCase()) {
      return false;
    }

    // Must be http(s)
    if (!target.protocol.startsWith("http")) {
      return false;
    }

    // Must be under the base path
    const basePath = base.pathname.length > 1 ? base.pathname : "";
    if (basePath && !target.pathname.startsWith(basePath)) {
      return false;
    }

    // Skip file downloads
    const ext = target.pathname.split(".").pop()?.toLowerCase();
    if (ext && SKIP_EXTENSIONS.has(`.${ext}`)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

export function extractLinks($: CheerioAPI, pageUrl: string, baseUrl: string): string[] {
  const links = new Set<string>();

  $("a[href]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;

    // Skip javascript:, mailto:, tel:, #
    if (/^(javascript:|mailto:|tel:|#)/.test(href)) return;

    // Resolve relative URLs
    let absolute: string;
    try {
      absolute = new URL(href, pageUrl).href;
    } catch {
      return;
    }

    const normalized = normalizeUrl(absolute);

    if (isInScope(normalized, baseUrl)) {
      links.add(normalized);
    }
  });

  return [...links];
}
