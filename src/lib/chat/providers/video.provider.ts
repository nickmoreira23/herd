import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

export class VideoProvider implements DataProvider {
  domain = "knowledge";
  types = ["video"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const videos = await prisma.knowledgeVideo.findMany({
      where: { status: "READY", isActive: true },
      select: { id: true, name: true, description: true, fileType: true, duration: true, chunkCount: true },
      orderBy: { uploadedAt: "desc" },
    });

    return videos.map((v) => ({
      id: `video:${v.id}`,
      type: "video",
      domain: this.domain,
      name: v.name,
      description: v.description,
      contentLength: v.chunkCount * 1000,
      extra: `format: ${v.fileType}, duration: ${v.duration ? Math.round(v.duration) + "s" : "unknown"}`,
    }));
  }

  async fetchByIds(grouped: Record<string, string[]>): Promise<SearchResult[]> {
    if (!grouped.video) return [];
    const vids = await prisma.knowledgeVideo.findMany({
      where: { id: { in: grouped.video } },
      select: { id: true, name: true, textContent: true },
    });
    return vids.map((v) => ({
      id: `video:${v.id}`,
      type: "video",
      name: v.name,
      content: truncate(v.textContent),
    }));
  }

  async searchByKeyword(keyword: string, types: string[], take: number): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("video")) return [];
    const vids = await prisma.knowledgeVideo.findMany({
      where: {
        textContent: { contains: keyword, mode: "insensitive" },
        status: "READY",
        isActive: true,
      },
      select: { id: true, name: true, textContent: true },
      take,
    });
    return vids.map((v) => ({
      id: `video:${v.id}`,
      type: "video",
      name: v.name,
      content: truncate(v.textContent),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const vids = await prisma.knowledgeVideo.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, description: true, fileType: true, duration: true, thumbnailUrl: true },
    });
    return vids.map((v) => ({
      id: `video:${v.id}`,
      type: "video",
      name: v.name,
      description: v.description,
      imageUrl: v.thumbnailUrl,
      meta: { fileType: v.fileType, duration: v.duration },
    }));
  }
}
