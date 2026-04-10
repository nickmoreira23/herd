import * as cheerio from "cheerio";
import { extractProductData } from "./product-scraper";
import type { ScrapedProductData } from "./types";

export interface SiteCrawlProgress {
  status: "discovering" | "scraping" | "complete" | "error";
  phase: string;
  pagesDiscovered: number;
  pagesScraped: number;
  pagesErrored: number;
  currentUrl: string | null;
  products: ScrapedProductData[];
  errors: { url: string; error: string }[];
}

export interface SiteCrawlOptions {
  maxProducts: number;
  concurrency: number;
  delayMs: number;
}

const DEFAULT_OPTIONS: SiteCrawlOptions = {
  maxProducts: 500,
  concurrency: 2,
  delayMs: 1000,
};

/**
 * Discovers and scrapes all products from an e-commerce website.
 *
 * Strategy (all via Playwright to bypass Cloudflare):
 * 1. Try sitemap.xml for product URLs
 * 2. Crawl /shop and category pages for product links
 * 3. Scrape each discovered product URL
 */
export async function crawlSiteForProducts(
  siteUrl: string,
  onProgress: (progress: SiteCrawlProgress) => void,
  options?: Partial<SiteCrawlOptions>
): Promise<SiteCrawlProgress> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const parsed = new URL(siteUrl);
  const domain = `${parsed.protocol}//${parsed.hostname}`;

  const progress: SiteCrawlProgress = {
    status: "discovering",
    phase: "Launching browser...",
    pagesDiscovered: 0,
    pagesScraped: 0,
    pagesErrored: 0,
    currentUrl: null,
    products: [],
    errors: [],
  };

  onProgress(progress);

  // Launch a shared browser for the entire operation
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
    });

    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    const page = await context.newPage();

    // Phase 1: Discover product URLs
    let productUrls: string[] = [];

    // 1a. Try sitemap via Playwright (fetch often blocked by Cloudflare)
    progress.phase = "Checking sitemap...";
    onProgress(progress);

    const sitemapUrls = await discoverFromSitemapWithBrowser(page, domain);
    console.log(`[SiteCrawler] Found ${sitemapUrls.length} URLs from sitemap`);

    if (sitemapUrls.length > 0) {
      productUrls = sitemapUrls;
      progress.phase = `Found ${sitemapUrls.length} products in sitemap`;
      progress.pagesDiscovered = productUrls.length;
      onProgress(progress);
    }

    // 1b. If sitemap didn't yield enough, crawl the shop pages
    if (productUrls.length < 10) {
      progress.phase = "Crawling shop pages...";
      onProgress(progress);

      const crawledUrls = await discoverFromCrawling(page, domain, siteUrl, opts.maxProducts, (msg) => {
        progress.phase = msg;
        onProgress(progress);
      });
      console.log(`[SiteCrawler] Found ${crawledUrls.length} URLs from crawling`);

      // Merge, dedup
      const seen = new Set(productUrls.map((u) => u.toLowerCase()));
      for (const url of crawledUrls) {
        if (!seen.has(url.toLowerCase())) {
          seen.add(url.toLowerCase());
          productUrls.push(url);
        }
      }
    }

    // Limit to maxProducts
    productUrls = productUrls.slice(0, opts.maxProducts);
    progress.pagesDiscovered = productUrls.length;
    progress.phase = `Discovered ${productUrls.length} product URLs`;
    onProgress(progress);

    if (productUrls.length === 0) {
      progress.status = "error";
      progress.phase = "No products found";
      progress.errors.push({ url: siteUrl, error: "No product URLs discovered" });
      onProgress(progress);
      return progress;
    }

    // Phase 2: Scrape each product URL
    progress.status = "scraping";
    progress.phase = `Scraping 0 / ${productUrls.length} products...`;
    onProgress(progress);

    let scraped = 0;
    for (const productUrl of productUrls) {
      scraped++;
      const slug = new URL(productUrl).pathname.split("/").pop() || productUrl;
      progress.currentUrl = productUrl;
      progress.phase = `Scraping ${scraped} / ${productUrls.length}: ${slug}`;
      onProgress(progress);

      try {
        await page.goto(productUrl, {
          waitUntil: "domcontentloaded",
          timeout: 30_000,
        });

        // Wait for Cloudflare challenge
        try {
          await page.waitForFunction(
            () => document.title !== "Just a moment..." && document.title !== "",
            { timeout: 15_000 }
          );
        } catch {
          // Continue even if challenge doesn't resolve
        }

        // Wait for dynamic content to render
        await page.waitForTimeout(3000);
        const html = await page.content();

        const data = extractProductData(html, productUrl);

        if (data.name) {
          progress.products.push(data);
          progress.pagesScraped++;
        } else {
          progress.pagesErrored++;
          progress.errors.push({ url: productUrl, error: "No product data found" });
        }
      } catch (err) {
        progress.pagesErrored++;
        const msg = err instanceof Error ? err.message : "Scrape failed";
        progress.errors.push({ url: productUrl, error: msg });
      }

      onProgress(progress);

      // Rate limiting
      if (opts.delayMs > 0) {
        await new Promise((r) => setTimeout(r, opts.delayMs));
      }
    }

    await context.close();

    progress.status = progress.products.length > 0 ? "complete" : "error";
    progress.currentUrl = null;
    progress.phase = progress.products.length > 0
      ? `Done! ${progress.products.length} products scraped`
      : "No products could be scraped";
    onProgress(progress);
  } finally {
    await browser.close();
  }

  return progress;
}

