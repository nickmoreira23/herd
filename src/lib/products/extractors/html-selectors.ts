import type { CheerioAPI } from "cheerio";
import type { PartialScrapedData, ScrapedProductImage, ScrapedVariant } from "../types";

/**
 * Extracts product data from HTML using common e-commerce CSS selectors.
 * Last resort — less reliable than JSON-LD or Open Graph but catches data
 * that structured markup sometimes misses (especially images and variants).
 */
export function extractFromHtml($: CheerioAPI, baseUrl: string): PartialScrapedData {
  const result: PartialScrapedData = {};

  // ── Embedded Product JSON ──────────────────────────────────
  // Many custom e-commerce platforms embed product data as JSON in scripts
  const embedded = extractEmbeddedProductJson($, baseUrl);
  if (embedded) {
    Object.assign(result, embedded);
  }

  // ── Images ──────────────────────────────────────────────────
  const images = extractImages($, baseUrl);
  if (images.length > 0) {
    result.images = mergeImageArrays(result.images, images);
  }

  // ── Variants ────────────────────────────────────────────────
  const variants = extractHtmlVariants($);
  if (variants.length > 0 && (!result.variants || result.variants.length === 0)) {
    result.variants = variants;
  }

  // ── Price (from visible price elements) ─────────────────────
  // Visible price is preferred over embedded JSON price (which may be wholesale/internal)
  const visiblePrice = extractVisiblePrice($);
  if (visiblePrice !== null) {
    result.price = visiblePrice;
  }

  // ── Name (from product title or h1) ────────────────────────
  // Always prefer the visible product name (h1/.product-title) over embedded JSON
  // because embedded JSON often has marketing labels (e.g., "Pump*") instead of the real name
  const visibleName = extractProductName($);
  if (visibleName) {
    result.name = visibleName;
  }

  // ── Brand ──────────────────────────────────────────────────
  if (!result.brand) {
    const brand = extractBrand($);
    if (brand) {
      result.brand = brand;
    }
  }

  return result;
}

/** Merge image arrays, deduplicating by URL */
function mergeImageArrays(
  existing: ScrapedProductImage[] | undefined,
  incoming: ScrapedProductImage[]
): ScrapedProductImage[] {
  if (!existing || existing.length === 0) return incoming;
  const seen = new Set(existing.map((i) => i.url.replace(/\?.*$/, "").toLowerCase()));
  const merged = [...existing];
  for (const img of incoming) {
    const key = img.url.replace(/\?.*$/, "").toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(img);
    }
  }
  return merged;
}

/**
 * Extract product name from common title selectors.
 * Prefers specific product-title classes over generic h1.
 */
function extractProductName($: CheerioAPI): string | null {
  const titleSelectors = [
    ".product-title",
    ".product-name",
    ".product__title",
    ".product-single__title",
    "h1.product-title",
    "h1[itemprop='name']",
    "[data-product-title]",
  ];

  for (const sel of titleSelectors) {
    const text = $(sel).first().text().trim();
    if (text && text.length > 2 && text.length < 200) return text;
  }

  // Fallback to h1
  const h1 = $("h1").first().text().trim();
  if (h1 && h1.length > 2 && h1.length < 200) return h1;

  return null;
}

/**
 * Extract brand name from various common patterns.
 */
function extractBrand($: CheerioAPI): string | null {
  const brandSelectors = [
    ".product-brand",
    ".product-vendor",
    ".product__vendor",
    "[itemprop='brand']",
    "[data-product-brand]",
    "a.brand",
  ];

  for (const sel of brandSelectors) {
    const text = $(sel).first().text().trim();
    if (text && text.length > 1 && text.length < 100) return text;
  }

  // Try extracting from page title: "Product Name - Brand Name" or "Product Name | Brand Name"
  const title = $("title").text().trim();
  if (title) {
    const match = title.match(/\s+[-–—|]\s+([^-–—|]+)$/);
    if (match) {
      const candidate = match[1].trim();
      // Make sure it's a brand name (short, not a full sentence)
      if (candidate.length > 1 && candidate.length < 50 && !candidate.includes("Shop") && !candidate.includes("Buy")) {
        return candidate;
      }
    }
  }

  return null;
}

/**
 * Extracts product data from embedded JSON in script tags.
 * Many custom e-commerce platforms (including Bucked Up) embed product
 * data as JavaScript objects in inline scripts.
 */
