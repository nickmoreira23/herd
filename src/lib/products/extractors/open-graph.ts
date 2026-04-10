import type { CheerioAPI } from "cheerio";
import type { PartialScrapedData } from "../types";

/**
 * Extracts product data from Open Graph and standard meta tags.
 * Fallback when JSON-LD is not available.
 */
export function extractOpenGraph($: CheerioAPI, baseUrl: string): PartialScrapedData {
  const result: PartialScrapedData = {};

  // Name
  const ogTitle = $('meta[property="og:title"]').attr("content");
  const metaTitle = $("title").text().trim();
  if (ogTitle) {
    result.name = ogTitle.trim();
  } else if (metaTitle) {
    result.name = metaTitle;
  }

  // Description
  const ogDesc = $('meta[property="og:description"]').attr("content");
  const metaDesc = $('meta[name="description"]').attr("content");
  if (ogDesc) {
    result.description = ogDesc.trim().slice(0, 5000);
  } else if (metaDesc) {
    result.description = metaDesc.trim().slice(0, 5000);
  }

  // Image
  const ogImage = $('meta[property="og:image"]').attr("content");
  if (ogImage) {
    result.images = [{ url: resolveUrl(ogImage, baseUrl), alt: null }];
  }

  // Price (product-specific OG tags)
  const priceAmount =
    $('meta[property="product:price:amount"]').attr("content") ||
    $('meta[property="og:price:amount"]').attr("content");
  if (priceAmount) {
    const num = parseFloat(priceAmount);
    if (!isNaN(num)) result.price = num;
  }

  const priceCurrency =
    $('meta[property="product:price:currency"]').attr("content") ||
    $('meta[property="og:price:currency"]').attr("content");
  if (priceCurrency) {
    result.currency = priceCurrency;
  }

  // Brand
  const brand = $('meta[property="product:brand"]').attr("content");
  if (brand) result.brand = brand.trim();

  return result;
}

function resolveUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}
