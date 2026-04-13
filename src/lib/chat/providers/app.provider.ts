import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

export class AppProvider implements DataProvider {
  domain = "knowledge";
  types = ["app_data"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const dataPoints = await prisma.knowledgeAppDataPoint.findMany({
      where: { status: "READY" },
      select: {
        id: true,
        category: true,
        date: true,
        chunkCount: true,
        app: { select: { name: true, slug: true } },
      },
      orderBy: { date: "desc" },
      take: 200,
    });

    return dataPoints.map((dp) => ({
      id: `app_data:${dp.id}`,
      type: "app_data",
      domain: this.domain,
      name: `${dp.app.name} - ${dp.category}`,
      description: null,
      contentLength: dp.chunkCount * 1000,
      extra: `app: ${dp.app.slug}, category: ${dp.category}, date: ${dp.date.toISOString().split("T")[0]}`,
    }));
  }

  async fetchByIds(grouped: Record<string, string[]>): Promise<SearchResult[]> {
    if (!grouped.app_data) return [];
    const dps = await prisma.knowledgeAppDataPoint.findMany({
      where: { id: { in: grouped.app_data } },
      select: {
        id: true,
        category: true,
        textContent: true,
        date: true,
        app: { select: { name: true } },
      },
    });
    return dps.map((dp) => ({
      id: `app_data:${dp.id}`,
      type: "app_data",
      name: `${dp.app.name} - ${dp.category} (${dp.date.toISOString().split("T")[0]})`,
      content: truncate(dp.textContent),
    }));
  }

  async searchByKeyword(keyword: string, types: string[], take: number): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("app_data")) return [];
    const dps = await prisma.knowledgeAppDataPoint.findMany({
      where: {
        textContent: { contains: keyword, mode: "insensitive" },
        status: "READY",
      },
      select: {
        id: true,
        category: true,
        textContent: true,
        date: true,
        app: { select: { name: true } },
      },
      take,
    });
    return dps.map((dp) => ({
      id: `app_data:${dp.id}`,
      type: "app_data",
      name: `${dp.app.name} - ${dp.category} (${dp.date.toISOString().split("T")[0]})`,
      content: truncate(dp.textContent),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const dps = await prisma.knowledgeAppDataPoint.findMany({
      where: { id: { in: ids } },
      select: { id: true, category: true, date: true, app: { select: { name: true } } },
    });
    return dps.map((dp) => ({
      id: `app_data:${dp.id}`,
      type: "app_data",
      name: `${dp.app.name} - ${dp.category}`,
      category: dp.category,
      meta: { appName: dp.app.name, date: dp.date.toISOString() },
    }));
  }
}
