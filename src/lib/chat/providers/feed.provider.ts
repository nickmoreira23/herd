import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

export class FeedProvider implements DataProvider {
  domain = "knowledge";
  types = ["rss"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const entries = await prisma.knowledgeRSSEntry.findMany({
      where: { status: "READY" },
      select: { id: true, title: true, summary: true, sourceUrl: true, publishedAt: true, chunkCount: true },
      orderBy: { publishedAt: "desc" },
      take: 200,
    });

    return entries.map((r) => ({
      id: `rss:${r.id}`,
      type: "rss",
      domain: this.domain,
      name: r.title,
      description: r.summary,
      contentLength: r.chunkCount * 1000,
      extra: `url: ${r.sourceUrl}${r.publishedAt ? `, published: ${r.publishedAt.toISOString().split("T")[0]}` : ""}`,
    }));
  }

  async fetchByIds(grouped: Record<string, string[]>): Promise<SearchResult[]> {
    if (!grouped.rss) return [];
    const entries = await prisma.knowledgeRSSEntry.findMany({
      where: { id: { in: grouped.rss } },
      select: { id: true, title: true, textContent: true },
    });
    return entries.map((e) => ({
      id: `rss:${e.id}`,
      type: "rss",
      name: e.title,
      content: truncate(e.textContent),
    }));
  }

  async searchByKeyword(keyword: string, types: string[], take: number): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("rss")) return [];
    const entries = await prisma.knowledgeRSSEntry.findMany({
      where: {
        textContent: { contains: keyword, mode: "insensitive" },
        status: "READY",
      },
      select: { id: true, title: true, textContent: true },
      take,
    });
    return entries.map((e) => ({
      id: `rss:${e.id}`,
      type: "rss",
      name: e.title,
      content: truncate(e.textContent),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const entries = await prisma.knowledgeRSSEntry.findMany({
      where: { id: { in: ids } },
      select: { id: true, title: true, summary: true, sourceUrl: true, publishedAt: true },
    });
    return entries.map((e) => ({
      id: `rss:${e.id}`,
      type: "rss",
      name: e.title,
      description: e.summary,
      meta: { sourceUrl: e.sourceUrl, publishedAt: e.publishedAt?.toISOString() },
    }));
  }
}
