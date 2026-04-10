import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeRSSFeedSchema } from "@/lib/validators/knowledge-rss";
import { parseFeed } from "@/lib/knowledge/rss-parser";

export async function GET() {
  const feeds = await prisma.knowledgeRSSFeed.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { entries: true } },
    },
  });

  const stats = {
    total: feeds.length,
    active: feeds.filter((f) => f.isActive).length,
    processing: feeds.filter((f) => f.status === "PROCESSING").length,
    error: feeds.filter((f) => f.status === "ERROR").length,
    totalEntries: feeds.reduce((sum, f) => sum + f.entryCount, 0),
  };

  const serialized = feeds.map(({ _count, updatedAt: _, ...f }) => ({
    ...f,
    readyEntryCount: _count.entries,
    createdAt: f.createdAt.toISOString(),
    lastCheckedAt: f.lastCheckedAt?.toISOString() ?? null,
    lastNewEntryAt: f.lastNewEntryAt?.toISOString() ?? null,
    processedAt: f.processedAt?.toISOString() ?? null,
    textContent: null as string | null,
  }));

  return apiSuccess({ feeds: serialized, stats });
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createKnowledgeRSSFeedSchema);
  if ("error" in result) return result.error;

  const { feedUrl, name, description, frequency, instructions, includeKeywords, excludeKeywords, maxEntriesPerSync } =
    result.data;

  // Try to parse the feed to auto-detect metadata
  let feedName = name || new URL(feedUrl).hostname;
  let feedDescription = description || null;
  let siteUrl: string | null = null;
  let faviconUrl: string | null = null;

  try {
    const parsed = await parseFeed(feedUrl);
    if (!name) feedName = parsed.meta.title;
    if (!description) feedDescription = parsed.meta.description;
    siteUrl = parsed.meta.siteUrl;
    if (siteUrl) {
      const domain = new URL(siteUrl).hostname;
      faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    }
  } catch {
    // Feed parse failed — still create the record, sync will retry
  }

  const feed = await prisma.knowledgeRSSFeed.create({
    data: {
      feedUrl,
      siteUrl,
      name: feedName,
      description: feedDescription,
      faviconUrl,
      frequency,
      instructions: instructions || null,
      includeKeywords,
      excludeKeywords,
      maxEntriesPerSync,
      status: "PENDING",
    },
  });

  // Fire-and-forget initial sync
  const baseUrl = request.headers.get("origin") || request.headers.get("host") || "";
  const origin = baseUrl.startsWith("http") ? baseUrl : `http://${baseUrl}`;
  fetch(`${origin}/api/knowledge/feeds/${feed.id}/sync`, {
    method: "POST",
  }).catch(() => {});

  return apiSuccess(feed, 201);
}
