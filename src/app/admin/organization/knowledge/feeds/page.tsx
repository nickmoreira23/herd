import { prisma } from "@/lib/prisma";
import { KnowledgeFeedTable } from "@/components/knowledge/feeds/knowledge-feed-table";
import { KnowledgeFeedsEmpty } from "@/components/knowledge/feeds/knowledge-feeds-empty";

export default async function KnowledgeFeedsPage() {
  const feeds = await prisma.knowledgeRSSFeed.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { entries: true } },
    },
  });

  const serialized = feeds.map(({ _count, updatedAt: _, ...f }) => ({
    ...f,
    readyEntryCount: _count.entries,
    createdAt: f.createdAt.toISOString(),
    lastCheckedAt: f.lastCheckedAt?.toISOString() ?? null,
    lastNewEntryAt: f.lastNewEntryAt?.toISOString() ?? null,
    processedAt: f.processedAt?.toISOString() ?? null,
    textContent: null as string | null,
  }));

  const stats = {
    total: feeds.length,
    active: feeds.filter((f) => f.isActive).length,
    processing: feeds.filter((f) => f.status === "PROCESSING").length,
    error: feeds.filter((f) => f.status === "ERROR").length,
    totalEntries: feeds.reduce((sum, f) => sum + f.entryCount, 0),
  };

  if (feeds.length === 0) {
    return <KnowledgeFeedsEmpty />;
  }

  return (
    <KnowledgeFeedTable
      initialFeeds={serialized}
      initialStats={stats}
    />
  );
}
