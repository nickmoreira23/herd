import { prisma } from "@/lib/prisma";
import { KnowledgeLinkTable } from "@/components/knowledge/links/knowledge-link-table";
import { KnowledgeLinksEmpty } from "@/components/knowledge/links/knowledge-links-empty";

export default async function KnowledgeLinksPage() {
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

  if (links.length === 0) {
    return <KnowledgeLinksEmpty />;
  }

  return (
    <KnowledgeLinkTable
      initialLinks={serialized}
      initialStats={stats}
    />
  );
}
