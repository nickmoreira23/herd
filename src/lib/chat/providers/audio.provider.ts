import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

export class AudioProvider implements DataProvider {
  domain = "knowledge";
  types = ["audio"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const audios = await prisma.knowledgeAudio.findMany({
      where: { status: "READY", isActive: true },
      select: { id: true, name: true, description: true, fileType: true, duration: true, chunkCount: true },
      orderBy: { uploadedAt: "desc" },
    });

    return audios.map((a) => ({
      id: `audio:${a.id}`,
      type: "audio",
      domain: this.domain,
      name: a.name,
      description: a.description,
      contentLength: a.chunkCount * 1000,
      extra: `format: ${a.fileType}, duration: ${a.duration ? Math.round(a.duration) + "s" : "unknown"}`,
    }));
  }

  async fetchByIds(grouped: Record<string, string[]>): Promise<SearchResult[]> {
    if (!grouped.audio) return [];
    const auds = await prisma.knowledgeAudio.findMany({
      where: { id: { in: grouped.audio } },
      select: { id: true, name: true, textContent: true },
    });
    return auds.map((a) => ({
      id: `audio:${a.id}`,
      type: "audio",
      name: a.name,
      content: truncate(a.textContent),
    }));
  }

  async searchByKeyword(keyword: string, types: string[], take: number): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("audio")) return [];
    const auds = await prisma.knowledgeAudio.findMany({
      where: {
        textContent: { contains: keyword, mode: "insensitive" },
        status: "READY",
        isActive: true,
      },
      select: { id: true, name: true, textContent: true },
      take,
    });
    return auds.map((a) => ({
      id: `audio:${a.id}`,
      type: "audio",
      name: a.name,
      content: truncate(a.textContent),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const auds = await prisma.knowledgeAudio.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, description: true, fileType: true, duration: true },
    });
    return auds.map((a) => ({
      id: `audio:${a.id}`,
      type: "audio",
      name: a.name,
      description: a.description,
      meta: { fileType: a.fileType, duration: a.duration },
    }));
  }
}
