import * as cheerio from "cheerio";
import TurndownService from "turndown";
import { extractLinks } from "./link-extractor";

export interface ScrapeResult {
  title: string;
  description: string | null;
  domain: string;
  faviconUrl: string | null;
  ogImageUrl: string | null;
  markdown: string;
  contentLength: number;
}

const MAX_CONTENT_BYTES = 500_000;

const NOISE_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "nav",
  "footer",
  "header",
  "aside",
  "[role=banner]",
  "[role=navigation]",
  "[role=contentinfo]",
  ".cookie-banner",
  ".advertisement",
  "#cookie-consent",
];

const CONTENT_SELECTORS = ["article", "main", "[role=main]", ".post-content", ".entry-content"];

function resolveUrl(relative: string | undefined, base: string): string | null {
  if (!relative) return null;
  try {
    return new URL(relative, base).href;
  } catch {
    return null;
  }
}

export async function scrapeUrl(url: string): Promise<ScrapeResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let html: string;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HERDBot/1.0; +https://herd.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    html = await res.text();
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out after 15 seconds");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname;

  // Extract metadata
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    domain;

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    null;

  const faviconUrl =
    resolveUrl($('link[rel="icon"]').attr("href"), url) ||
    resolveUrl($('link[rel="shortcut icon"]').attr("href"), url) ||
    `${parsedUrl.protocol}//${domain}/favicon.ico`;

  const ogImageUrl =
    resolveUrl($('meta[property="og:image"]').attr("content"), url) || null;

  // Strip noise elements
  for (const selector of NOISE_SELECTORS) {
    $(selector).remove();
  }

  // Find main content area
  let contentHtml = "";
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first();
    if (el.length && el.html()) {
      contentHtml = el.html()!;
      break;
    }
  }
  if (!contentHtml) {
    contentHtml = $("body").html() || "";
  }

  // Convert to markdown
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  // Skip images in markdown to keep content text-focused
  turndown.addRule("skipImages", {
    filter: "img",
    replacement: () => "",
  });

  let markdown = turndown.turndown(contentHtml).trim();

  // Truncate if too large
  if (markdown.length > MAX_CONTENT_BYTES) {
    markdown = markdown.slice(0, MAX_CONTENT_BYTES) + "\n\n[Content truncated — exceeded 500KB limit]";
  }

  return {
    title,
    description: description?.slice(0, 1000) || null,
    domain,
    faviconUrl,
    ogImageUrl,
    markdown,
    contentLength: markdown.length,
  };
}

export interface ScrapeWithLinksResult extends ScrapeResult {
  discoveredLinks: string[];
}

/**
 * Scrapes a URL and also returns all discovered internal links.
 * Links are extracted BEFORE noise removal so nav links are captured for crawling.
 */
export async function scrapeUrlWithLinks(
  url: string,
  baseUrl: string
): Promise<ScrapeWithLinksResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  let html: string;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; HERDBot/1.0; +https://herd.app)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    html = await res.text();
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out after 15 seconds");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }

  const $ = cheerio.load(html);
  const parsedUrl = new URL(url);
  const domain = parsedUrl.hostname;

  // Extract metadata
  const title =
    $('meta[property="og:title"]').attr("content") ||
    $("title").text().trim() ||
    domain;

  const description =
    $('meta[property="og:description"]').attr("content") ||
    $('meta[name="description"]').attr("content") ||
    null;

  const faviconUrl =
    resolveUrl($('link[rel="icon"]').attr("href"), url) ||
    resolveUrl($('link[rel="shortcut icon"]').attr("href"), url) ||
    `${parsedUrl.protocol}//${domain}/favicon.ico`;

  const ogImageUrl =
    resolveUrl($('meta[property="og:image"]').attr("content"), url) || null;

  // Extract links BEFORE removing noise (nav links are valuable for discovery)
  const discoveredLinks = extractLinks($, url, baseUrl);

  // Strip noise elements
  for (const selector of NOISE_SELECTORS) {
    $(selector).remove();
  }

  // Find main content area
  let contentHtml = "";
  for (const selector of CONTENT_SELECTORS) {
    const el = $(selector).first();
    if (el.length && el.html()) {
      contentHtml = el.html()!;
      break;
    }
  }
  if (!contentHtml) {
    contentHtml = $("body").html() || "";
  }

  // Convert to markdown
  const turndown = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    bulletListMarker: "-",
  });

  turndown.addRule("skipImages", {
    filter: "img",
    replacement: () => "",
  });

  let markdown = turndown.turndown(contentHtml).trim();

  if (markdown.length > MAX_CONTENT_BYTES) {
    markdown = markdown.slice(0, MAX_CONTENT_BYTES) + "\n\n[Content truncated — exceeded 500KB limit]";
  }

  return {
    title,
    description: description?.slice(0, 1000) || null,
    domain,
    faviconUrl,
    ogImageUrl,
    markdown,
    contentLength: markdown.length,
    discoveredLinks,
  };
}