/**
 * Discovers product URLs from sitemap.xml using Playwright.
 * Cloudflare blocks regular fetch, so we must use the browser.
 */
async function discoverFromSitemapWithBrowser(
  page: import("playwright").Page,
  domain: string
): Promise<string[]> {
  const sitemapUrls = [
    `${domain}/sitemap.xml`,
    `${domain}/sitemap_products.xml`,
    `${domain}/sitemap-products.xml`,
    `${domain}/product-sitemap.xml`,
  ];

  const allUrls: string[] = [];

  for (const sitemapUrl of sitemapUrls) {
    try {
      await page.goto(sitemapUrl, {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });

      // Wait for Cloudflare challenge
      try {
        await page.waitForFunction(
          () => document.title !== "Just a moment..." && document.title !== "",
          { timeout: 15_000 }
        );
      } catch {
        // If still challenged, skip
        const title = await page.title();
        if (title === "Just a moment..." || title === "") continue;
      }

      await page.waitForTimeout(3000);

      // Extract URLs from sitemap XML
      const urls = await page.evaluate(() => {
        // Try XML <loc> elements first
        const locs = document.querySelectorAll("loc");
        if (locs.length > 0) {
          return Array.from(locs).map(l => l.textContent?.trim()).filter(Boolean) as string[];
        }
        // Sometimes the raw text is visible
        const body = document.body?.innerText || "";
        const urlMatches = body.match(/https?:\/\/[^\s<>"]+/g);
        return urlMatches || [];
      });

      if (urls.length > 0) {
        console.log(`[SiteCrawler] Sitemap ${sitemapUrl} returned ${urls.length} URLs`);

        // Check if this is a sitemap index
        const isSitemapIndex = urls.some(u => u.includes("sitemap") && u.endsWith(".xml"));

        if (isSitemapIndex) {
          // Fetch nested sitemaps that look product-related
          const productSitemaps = urls.filter(u => /product|item|catalog/i.test(u) && u.endsWith(".xml"));
          const toFetch = productSitemaps.length > 0 ? productSitemaps : urls.filter(u => u.endsWith(".xml")).slice(0, 5);

          for (const nestedUrl of toFetch) {
            try {
              await page.goto(nestedUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });
              try {
                await page.waitForFunction(
                  () => document.title !== "Just a moment..." && document.title !== "",
                  { timeout: 15_000 }
                );
              } catch {}
              await page.waitForTimeout(2000);

              const nestedUrls = await page.evaluate(() => {
                const locs = document.querySelectorAll("loc");
                return Array.from(locs).map(l => l.textContent?.trim()).filter(Boolean) as string[];
              });

              for (const u of nestedUrls) {
                if (isLikelyProductUrl(u, domain)) allUrls.push(u);
              }
            } catch {
              // Skip failed nested sitemaps
            }
          }
        } else {
          // Direct sitemap - filter for product URLs
          for (const u of urls) {
            if (isLikelyProductUrl(u, domain)) allUrls.push(u);
          }
        }

        // If we found URLs from any sitemap, don't try the others
        if (allUrls.length > 0) break;
      }
    } catch {
      // Skip failed sitemaps
    }
  }

  return dedup(allUrls);
}

/**
 * Discovers product URLs by crawling shop/category pages.
 */
async function discoverFromCrawling(
  page: import("playwright").Page,
  domain: string,
  entryUrl: string,
  maxProducts: number,
  onStatus: (msg: string) => void
): Promise<string[]> {
  const productUrls = new Set<string>();
  const visited = new Set<string>();
  const queue: string[] = [entryUrl];

  // Common category page patterns
  const categoryPatterns = [
    "/shop",
    "/collections",
    "/collections/all",
    "/products",
    "/shop/all",
    "/catalog",
  ];

  for (const pattern of categoryPatterns) {
    queue.push(`${domain}${pattern}`);
  }

  const domainHostname = new URL(domain).hostname;

  while (queue.length > 0 && productUrls.size < maxProducts) {
    const url = queue.shift()!;
    const normalized = normalizeUrl(url);
    if (visited.has(normalized)) continue;
    visited.add(normalized);

    // Only visit pages on the same domain
    try {
      if (new URL(normalized).hostname !== domainHostname) continue;
    } catch {
      continue;
    }

    onStatus(`Crawling: ${new URL(normalized).pathname}`);

    try {
      await page.goto(normalized, {
        waitUntil: "domcontentloaded",
        timeout: 20_000,
      });

      try {
        await page.waitForFunction(
          () => document.title !== "Just a moment..." && document.title !== "",
          { timeout: 10_000 }
        );
      } catch {
        // Skip if stuck on challenge
      }

      // Scroll down to load lazy content
      await page.waitForTimeout(2000);
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1500);
      }

      const html = await page.content();
      const $ = cheerio.load(html);

      // Extract all links
      $("a[href]").each((_, el) => {
        const href = $(el).attr("href");
        if (!href) return;

        let fullUrl: string;
        try {
          fullUrl = new URL(href, normalized).href;
        } catch {
          return;
        }

        try {
          if (new URL(fullUrl).hostname !== domainHostname) return;
        } catch {
          return;
        }

        const norm = normalizeUrl(fullUrl);

        if (isLikelyProductUrl(norm, domain)) {
          productUrls.add(norm);
        } else if (isLikelyCategoryUrl(norm) && !visited.has(norm)) {
          queue.push(norm);
        }
      });

      onStatus(`Found ${productUrls.size} products so far...`);

      // Limit visited pages
      if (visited.size > 50) break;
    } catch (err) {
      console.log(`[SiteCrawler] Failed to crawl ${normalized}:`, err instanceof Error ? err.message : "");
    }
  }

  return Array.from(productUrls);
}

