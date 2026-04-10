import * as cheerio from "cheerio";
import { extractJsonLd } from "./extractors/json-ld";
import { extractOpenGraph } from "./extractors/open-graph";
import { extractFromHtml } from "./extractors/html-selectors";
import { extractSupplementFacts } from "./extractors/supplement-facts";
import type {
  ScrapedProductData,
  ScrapedProductImage,
  ScrapedVariant,
} from "./types";

export type { ScrapedProductData } from "./types";

const FETCH_TIMEOUT_MS = 15_000;
const BROWSER_TIMEOUT_MS = 30_000;

/**
 * Scrapes a product URL and returns structured product data.
 *
 * Two-tier fetching:
 * 1. Try lightweight HTTP fetch first (fast, ~1s)
 * 2. If blocked by Cloudflare/bot protection, fall back to headless Chromium (~5-10s)
 *
 * Extraction strategy (applied to the HTML from either tier):
 * 1. JSON-LD structured data (most reliable — schema.org Product markup)
 * 2. Open Graph meta tags (fallback for basic info)
 * 3. HTML selectors (catches images, variants, prices from DOM)
 * 4. Supplement facts extractor (nutrition-specific data)
 *
 * Results are merged with priority: JSON-LD > OG > HTML.
 */
export async function scrapeProductUrl(url: string): Promise<ScrapedProductData> {
  let html: string;

  // Tier 1: Try lightweight fetch
  html = await fetchWithFallback(url);

  return extractProductData(html, url);
}

/**
 * Fetches a URL's HTML, falling back to headless browser if blocked.
 */
async function fetchWithFallback(url: string): Promise<string> {
  try {
    const html = await fetchHtml(url);
    // Check if we got a Cloudflare challenge page instead of real content
    if (isCloudflareChallenge(html)) {
      console.log("[ProductScraper] Cloudflare challenge detected, using headless browser...");
      return await fetchWithBrowser(url);
    }
    return html;
  } catch (err) {
    // If fetch fails with 403/503, try browser
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("403") || msg.includes("503") || msg.includes("Challenge")) {
      console.log("[ProductScraper] Fetch blocked, using headless browser...");
      return await fetchWithBrowser(url);
    }
    throw err;
  }
}

/**
 * Lightweight HTTP fetch — fast but blocked by Cloudflare.
 */
async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    return await res.text();
  } catch (err: unknown) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Headless Chromium fetch — bypasses Cloudflare/bot protection.
 */
async function fetchWithBrowser(url: string): Promise<string> {
  const { chromium } = await import("playwright");

  const browser = await chromium.launch({
    headless: true,
    channel: "chromium",
    args: [
      "--headless=new",
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      viewport: { width: 1366, height: 768 },
      locale: "en-US",
      timezoneId: "America/Denver",
    });

    const page = await context.newPage();

    // Remove webdriver detection flag
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: BROWSER_TIMEOUT_MS,
    });

    // Wait for Cloudflare challenge to resolve
    try {
      await page.waitForFunction(
        () => {
          const title = document.title;
          return title !== "Just a moment..." && title !== "";
        },
        { timeout: 15_000 }
      );
    } catch {
      // If still on challenge page after 15s, try to get content anyway
    }

    // Wait for SPA content to render
    await page.waitForTimeout(3000);

    const html = await page.content();
    await context.close();
    return html;
  } finally {
    await browser.close();
  }
}

function isCloudflareChallenge(html: string): boolean {
  return (
    html.includes("Just a moment...") &&
    (html.includes("_cf_chl_opt") || html.includes("challenge-platform"))
  );
}

/**
 * Extracts structured product data from HTML using multiple extraction strategies.
 */
export function extractProductData(html: string, url: string): ScrapedProductData {
  const $ = cheerio.load(html);

  // Run all extractors
  const jsonLd = extractJsonLd($, url);
  const og = extractOpenGraph($, url);
  const htmlData = extractFromHtml($, url);
  const supplement = extractSupplementFacts($);

  // Merge with priority: JSON-LD > HTML > OG
  // HTML product name (h1/.product-title) is more reliable than OG title (SEO-optimized)
  return {
    name: jsonLd.name || htmlData.name || og.name || null,
    brand: jsonLd.brand || og.brand || htmlData.brand || null,
    description: jsonLd.description || og.description || htmlData.description || null,
    price: jsonLd.price ?? og.price ?? htmlData.price ?? null,
    currency: jsonLd.currency || og.currency || null,
    sku: jsonLd.sku || htmlData.sku || null,
    images: mergeImages(jsonLd.images, og.images, htmlData.images),
    variants: mergeVariants(jsonLd.variants, htmlData.variants),
    servingSize: supplement.servingSize || null,
    servingsPerContainer: supplement.servingsPerContainer ?? null,
    ingredients: supplement.ingredients || null,
    supplementFacts: supplement.supplementFacts || [],
    warnings: supplement.warnings || null,
    category: jsonLd.category || htmlData.category || null,
    tags: jsonLd.tags || [],
    sourceUrl: url,
  };
}

/** Merge image arrays, deduplicating by URL */
function mergeImages(
  ...sources: (ScrapedProductImage[] | undefined)[]
): ScrapedProductImage[] {
  const seen = new Set<string>();
  const result: ScrapedProductImage[] = [];

  for (const source of sources) {
    if (!source) continue;
    for (const img of source) {
      const key = img.url.replace(/\?.*$/, "").toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(img);
    }
  }

  return result;
}

/** Merge variant arrays, deduplicating by name and combining options */
function mergeVariants(
  ...sources: (ScrapedVariant[] | undefined)[]
): ScrapedVariant[] {
  const byName = new Map<string, Set<string>>();

  for (const source of sources) {
    if (!source) continue;
    for (const variant of source) {
      const key = variant.name.toLowerCase();
      if (!byName.has(key)) {
        byName.set(key, new Set());
      }
      for (const opt of variant.options) {
        byName.get(key)!.add(opt);
      }
    }
  }

  return Array.from(byName.entries()).map(([name, options]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    options: Array.from(options),
  }));
}
