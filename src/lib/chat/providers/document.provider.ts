import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

export class DocumentProvider implements DataProvider {
  domain = "knowledge";
  types = ["document"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const documents = await prisma.knowledgeDocument.findMany({
      where: { status: "READY", isActive: true },
      select: { id: true, name: true, description: true, fileType: true, chunkCount: true },
      orderBy: { uploadedAt: "desc" },
    });

    return documents.map((d) => ({
      id: `document:${d.id}`,
      type: "document",
      domain: this.domain,
      name: d.name,
      description: d.description,
      contentLength: d.chunkCount * 1000,
      extra: `format: ${d.fileType}`,
    }));
  }

  async fetchByIds(grouped: Record<string, string[]>): Promise<SearchResult[]> {
    if (!grouped.document) return [];
    const docs = await prisma.knowledgeDocument.findMany({
      where: { id: { in: grouped.document } },
      select: { id: true, name: true, textContent: true },
    });
    return docs.map((d) => ({
      id: `document:${d.id}`,
      type: "document",
      name: d.name,
      content: truncate(d.textContent),
    }));
  }

  async searchByKeyword(keyword: string, types: string[], take: number): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("document")) return [];
    const docs = await prisma.knowledgeDocument.findMany({
      where: {
        textContent: { contains: keyword, mode: "insensitive" },
        status: "READY",
        isActive: true,
      },
      select: { id: true, name: true, textContent: true },
      take,
    });
    return docs.map((d) => ({
      id: `document:${d.id}`,
      type: "document",
      name: d.name,
      content: truncate(d.textContent),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const docs = await prisma.knowledgeDocument.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, description: true, fileType: true, chunkCount: true },
    });
    return docs.map((d) => ({
      id: `document:${d.id}`,
      type: "document",
      name: d.name,
      description: d.description,
      meta: { fileType: d.fileType, chunkCount: d.chunkCount },
    }));
  }
}
