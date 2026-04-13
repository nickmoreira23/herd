import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

export class ImageProvider implements DataProvider {
  domain = "knowledge";
  types = ["image"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const images = await prisma.knowledgeImage.findMany({
      where: { status: "READY", isActive: true },
      select: { id: true, name: true, description: true, fileType: true, chunkCount: true },
      orderBy: { uploadedAt: "desc" },
    });

    return images.map((i) => ({
      id: `image:${i.id}`,
      type: "image",
      domain: this.domain,
      name: i.name,
      description: i.description,
      contentLength: i.chunkCount * 1000,
      extra: `format: ${i.fileType}`,
    }));
  }

  async fetchByIds(grouped: Record<string, string[]>): Promise<SearchResult[]> {
    if (!grouped.image) return [];
    const imgs = await prisma.knowledgeImage.findMany({
      where: { id: { in: grouped.image } },
      select: { id: true, name: true, textContent: true },
    });
    return imgs.map((i) => ({
      id: `image:${i.id}`,
      type: "image",
      name: i.name,
      content: truncate(i.textContent),
    }));
  }

  async searchByKeyword(keyword: string, types: string[], take: number): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("image")) return [];
    const imgs = await prisma.knowledgeImage.findMany({
      where: {
        textContent: { contains: keyword, mode: "insensitive" },
        status: "READY",
        isActive: true,
      },
      select: { id: true, name: true, textContent: true },
      take,
    });
    return imgs.map((i) => ({
      id: `image:${i.id}`,
      type: "image",
      name: i.name,
      content: truncate(i.textContent),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const imgs = await prisma.knowledgeImage.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, description: true, fileType: true, fileUrl: true },
    });
    return imgs.map((i) => ({
      id: `image:${i.id}`,
      type: "image",
      name: i.name,
      description: i.description,
      imageUrl: i.fileUrl,
      meta: { fileType: i.fileType },
    }));
  }
}
