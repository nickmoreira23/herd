import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmtAmount(v: any, currency: string): string | null {
  if (v == null) return null;
  const n = typeof v === "object" && v.toNumber ? v.toNumber() : Number(v);
  return `${currency} ${n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderExperienceContent(e: any): string {
  const lines: string[] = [];
  lines.push(`# ${e.name}`);
  if (e.headline) lines.push(e.headline);
  lines.push(`Status: ${e.status} · Format: ${e.format}`);
  if (e.startDate) {
    const d = e.startDate instanceof Date ? e.startDate : new Date(e.startDate);
    lines.push(`Start: ${d.toISOString().slice(0, 10)}`);
  }
  if (e.endDate) {
    const d = e.endDate instanceof Date ? e.endDate : new Date(e.endDate);
    lines.push(`End: ${d.toISOString().slice(0, 10)}`);
  }
  if (e.durationMin) lines.push(`Duration: ${e.durationMin} min`);
  if (e.locationName) lines.push(`Location: ${e.locationName}`);
  if (e.capacity) lines.push(`Capacity: ${e.capacity}`);
  const price = fmtAmount(e.price, e.currency);
  if (price) lines.push(`Price: ${price}`);
  if (e.tags?.length) lines.push(`Tags: ${e.tags.join(", ")}`);
  if (e.description) lines.push("", e.description);
  if (e.contentText) lines.push("", e.contentText);
  return lines.join("\n");
}

export class ExperienceProvider implements DataProvider {
  domain = "commerce";
  types = ["experience"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const experiences = await prisma.experience.findMany({
      orderBy: [{ startDate: "asc" }, { updatedAt: "desc" }],
      take: 200,
    });

    return experiences.map((e) => {
      const extras = [
        e.status,
        e.format,
        e.locationName,
        fmtAmount(e.price, e.currency),
      ].filter(Boolean);
      return {
        id: `experience:${e.id}`,
        type: "experience",
        domain: this.domain,
        name: e.name,
        description: e.headline || e.description || e.contentText.slice(0, 160) || null,
        contentLength: (e.contentText.length || 0) + 200,
        extra: extras.length ? extras.join(" · ") : undefined,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.experience) return [];

    const experiences = await prisma.experience.findMany({
      where: { id: { in: grouped.experience } },
    });

    return experiences.map((e) => ({
      id: `experience:${e.id}`,
      type: "experience",
      name: e.name,
      content: truncate(renderExperienceContent(e)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("experience")) return [];

    const experiences = await prisma.experience.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { headline: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { locationName: { contains: keyword, mode: "insensitive" } },
          { contentText: { contains: keyword, mode: "insensitive" } },
          { tags: { has: keyword } },
        ],
      },
      take,
    });

    return experiences.map((e) => ({
      id: `experience:${e.id}`,
      type: "experience",
      name: e.name,
      content: truncate(renderExperienceContent(e)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const experiences = await prisma.experience.findMany({
      where: { id: { in: ids } },
    });

    return experiences.map((e) => ({
      id: `experience:${e.id}`,
      type: "experience",
      name: e.name,
      description: e.headline || e.description || null,
      imageUrl: e.coverImageUrl,
      category: e.format,
      meta: {
        format: e.format,
        status: e.status,
        startDate: e.startDate?.toISOString() ?? null,
        endDate: e.endDate?.toISOString() ?? null,
        durationMin: e.durationMin,
        locationName: e.locationName,
        capacity: e.capacity,
        price: e.price?.toString() ?? null,
        currency: e.currency,
        hostId: e.hostId,
        tags: e.tags,
      },
    }));
  }
}
