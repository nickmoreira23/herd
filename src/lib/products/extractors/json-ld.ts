import type { CheerioAPI } from "cheerio";
import type { PartialScrapedData, ScrapedProductImage, ScrapedVariant } from "../types";

/**
 * Extracts product data from JSON-LD structured data (schema.org Product).
 * Most reliable source — standard markup used by Shopify, WooCommerce, BigCommerce, etc.
 */
export function extractJsonLd($: CheerioAPI, baseUrl: string): PartialScrapedData {
  const result: PartialScrapedData = {};

  const scripts = $('script[type="application/ld+json"]');
  let productData: Record<string, unknown> | null = null;

  scripts.each((_, el) => {
    if (productData) return;
    try {
      const raw = $(el).html();
      if (!raw) return;
      const parsed = JSON.parse(raw);

      // Handle @graph arrays (common in WordPress/WooCommerce)
      if (parsed["@graph"] && Array.isArray(parsed["@graph"])) {
        for (const item of parsed["@graph"]) {
          if (isProductType(item)) {
            productData = item;
            return;
          }
        }
      }

      // Direct Product object
      if (isProductType(parsed)) {
        productData = parsed;
        return;
      }

      // Array of schemas
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          if (isProductType(item)) {
            productData = item;
            return;
          }
        }
      }
    } catch {
      // Ignore malformed JSON-LD
    }
  });

  if (!productData) return result;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pd = productData as any;

  // Name
  if (typeof pd.name === "string") {
    result.name = pd.name.trim();
  }

  // Description
  if (typeof pd.description === "string") {
    result.description = cleanHtml(pd.description).slice(0, 5000);
  }

  // Brand
  const brand = pd.brand;
  if (typeof brand === "string") {
    result.brand = brand;
  } else if (brand && typeof brand === "object" && "name" in brand) {
    result.brand = String((brand as Record<string, unknown>).name);
  }

  // SKU
  if (typeof pd.sku === "string") {
    result.sku = pd.sku;
  }

  // Images
  const images: ScrapedProductImage[] = [];
  const imageField = pd.image;
  if (typeof imageField === "string") {
    images.push({ url: resolveUrl(imageField, baseUrl), alt: null });
  } else if (Array.isArray(imageField)) {
    for (const img of imageField) {
      if (typeof img === "string") {
        images.push({ url: resolveUrl(img, baseUrl), alt: null });
      } else if (img && typeof img === "object" && "url" in img) {
        images.push({
          url: resolveUrl(String((img as Record<string, unknown>).url), baseUrl),
          alt: typeof (img as Record<string, unknown>).name === "string"
            ? String((img as Record<string, unknown>).name)
            : null,
        });
      }
    }
  }
  if (images.length > 0) {
    result.images = images;
  }

  // Price from offers
  const offers = pd.offers;
  const price = extractPrice(offers);
  if (price !== null) {
    result.price = price;
  }
  const currency = extractCurrency(offers);
  if (currency) {
    result.currency = currency;
  }

  // Variants from hasVariant or ProductGroup
  const variants = extractVariants(pd);
  if (variants.length > 0) {
    result.variants = variants;
  }

  // Category
  if (typeof pd.category === "string") {
    result.category = pd.category;
  }

  return result;
}

function isProductType(obj: unknown): obj is Record<string, unknown> {
  if (!obj || typeof obj !== "object") return false;
  const type = (obj as Record<string, unknown>)["@type"];
  if (typeof type === "string") {
    return type === "Product" || type === "ProductGroup";
  }
  if (Array.isArray(type)) {
    return type.includes("Product") || type.includes("ProductGroup");
  }
  return false;
}

function extractPrice(offers: unknown): number | null {
  if (!offers) return null;

  if (typeof offers === "object" && !Array.isArray(offers)) {
    const offer = offers as Record<string, unknown>;
    if (typeof offer.price === "number") return offer.price;
    if (typeof offer.price === "string") {
      const num = parseFloat(offer.price);
      if (!isNaN(num)) return num;
    }
    if (typeof offer.lowPrice === "string" || typeof offer.lowPrice === "number") {
      const num = parseFloat(String(offer.lowPrice));
      if (!isNaN(num)) return num;
    }
  }

  if (Array.isArray(offers)) {
    for (const offer of offers) {
      const price = extractPrice(offer);
      if (price !== null) return price;
    }
  }

  return null;
}

function extractCurrency(offers: unknown): string | null {
  if (!offers) return null;
  if (typeof offers === "object" && !Array.isArray(offers)) {
    const offer = offers as Record<string, unknown>;
    if (typeof offer.priceCurrency === "string") return offer.priceCurrency;
  }
  if (Array.isArray(offers)) {
    for (const offer of offers) {
      const c = extractCurrency(offer);
      if (c) return c;
    }
  }
  return null;
}

function extractVariants(data: Record<string, unknown>): ScrapedVariant[] {
  const variants: ScrapedVariant[] = [];
  const hasVariant = data.hasVariant;

  if (Array.isArray(hasVariant)) {
    // Group variant options by their distinguishing property
    const optionsByProp = new Map<string, Set<string>>();

    for (const v of hasVariant) {
      if (!v || typeof v !== "object") continue;
      const variant = v as Record<string, unknown>;

      // Check common variant properties
      for (const prop of ["size", "color", "flavor", "material"]) {
        if (typeof variant[prop] === "string") {
          if (!optionsByProp.has(prop)) optionsByProp.set(prop, new Set());
          optionsByProp.get(prop)!.add(variant[prop] as string);
        }
      }

      // Check additionalProperty
      if (Array.isArray(variant.additionalProperty)) {
        for (const ap of variant.additionalProperty) {
          if (ap && typeof ap === "object" && "name" in ap && "value" in ap) {
            const name = String((ap as Record<string, unknown>).name);
            const value = String((ap as Record<string, unknown>).value);
            if (!optionsByProp.has(name)) optionsByProp.set(name, new Set());
            optionsByProp.get(name)!.add(value);
          }
        }
      }

      // Check name for variant info (e.g., "Product Name - Blue Raz")
      if (typeof variant.name === "string" && typeof data.name === "string") {
        const name = variant.name as string;
        const baseName = data.name as string;
        if (name.startsWith(baseName) && name.length > baseName.length) {
          const suffix = name.slice(baseName.length).replace(/^[\s\-–—]+/, "").trim();
          if (suffix) {
            if (!optionsByProp.has("Variant")) optionsByProp.set("Variant", new Set());
            optionsByProp.get("Variant")!.add(suffix);
          }
        }
      }
    }

    for (const [name, options] of optionsByProp) {
      const capitalized = name.charAt(0).toUpperCase() + name.slice(1);
      variants.push({
        name: capitalized,
        options: Array.from(options),
      });
    }
  }

  return variants;
}

function resolveUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}

function cleanHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
