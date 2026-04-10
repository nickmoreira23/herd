import { z } from "zod";
import { crawlSiteForProducts } from "@/lib/products/site-crawler";

const scrapeSchema = z.object({
  url: z.string().url("Please enter a valid URL"),
  maxProducts: z.coerce.number().int().min(1).max(1000).optional().default(500),
});

/**
 * POST /api/products/scrape-site
 * Crawls an e-commerce site and returns discovered products via SSE stream.
 *
 * Streams progress as Server-Sent Events:
 * - event: progress  → { status, phase, pagesDiscovered, pagesScraped, pagesErrored, currentUrl }
 * - event: product   → ScrapedProductData
 * - event: error     → { url, error }
 * - event: complete  → { totalProducts, totalErrors }
 */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const parsed = scrapeSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message || "Validation error" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { url, maxProducts } = parsed.data;

  const encoder = new TextEncoder();
  let streamClosed = false;

  const stream = new ReadableStream({
    async start(controller) {
      function send(event: string, data: unknown) {
        if (streamClosed) return;
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          streamClosed = true;
        }
      }

      let lastProductCount = 0;

      try {
        const result = await crawlSiteForProducts(
          url,
          (progress) => {
            // Send progress update with phase info
            send("progress", {
              status: progress.status,
              phase: progress.phase,
              pagesDiscovered: progress.pagesDiscovered,
              pagesScraped: progress.pagesScraped,
              pagesErrored: progress.pagesErrored,
              totalProducts: progress.products.length,
              currentUrl: progress.currentUrl,
            });

            // Send any new products
            while (lastProductCount < progress.products.length) {
              send("product", progress.products[lastProductCount]);
              lastProductCount++;
            }

            // Send any new errors
            for (const err of progress.errors.slice(-1)) {
              send("error", err);
            }
          },
          { maxProducts, concurrency: 2, delayMs: 1000 }
        );

        send("complete", {
          totalProducts: result.products.length,
          totalErrors: result.errors.length,
        });
      } catch (err) {
        send("error", {
          url,
          error: err instanceof Error ? err.message : "Site crawl failed",
        });
      } finally {
        if (!streamClosed) {
          try {
            controller.close();
          } catch {
            // Already closed
          }
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
