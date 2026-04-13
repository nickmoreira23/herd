import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

export class LinkProvider implements DataProvider {
  domain = "knowledge";
  types = ["link"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const links = await prisma.knowledgeLink.findMany({
      where: { status: "READY", isActive: true },
      select: { id: true, name: true, description: true, domain: true, pagesScraped: true, chunkCount: true },
      orderBy: { createdAt: "desc" },
    });

    return links.map((l) => ({
      id: `link:${l.id}`,
      type: "link",
      domain: this.domain,
      name: l.name,
      description: l.description,
      contentLength: l.chunkCount * 1000,
      extra: `domain: ${l.domain}, pages: ${l.pagesScraped}`,
    }));
  }

  async fetchByIds(grouped: Record<string, string[]>): Promise<SearchResult[]> {
    if (!grouped.link) return [];
    const links = await prisma.knowledgeLink.findMany({
      where: { id: { in: grouped.link } },
      select: {
        id: true,
        name: true,
        textContent: true,
        pages: {
          select: { url: true, textContent: true },
          take: 20,
        },
      },
    });
    return links.map((l) => {
      const pageContent = l.pages
        .map((p) => `--- Page: ${p.url} ---\n${p.textContent || ""}`)
        .join("\n\n");
      const fullContent = l.textContent
        ? `${l.textContent}\n\n${pageContent}`
        : pageContent;
      return {
        id: `link:${l.id}`,
        type: "link",
        name: l.name,
        content: truncate(fullContent),
      };
    });
  }

  async searchByKeyword(keyword: string, types: string[], take: number): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("link")) return [];
    const links = await prisma.knowledgeLink.findMany({
      where: {
        textContent: { contains: keyword, mode: "insensitive" },
        status: "READY",
        isActive: true,
      },
      select: { id: true, name: true, textContent: true },
      take,
    });
    return links.map((l) => ({
      id: `link:${l.id}`,
      type: "link",
      name: l.name,
      content: truncate(l.textContent),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const links = await prisma.knowledgeLink.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, description: true, domain: true, pagesScraped: true },
    });
    return links.map((l) => ({
      id: `link:${l.id}`,
      type: "link",
      name: l.name,
      description: l.description,
      meta: { domain: l.domain, pagesScraped: l.pagesScraped },
    }));
  }
}