/**
 * Heuristic: does this URL look like a product page?
 * Handles both standard paths (/products/slug) and custom platforms
 * like Bucked Up where products are at /shop/slug or root-level /slug.
 */
function isLikelyProductUrl(url: string, domain?: string): boolean {
  let path: string;
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    return false;
  }

  // Skip non-content paths
  if (/\.(css|js|json|xml|txt|ico|svg|png|jpg|webp|gif|woff2?|ttf|eot)$/i.test(path)) return false;
  if (/\/(cart|checkout|account|login|register|search|blog|faq|about|contact|privacy|terms|policy|shipping|returns|help|support|sitemap|feed|rss)/i.test(path)) return false;
  if (path === "/" || path === "") return false;

  // Positive signals for product pages
  const productPatterns = [
    /\/products?\/[^/]+$/i,                           // /products/slug or /product/slug
    /\/collections?\/[^/]+\/products?\/[^/]+$/i,     // Shopify: /collections/x/products/y
    /\/item\/[^/]+$/i,                                // /item/slug
    /\/p\/[^/]+$/i,                                   // /p/slug
    /\/shop\/[^/]+$/i,                                // /shop/slug (Bucked Up style)
  ];

  for (const pattern of productPatterns) {
    if (pattern.test(path)) return true;
  }

  // Root-level slugs: /some-product-name-here
  const segments = path.split("/").filter(Boolean);
  if (segments.length === 1) {
    const slug = segments[0];
    // Product slugs have hyphens and are descriptive
    if (slug.includes("-") && slug.length > 10) {
      // Exclude known non-product root pages
      if (/^(subscribe|become|wholesale|terms|castaway|referral|ambassador|affiliate|reward|loyalty|gift|bundle)/i.test(slug)) {
        return false;
      }
      return true;
    }
  }

  return false;
}

/**
 * Heuristic: does this URL look like a category/collection listing page?
 */
function isLikelyCategoryUrl(url: string): boolean {
  let path: string;
  try {
    path = new URL(url).pathname.toLowerCase();
  } catch {
    return false;
  }
  // Only treat bare category paths as categories, not /shop/product-slug
  return /^\/(collections?|categories?|catalog|departments?)(\/|$)/i.test(path);
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "ref", "fbclid", "gclid"]) {
      u.searchParams.delete(key);
    }
    if (u.pathname.length > 1 && u.pathname.endsWith("/")) {
      u.pathname = u.pathname.slice(0, -1);
    }
    return u.href;
  } catch {
    return url;
  }
}

function dedup(urls: string[]): string[] {
  const seen = new Set<string>();
  return urls.filter((u) => {
    const key = u.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