function extractEmbeddedProductJson($: CheerioAPI, baseUrl: string): PartialScrapedData | null {
  const result: PartialScrapedData = {};
  let found = false;

  $("script:not([src])").each((_, el) => {
    const content = $(el).html();
    if (!content) return;

    // Look for embedded product JSON patterns
    // Pattern 1: "product": { ... } or 'product': { ... }
    // Pattern 2: var product = { ... }
    // Pattern 3: window.product = { ... }
    const patterns = [
      /"product"\s*:\s*(\{[\s\S]*?\})(?=\s*[,}])/,
      /['"]product['"]\s*:\s*(\{[\s\S]*?\})(?=\s*[,}])/,
      /var\s+product\s*=\s*(\{[\s\S]*?\});/,
      /window\.product\s*=\s*(\{[\s\S]*?\});/,
    ];

    for (const pattern of patterns) {
      const match = content.match(pattern);
      if (!match) continue;

      try {
        const data = JSON.parse(match[1]);
        if (data && typeof data === "object" && data.name) {
          found = true;

          if (typeof data.name === "string") {
            result.name = data.name.trim();
          }

          // Price - check various field names
          for (const key of ["price", "price_value", "priceValue", "retail_price"]) {
            if (data[key] != null) {
              const num = typeof data[key] === "number" ? data[key] : parseFloat(String(data[key]));
              if (!isNaN(num) && num > 0) {
                result.price = num;
                break;
              }
            }
          }

          // Brand
          if (typeof data.brand === "string") {
            result.brand = data.brand.trim();
          } else if (typeof data.vendor === "string") {
            result.brand = data.vendor.trim();
          }

          // SKU
          if (typeof data.sku === "string") {
            result.sku = data.sku;
          }

          // Description
          if (typeof data.description === "string") {
            result.description = data.description.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 5000);
          }

          // Images from embedded data
          const images: ScrapedProductImage[] = [];
          const imgSources = data.images || data.media || data.photos;
          if (Array.isArray(imgSources)) {
            for (const img of imgSources) {
              const url = typeof img === "string" ? img : img?.src || img?.url || img?.href;
              if (typeof url === "string") {
                images.push({
                  url: resolveUrl(url, baseUrl),
                  alt: typeof img === "object" ? img?.alt || null : null,
                });
              }
            }
          }
          if (typeof data.image === "string") {
            images.push({ url: resolveUrl(data.image, baseUrl), alt: null });
          }
          if (images.length > 0) {
            result.images = images;
          }

          // Variants from embedded data
          if (Array.isArray(data.variants)) {
            const optionsByName = new Map<string, Set<string>>();
            for (const v of data.variants) {
              if (!v || typeof v !== "object") continue;
              // Shopify-style: option1, option2, option3
              for (let i = 1; i <= 3; i++) {
                const optKey = `option${i}`;
                if (typeof v[optKey] === "string") {
                  const name = data.options?.[i - 1] || `Option ${i}`;
                  if (!optionsByName.has(name)) optionsByName.set(name, new Set());
                  optionsByName.get(name)!.add(v[optKey]);
                }
              }
              // Direct name/value
              if (typeof v.name === "string" && typeof v.value === "string") {
                if (!optionsByName.has(v.name)) optionsByName.set(v.name, new Set());
                optionsByName.get(v.name)!.add(v.value);
              }
            }
            if (optionsByName.size > 0) {
              result.variants = Array.from(optionsByName.entries()).map(([name, opts]) => ({
                name: name.charAt(0).toUpperCase() + name.slice(1),
                options: Array.from(opts),
              }));
            }
          }

          return false; // Break out of .each()
        }
      } catch {
        // Not valid JSON, continue
      }
    }

    // Check for product name patterns: "product":{"id":"...","name":"...",...}
    if (!result.name) {
      const productObjMatch = content.match(/"product"\s*:\s*\{[^}]*"name"\s*:\s*"([^"]+)"/);
      if (productObjMatch) {
        result.name = productObjMatch[1].trim();
        found = true;
      }
    }

    // Check for price_value or similar standalone values
    if (!result.price) {
      const priceMatch = content.match(/"price_value"\s*:\s*"?([\d.]+)"?/);
      if (priceMatch) {
        const num = parseFloat(priceMatch[1]);
        if (!isNaN(num) && num > 0) result.price = num;
      }
    }
  });

  return found ? result : null;
}

