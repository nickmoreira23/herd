import { prisma } from "@/lib/prisma";
import { scrapeUrlWithLinks } from "./scraper";
import { normalizeUrl } from "./link-extractor";
import { parseSitemap } from "./sitemap-parser";

export interface CrawlOptions {
  maxPages: number;
  maxDepth: number;
  concurrency: number;
  delayMs: number;
}

const DEFAULT_OPTIONS: CrawlOptions = {
  maxPages: 100,
  maxDepth: 5,
  concurrency: 3,
  delayMs: 200,
};

interface QueueItem {
  url: string;
  depth: number;
}

/**
 * Simple promise pool for concurrent crawling with rate limiting.
 */
class CrawlPool {
  private running = 0;
  private queue: (() => Promise<void>)[] = [];

  constructor(
    private concurrency: number,
    private delayMs: number
  ) {}

  add(fn: () => Promise<void>): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const task = async () => {
        try {
          await fn();
          resolve();
        } catch (err) {
          reject(err);
        } finally {
          this.running--;
          // Delay before starting next task
          if (this.delayMs > 0) {
            await new Promise((r) => setTimeout(r, this.delayMs));
          }
          this.dequeue();
        }
      };

      if (this.running < this.concurrency) {
        this.running++;
        task();
      } else {
        this.queue.push(task);
      }
    });
  }

  private dequeue() {
    if (this.queue.length > 0 && this.running < this.concurrency) {
      const next = this.queue.shift()!;
      this.running++;
      next();
    }
  }

  async drain(): Promise<void> {
    // Wait until all tasks are done
    while (this.running > 0 || this.queue.length > 0) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }
}

function getRelativePath(url: string, baseUrl: string): string {
  try {
    const target = new URL(url);
    const base = new URL(baseUrl);
    const basePath = base.pathname.length > 1 ? base.pathname : "";
    let relative = target.pathname;
    if (basePath && relative.startsWith(basePath)) {
      relative = relative.slice(basePath.length);
    }
    return relative || "/";
  } catch {
    return "/";
  }
}

export async function crawlSite(
  linkId: string,
  entryUrl: string,
  options?: Partial<CrawlOptions>
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const normalizedEntry = normalizeUrl(entryUrl);
  const parsedEntry = new URL(normalizedEntry);
  const baseUrl = `${parsedEntry.protocol}//${parsedEntry.hostname}${parsedEntry.pathname.length > 1 ? parsedEntry.pathname : ""}`;
  const domainRoot = `${parsedEntry.protocol}//${parsedEntry.hostname}`;

  const visited = new Set<string>();
  const crawlQueue: QueueItem[] = [];
  let pagesScraped = 0;
  let pagesErrored = 0;

  // Try sitemap first
  const sitemapUrls = await parseSitemap(domainRoot, baseUrl);

  if (sitemapUrls.length > 0) {
    // Seed queue from sitemap
    for (const url of sitemapUrls.slice(0, opts.maxPages)) {
      const normalized = normalizeUrl(url);
      if (!visited.has(normalized)) {
        visited.add(normalized);
        crawlQueue.push({ url: normalized, depth: 1 });
      }
    }
  } else {
    // Seed with entry URL
    visited.add(normalizedEntry);
    crawlQueue.push({ url: normalizedEntry, depth: 0 });
  }

  // Update parent with initial discovery count
  await prisma.knowledgeLink.update({
    where: { id: linkId },
    data: { pagesDiscovered: crawlQueue.length },
  });

  const pool = new CrawlPool(opts.concurrency, opts.delayMs);
  const allTasks: Promise<void>[] = [];

  while (crawlQueue.length > 0 || allTasks.length > 0) {
    // Drain completed tasks
    const settled = await Promise.allSettled(
      allTasks.splice(0, allTasks.length)
    );
    // Re-add any that are still pending (shouldn't happen with our pool pattern)
    for (const result of settled) {
      if (result.status === "rejected") {
        // Individual page errors are handled inside the task
      }
    }

    // Check if we've hit the limit
    if (pagesScraped + pagesErrored >= opts.maxPages) break;

    // Dequeue batch
    const batch: QueueItem[] = [];
    while (
      crawlQueue.length > 0 &&
      batch.length < opts.concurrency &&
      pagesScraped + pagesErrored + batch.length < opts.maxPages
    ) {
      batch.push(crawlQueue.shift()!);
    }

    if (batch.length === 0) break;

    // Process batch concurrently
    const batchTasks = batch.map((item) =>
      pool.add(async () => {
        const path = getRelativePath(item.url, baseUrl);

        try {
          const result = await scrapeUrlWithLinks(item.url, baseUrl);

          // Store the page
          await prisma.knowledgeLinkPage.upsert({
            where: { linkId_url: { linkId, url: item.url } },
            create: {
              linkId,
              url: item.url,
              path,
              title: result.title,
              status: "READY",
              textContent: result.markdown,
              contentLength: result.contentLength,
              depth: item.depth,
              scrapedAt: new Date(),
            },
            update: {
              title: result.title,
              status: "READY",
              textContent: result.markdown,
              contentLength: result.contentLength,
              depth: item.depth,
              scrapedAt: new Date(),
              errorMessage: null,
            },
          });

          pagesScraped++;

          // Discover new links (only if within depth limit)
          if (item.depth < opts.maxDepth) {
            let newLinksAdded = 0;
            for (const link of result.discoveredLinks) {
              const normalized = normalizeUrl(link);
              if (!visited.has(normalized) && visited.size < opts.maxPages) {
                visited.add(normalized);
                crawlQueue.push({ url: normalized, depth: item.depth + 1 });
                newLinksAdded++;
              }
            }

            if (newLinksAdded > 0) {
              // Update discovery count
              await prisma.knowledgeLink.update({
                where: { id: linkId },
                data: {
                  pagesDiscovered: visited.size,
                },
              });
            }
          }
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Scrape failed";

          await prisma.knowledgeLinkPage.upsert({
            where: { linkId_url: { linkId, url: item.url } },
            create: {
              linkId,
              url: item.url,
              path,
              status: "ERROR",
              errorMessage: message,
              depth: item.depth,
            },
            update: {
              status: "ERROR",
              errorMessage: message,
              depth: item.depth,
            },
          });

          pagesErrored++;
        }

        // Update parent counters after each page
        await prisma.knowledgeLink.update({
          where: { id: linkId },
          data: {
            pagesScraped,
            pagesErrored,
          },
        });
      })
    );

    allTasks.push(...batchTasks);

    // Wait for this batch to complete before processing next batch
    // (allows newly discovered links to be in the queue)
    await Promise.allSettled(batchTasks);
  }

  // Wait for any remaining tasks
  await pool.drain();

  // Final parent update
  const finalStatus = pagesScraped > 0 ? "READY" : "ERROR";
  await prisma.knowledgeLink.update({
    where: { id: linkId },
    data: {
      status: finalStatus,
      pagesDiscovered: visited.size,
      pagesScraped,
      pagesErrored,
      lastScrapedAt: new Date(),
      processedAt: new Date(),
      errorMessage: finalStatus === "ERROR" ? "No pages could be scraped" : null,
    },
  });
}
