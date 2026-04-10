import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { scrapeProductUrlSchema } from "@/lib/validators/product";
import { scrapeProductUrl } from "@/lib/products/product-scraper";

/**
 * POST /api/products/scrape
 * Scrapes a product URL and returns structured preview data (no DB write).
 */
export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, scrapeProductUrlSchema);
    if ("error" in result) return result.error;

    const data = await scrapeProductUrl(result.data.url);
    return apiSuccess(data);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Scrape failed";
    console.error("POST /api/products/scrape error:", message);
    return apiError(message, 422);
  }
}
