import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

export class FormProvider implements DataProvider {
  domain = "knowledge";
  types = ["form"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const forms = await prisma.knowledgeForm.findMany({
      where: { status: "READY", isActive: true },
      select: { id: true, name: true, description: true, responseCount: true, chunkCount: true },
      orderBy: { createdAt: "desc" },
    });

    return forms.map((f) => ({
      id: `form:${f.id}`,
      type: "form",
      domain: this.domain,
      name: f.name,
      description: f.description,
      contentLength: f.chunkCount * 1000,
      extra: `responses: ${f.responseCount}`,
    }));
  }

  async fetchByIds(grouped: Record<string, string[]>): Promise<SearchResult[]> {
    if (!grouped.form) return [];
    const forms = await prisma.knowledgeForm.findMany({
      where: { id: { in: grouped.form } },
      select: { id: true, name: true, textContent: true },
    });
    return forms.map((f) => ({
      id: `form:${f.id}`,
      type: "form",
      name: f.name,
      content: truncate(f.textContent),
    }));
  }

  async searchByKeyword(keyword: string, types: string[], take: number): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("form")) return [];
    const forms = await prisma.knowledgeForm.findMany({
      where: {
        textContent: { contains: keyword, mode: "insensitive" },
        status: "READY",
        isActive: true,
      },
      select: { id: true, name: true, textContent: true },
      take,
    });
    return forms.map((f) => ({
      id: `form:${f.id}`,
      type: "form",
      name: f.name,
      content: truncate(f.textContent),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const forms = await prisma.knowledgeForm.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, description: true, responseCount: true },
    });
    return forms.map((f) => ({
      id: `form:${f.id}`,
      type: "form",
      name: f.name,
      description: f.description,
      meta: { responseCount: f.responseCount },
    }));
  }
}
