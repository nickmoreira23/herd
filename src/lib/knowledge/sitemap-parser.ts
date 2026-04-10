import * as cheerio from "cheerio";
import { normalizeUrl, isInScope } from "./link-extractor";

export async function parseSitemap(
  domain: string,
  baseUrl: string
): Promise<string[]> {
  const sitemapUrl = `${domain.replace(/\/$/, "")}/sitemap.xml`;

  try {
    const res = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HERDBot/1.0; +https://herd.app)",
        Accept: "application/xml, text/xml",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const $ = cheerio.load(xml, { xml: true });

    // Check if this is a sitemap index
    const sitemapIndexUrls = $("sitemapindex sitemap loc")
      .map((_, el) => $(el).text().trim())
      .get();

    if (sitemapIndexUrls.length > 0) {
      // Recursively fetch nested sitemaps (limit to 10)
      const nested = await Promise.all(
        sitemapIndexUrls.slice(0, 10).map((url) => fetchSitemapUrls(url, baseUrl))
      );
      return nested.flat();
    }

    // Regular sitemap — extract URLs
    return extractUrlsFromSitemap($, baseUrl);
  } catch {
    // Sitemap not available or parsing failed — graceful fallback
    return [];
  }
}

async function fetchSitemapUrls(
  sitemapUrl: string,
  baseUrl: string
): Promise<string[]> {
  try {
    const res = await fetch(sitemapUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; HERDBot/1.0; +https://herd.app)",
        Accept: "application/xml, text/xml",
      },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return [];

    const xml = await res.text();
    const $ = cheerio.load(xml, { xml: true });
    return extractUrlsFromSitemap($, baseUrl);
  } catch {
    return [];
  }
}

function extractUrlsFromSitemap($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const urls: string[] = [];

  $("urlset url loc").each((_, el) => {
    const loc = $(el).text().trim();
    if (!loc) return;

    const normalized = normalizeUrl(loc);
    if (isInScope(normalized, baseUrl)) {
      urls.push(normalized);
    }
  });

  return urls;
}
