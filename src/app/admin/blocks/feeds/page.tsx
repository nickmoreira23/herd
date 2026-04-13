import { prisma } from "@/lib/prisma";
import { FeedsListClient } from "@/components/feeds/feeds-list-client";
import { connection } from "next/server";

export default async function FeedsPage() {
  await connection();
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

  return (
    <FeedsListClient
      initialFeeds={serialized}
      initialStats={stats}
    />
  );
}
