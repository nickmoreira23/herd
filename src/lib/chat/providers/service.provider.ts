import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

const PRICING_LABELS: Record<string, string> = {
  FIXED: "fixo",
  HOURLY: "/ hora",
  DAILY: "/ dia",
  MONTHLY: "/ mês",
  CUSTOM: "sob consulta",
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatPrice(s: any): string {
  if (s.pricingType === "CUSTOM" || !s.price) return "sob consulta";
  return `R$ ${s.price.toString()} ${PRICING_LABELS[s.pricingType] || ""}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderServiceContent(s: any): string {
  const lines: string[] = [];
  lines.push(`# ${s.name}`);
  lines.push(`Status: ${s.status}`);
  if (s.category) lines.push(`Category: ${s.category}`);
  if (s.duration) lines.push(`Duration: ${s.duration}`);
  lines.push(`Price: ${formatPrice(s)}`);
  if (s.tags?.length) lines.push(`Tags: ${s.tags.join(", ")}`);
  if (s.description) lines.push("", s.description);
  if (s.contentText) lines.push("", s.contentText);
  return lines.join("\n");
}

export class ServiceProvider implements DataProvider {
  domain = "foundation";
  types = ["service"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const services = await prisma.service.findMany({
      where: { status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });

    return services.map((s) => {
      const desc = s.description || s.contentText.slice(0, 160) || null;
      const extra = [
        s.category,
        s.duration,
        formatPrice(s),
      ]
        .filter(Boolean)
        .join(", ");
      return {
        id: `service:${s.id}`,
        type: "service",
        domain: this.domain,
        name: s.name,
        description: desc,
        contentLength: (s.contentText.length || 0) + 200,
        extra,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.service) return [];

    const services = await prisma.service.findMany({
      where: { id: { in: grouped.service } },
    });

    return services.map((s) => ({
      id: `service:${s.id}`,
      type: "service",
      name: s.name,
      content: truncate(renderServiceContent(s)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("service")) return [];

    const services = await prisma.service.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { key: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { contentText: { contains: keyword, mode: "insensitive" } },
          { category: { contains: keyword, mode: "insensitive" } },
          { tags: { has: keyword } },
        ],
      },
      take,
    });

    return services.map((s) => ({
      id: `service:${s.id}`,
      type: "service",
      name: s.name,
      content: truncate(renderServiceContent(s)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const services = await prisma.service.findMany({
      where: { id: { in: ids } },
    });

    return services.map((s) => ({
      id: `service:${s.id}`,
      type: "service",
      name: s.name,
      description: s.description,
      imageUrl: s.imageUrl,
      status: s.status,
      category: s.category,
      meta: {
        key: s.key,
        category: s.category,
        duration: s.duration,
        price: s.price?.toString() ?? null,
        pricingType: s.pricingType,
        icon: s.icon,
        sortOrder: s.sortOrder,
        tags: s.tags,
      },
    }));
  }
}