const IMAGE_GALLERY_SELECTORS = [
  ".product-gallery img",
  ".product-images img",
  ".product-media img",
  "[data-product-images] img",
  "[data-product-media] img",
  ".product__media img",
  ".product-single__media img",
  ".gallery img",
  ".product-photos img",
  ".product-image-gallery img",
  // Shopify-specific
  ".product__main-photos img",
  ".product-featured-media img",
  // General custom platforms
  ".product-image img",
  ".product-photo img",
  "[class*='product-image'] img",
  "[class*='product-gallery'] img",
];

const PRODUCT_IMAGE_CONTAINER_SELECTORS = [
  ".product-gallery",
  ".product-images",
  ".product-media",
  ".product__media-list",
  ".product-single__photos",
  "[data-product-images]",
  "[data-product-media]",
];

function extractImages($: CheerioAPI, baseUrl: string): ScrapedProductImage[] {
  const seen = new Set<string>();
  const images: ScrapedProductImage[] = [];

  function addImage(url: string, alt: string | null) {
    const resolved = resolveUrl(url, baseUrl);
    if (!resolved || seen.has(resolved)) return;
    // Skip tiny icons, tracking pixels, SVGs
    if (resolved.endsWith(".svg") || resolved.includes("pixel") || resolved.includes("spacer")) return;
    seen.add(resolved);
    images.push({ url: resolved, alt });
  }

  // Try gallery selectors first
  for (const selector of IMAGE_GALLERY_SELECTORS) {
    $(selector).each((_, el) => {
      const src = $(el).attr("data-src") || $(el).attr("data-zoom-src") || $(el).attr("src");
      const srcset = $(el).attr("data-srcset") || $(el).attr("srcset");
      const alt = $(el).attr("alt") || null;

      // Prefer highest resolution from srcset
      const highRes = srcset ? getHighestResSrcset(srcset) : null;
      if (highRes) {
        addImage(highRes, alt);
      } else if (src) {
        addImage(src, alt);
      }
    });

    if (images.length > 0) return images;
  }

  // Try finding a product image container and getting all images inside
  for (const selector of PRODUCT_IMAGE_CONTAINER_SELECTORS) {
    const container = $(selector).first();
    if (container.length) {
      container.find("img").each((_, el) => {
        const src = $(el).attr("data-src") || $(el).attr("data-zoom-src") || $(el).attr("src");
        const alt = $(el).attr("alt") || null;
        if (src) addImage(src, alt);
      });
      if (images.length > 0) return images;
    }
  }

  // Fallback: look for any large product-related images
  $("img").each((_, el) => {
    const src = $(el).attr("data-src") || $(el).attr("data-zoom-src") || $(el).attr("src");
    if (!src) return;
    const width = parseInt($(el).attr("width") || "0", 10);
    const height = parseInt($(el).attr("height") || "0", 10);

    // Only include images that are reasonably large or have product-related paths
    const isLargeEnough = width >= 200 || height >= 200;
    const isProductPath = /product|item|sku|catalog/i.test(src);
    // CDN-resized images (e.g., Cloudflare /cdn-cgi/image/width=1200)
    const isCdnProduct = /cdn-cgi\/image.*(?:product|upload)/i.test(src);

    if (isLargeEnough || isProductPath || isCdnProduct) {
      addImage(src, $(el).attr("alt") || null);
    }
  });

  return images;
}

