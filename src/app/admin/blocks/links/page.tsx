import { prisma } from "@/lib/prisma";
import { LinksListClient } from "@/components/links/links-list-client";
import { connection } from "next/server";

export default async function LinksPage() {
  await connection();
  const links = await prisma.knowledgeLink.findMany({
    orderBy: { createdAt: "desc" },
  });

  const serialized = links.map(({ updatedAt: _, ...l }) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    lastScrapedAt: l.lastScrapedAt?.toISOString() ?? null,
    processedAt: l.processedAt?.toISOString() ?? null,
    textContent: null as string | null,
  }));

  const stats = {
    total: links.length,
    pending: links.filter((l) => l.status === "PENDING").length,
    processing: links.filter((l) => l.status === "PROCESSING").length,
    ready: links.filter((l) => l.status === "READY").length,
    error: links.filter((l) => l.status === "ERROR").length,
  };

  return (
    <LinksListClient
      initialLinks={serialized}
      initialStats={stats}
    />
  );
}
