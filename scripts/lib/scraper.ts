import * as cheerio from "cheerio";

export interface ScrapedData {
  tagline: string | null;
  description: string | null;
  logoUrl: string | null;
  heroImageUrl: string | null;
  favicon: string | null;
}

export async function scrapePage(websiteUrl: string): Promise<ScrapedData> {
  const response = await fetch(websiteUrl, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${websiteUrl}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract tagline: og:title or <title>
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const pageTitle = $("title").text();
  const tagline = ogTitle || pageTitle || null;

  // Extract description: og:description or meta description
  const ogDesc = $('meta[property="og:description"]').attr("content");
  const metaDesc = $('meta[name="description"]').attr("content");
  const description = ogDesc || metaDesc || null;

  // Extract logo: multiple strategies
  const ogImage = $('meta[property="og:image"]').attr("content");
  const twitterImage = $('meta[name="twitter:image"]').attr("content");
  const appleTouchIcon = $('link[rel="apple-touch-icon"]').attr("href");
  const icon192 = $('link[rel="icon"][sizes="192x192"]').attr("href");
  const logoUrl = ogImage || twitterImage || appleTouchIcon || icon192 || null;

  // Extract hero image: og:image is the primary source
  const heroImageUrl = ogImage || null;

  // Extract favicon
  const faviconLink =
    $('link[rel="icon"][type="image/png"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    $('link[rel="icon"]').attr("href");
  const favicon = faviconLink || null;

  return {
    tagline: tagline ? tagline.trim().substring(0, 200) : null,
    description: description ? description.trim().substring(0, 500) : null,
    logoUrl: logoUrl ? resolveUrl(websiteUrl, logoUrl) : null,
    heroImageUrl: heroImageUrl ? resolveUrl(websiteUrl, heroImageUrl) : null,
    favicon: favicon ? resolveUrl(websiteUrl, favicon) : null,
  };
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}
