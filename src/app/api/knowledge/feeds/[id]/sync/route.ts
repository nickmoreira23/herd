import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { parseFeed } from "@/lib/knowledge/rss-parser";
import { matchesKeywordFilters, filterByInstructions } from "@/lib/knowledge/rss-filter";
import { scrapeUrl } from "@/lib/knowledge/scraper";

const SCRAPE_DELAY_MS = 500;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const feed = await prisma.knowledgeRSSFeed.findUnique({ where: { id } });
  if (!feed) return apiError("Not found", 404);

  await prisma.knowledgeRSSFeed.update({
    where: { id },
    data: { status: "PROCESSING", errorMessage: null },
  });

  let entriesFound = 0;
  let entriesMatched = 0;
  let entriesScraped = 0;
  let syncError: string | null = null;

  try {
    // 1. Parse the feed
    const parsed = await parseFeed(feed.feedUrl);
    entriesFound = parsed.entries.length;

    // 2. Keyword pre-filter (fast, deterministic)
    const hasKeywordFilters =
      feed.includeKeywords.length > 0 || feed.excludeKeywords.length > 0;
    let candidates = hasKeywordFilters
      ? parsed.entries.filter((entry) =>
          matchesKeywordFilters(entry, feed.includeKeywords, feed.excludeKeywords)
        )
      : parsed.entries;

    // 3. AI instructions filter (semantic, uses Claude)
    if (feed.instructions && feed.instructions.trim()) {
      const matchingIndices = await filterByInstructions(
        candidates,
        feed.instructions
      );
      candidates = candidates.filter((_, i) => matchingIndices.has(i));
    }

    const matched = candidates;
    entriesMatched = matched.length;

    // 4. Dedup — find which guids already exist
    const existingGuids = new Set(
      (
        await prisma.knowledgeRSSEntry.findMany({
          where: { feedId: id },
          select: { guid: true },
        })
      ).map((e) => e.guid)
    );

    const newEntries = matched.filter((e) => !existingGuids.has(e.guid));

    // 5. Process new entries (most recent first, up to maxEntriesPerSync)
    const toProcess = newEntries
      .sort((a, b) => {
        const dateA = a.publishedAt?.getTime() ?? 0;
        const dateB = b.publishedAt?.getTime() ?? 0;
        return dateB - dateA;
      })
      .slice(0, feed.maxEntriesPerSync);

    for (const entry of toProcess) {
      const entryRecord = await prisma.knowledgeRSSEntry.create({
        data: {
          feedId: id,
          guid: entry.guid,
          title: entry.title,
          author: entry.author,
          summary: entry.summary,
          sourceUrl: entry.link,
          publishedAt: entry.publishedAt,
          categories: entry.categories,
          imageUrl: entry.imageUrl,
          status: "PROCESSING",
        },
      });

      try {
        if (!entry.link) throw new Error("No article URL to scrape");

        const scrapeResult = await scrapeUrl(entry.link);

        // Build enriched text content with metadata header for optimal RAG
        const metadataHeader = [
          `# ${entry.title}`,
          `Source: ${entry.link}`,
          entry.publishedAt
            ? `Published: ${entry.publishedAt.toISOString().split("T")[0]}`
            : null,
          entry.author ? `Author: ${entry.author}` : null,
          `Feed: ${feed.name}`,
          entry.categories.length > 0
            ? `Categories: ${entry.categories.join(", ")}`
            : null,
          "",
        ]
          .filter(Boolean)
          .join("\n");

        const textContent = metadataHeader + scrapeResult.markdown;
        const contentLength = textContent.length;

        await prisma.knowledgeRSSEntry.update({
          where: { id: entryRecord.id },
          data: {
            textContent,
            contentLength,
            chunkCount: Math.ceil(contentLength / 1000),
            imageUrl: entry.imageUrl || scrapeResult.ogImageUrl,
            status: "READY",
            scrapedAt: new Date(),
          },
        });

        entriesScraped++;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown scrape error";
        await prisma.knowledgeRSSEntry.update({
          where: { id: entryRecord.id },
          data: { status: "ERROR", errorMessage: message },
        });
      }

      // Rate limit between scrapes
      if (toProcess.indexOf(entry) < toProcess.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, SCRAPE_DELAY_MS));
      }
    }

    // 6. Update feed metadata
    const totalEntries = await prisma.knowledgeRSSEntry.count({
      where: { feedId: id },
    });

    await prisma.knowledgeRSSFeed.update({
      where: { id },
      data: {
        status: "READY",
        entryCount: totalEntries,
        lastCheckedAt: new Date(),
        lastNewEntryAt: toProcess.length > 0 ? new Date() : feed.lastNewEntryAt,
        processedAt: new Date(),
      },
    });
  } catch (err: unknown) {
    syncError =
      err instanceof Error ? err.message : "Unknown sync error";
    await prisma.knowledgeRSSFeed.update({
      where: { id },
      data: {
        status: "ERROR",
        errorMessage: syncError,
        lastCheckedAt: new Date(),
      },
    });
  }

  // 7. Log the sync
  await prisma.knowledgeRSSSyncLog.create({
    data: {
      feedId: id,
      action: feed.lastCheckedAt ? "sync" : "initial",
      status: syncError ? "error" : "success",
      details: syncError,
      entriesFound,
      entriesMatched,
      entriesScraped,
    },
  });

  return apiSuccess({
    entriesFound,
    entriesMatched,
    entriesScraped,
    error: syncError,
  });
}
