import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

export class TableProvider implements DataProvider {
  domain = "knowledge";
  types = ["table"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const tables = await prisma.knowledgeTable.findMany({
      where: { status: "READY", isActive: true },
      select: { id: true, name: true, description: true, recordCount: true, fieldCount: true, chunkCount: true },
      orderBy: { createdAt: "desc" },
    });

    return tables.map((t) => ({
      id: `table:${t.id}`,
      type: "table",
      domain: this.domain,
      name: t.name,
      description: t.description,
      contentLength: t.chunkCount * 1000,
      extra: `records: ${t.recordCount}, fields: ${t.fieldCount}`,
    }));
  }

  async fetchByIds(grouped: Record<string, string[]>): Promise<SearchResult[]> {
    if (!grouped.table) return [];
    const tables = await prisma.knowledgeTable.findMany({
      where: { id: { in: grouped.table } },
      select: { id: true, name: true, textContent: true },
    });
    return tables.map((t) => ({
      id: `table:${t.id}`,
      type: "table",
      name: t.name,
      content: truncate(t.textContent),
    }));
  }

  async searchByKeyword(keyword: string, types: string[], take: number): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("table")) return [];
    const tables = await prisma.knowledgeTable.findMany({
      where: {
        textContent: { contains: keyword, mode: "insensitive" },
        status: "READY",
        isActive: true,
      },
      select: { id: true, name: true, textContent: true },
      take,
    });
    return tables.map((t) => ({
      id: `table:${t.id}`,
      type: "table",
      name: t.name,
      content: truncate(t.textContent),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const tables = await prisma.knowledgeTable.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, description: true, recordCount: true, fieldCount: true },
    });
    return tables.map((t) => ({
      id: `table:${t.id}`,
      type: "table",
      name: t.name,
      description: t.description,
      meta: { recordCount: t.recordCount, fieldCount: t.fieldCount },
    }));
  }
}