function extractHtmlVariants($: CheerioAPI): ScrapedVariant[] {
  const variants: ScrapedVariant[] = [];
  const seen = new Set<string>();

  // Product option selectors (Shopify, WooCommerce, general)
  const optionSelectors = [
    "select[name*='option']",
    "select[data-option]",
    "select.product-form__input",
    ".product-option select",
    ".variant-selector select",
    ".swatch select",
    "[data-product-option] select",
  ];

  for (const selector of optionSelectors) {
    $(selector).each((_, el) => {
      const label = $(el).attr("aria-label") ||
        $(el).closest("[data-option]").find("label").first().text().trim() ||
        $(el).prev("label").text().trim() ||
        "Option";

      const name = label.replace(/[:\s]+$/, "").trim();
      if (seen.has(name.toLowerCase())) return;

      const options: string[] = [];
      $(el).find("option").each((__, opt) => {
        const val = $(opt).text().trim();
        if (val && val !== "---" && !/select/i.test(val)) {
          options.push(val);
        }
      });

      if (options.length > 0) {
        seen.add(name.toLowerCase());
        variants.push({ name, options });
      }
    });
  }

  // Swatch-style buttons (common for flavors/colors)
  const swatchSelectors = [
    ".swatch-element",
    "[data-value]",
    ".product-form__option .option-value",
    ".variant-option__value",
  ];

  if (variants.length === 0) {
    const swatchGroups = $(".swatch, .option-selector, [data-option-index], .product-form__option");
    swatchGroups.each((_, group) => {
      const label = $(group).find("label, .option-name, legend").first().text().trim()
        .replace(/[:\s]+$/, "");
      if (!label || seen.has(label.toLowerCase())) return;

      const options: string[] = [];
      for (const sel of swatchSelectors) {
        $(group).find(sel).each((__, swatch) => {
          const val = $(swatch).attr("data-value") || $(swatch).text().trim();
          if (val) options.push(val);
        });
        if (options.length > 0) break;
      }

      if (options.length > 0) {
        seen.add(label.toLowerCase());
        variants.push({ name: label, options });
      }
    });
  }

  // Pattern: .option-name elements (Bucked Up style — standalone flavor/option labels)
  if (variants.length === 0) {
    const optionNames = $(".option-name");
    if (optionNames.length > 1) {
      const options: string[] = [];
      optionNames.each((_, el) => {
        const text = $(el).text().trim();
        if (text && text.length > 0 && text.length < 100) {
          options.push(text);
        }
      });
      if (options.length > 1) {
        // Detect the variant type name from parent or nearby labels
        const parentLabel = optionNames.first().closest("[class*='option'], [class*='variant'], [class*='flavor']")
          .find("label, .label, legend, h3, h4").first().text().trim().replace(/[:\s]+$/, "");
        const name = parentLabel || "Flavor";
        variants.push({ name, options });
      }
    }
  }

  // Pattern: Radio inputs for options
  if (variants.length === 0) {
    const radioGroups = new Map<string, string[]>();
    $("input[type='radio']").each((_, el) => {
      const name = $(el).attr("name") || "";
      const value = $(el).attr("value") || $(el).next("label").text().trim();
      if (name && value && !/csrf|token/i.test(name)) {
        if (!radioGroups.has(name)) radioGroups.set(name, []);
        radioGroups.get(name)!.push(value);
      }
    });
    for (const [name, options] of radioGroups) {
      if (options.length > 1) {
        const cleanName = name.replace(/[[\]_-]/g, " ").trim();
        const capitalName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
        variants.push({ name: capitalName, options });
      }
    }
  }

  return variants;
}

function extractVisiblePrice($: CheerioAPI): number | null {
  const priceSelectors = [
    ".product-price .current-price",
    ".product-price .price",
    ".product__price",
    ".price--sale",
    ".price .amount",
    "[data-product-price]",
    ".product-single__price",
    ".ProductMeta__Price",
    "p.price",
    "span.price",
    ".regular-price",
    ".sale-price",
    ".current-price",
    "[itemprop='price']",
    ".price",
  ];

  for (const selector of priceSelectors) {
    const text = $(selector).first().text().trim();
    const match = text.match(/[\$£€]?\s*([\d,]+\.?\d*)/);
    if (match) {
      const num = parseFloat(match[1].replace(",", ""));
      if (!isNaN(num) && num > 0) return num;
    }
  }

  return null;
}

function getHighestResSrcset(srcset: string): string | null {
  const entries = srcset.split(",").map((e) => e.trim());
  let best: { url: string; width: number } | null = null;

  for (const entry of entries) {
    const parts = entry.split(/\s+/);
    if (parts.length < 2) continue;
    const url = parts[0];
    const descriptor = parts[1];
    const widthMatch = descriptor.match(/(\d+)w/);
    if (widthMatch) {
      const w = parseInt(widthMatch[1], 10);
      if (!best || w > best.width) {
        best = { url, width: w };
      }
    }
  }

  return best?.url || null;
}

function resolveUrl(url: string, base: string): string {
  try {
    return new URL(url, base).href;
  } catch {
    return url;
  }
}
