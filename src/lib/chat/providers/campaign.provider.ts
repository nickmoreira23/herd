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
function renderCampaignContent(c: any): string {
  const lines: string[] = [];
  lines.push(`# ${c.name}`);
  lines.push(`Status: ${c.status}`);
  if (c.objective) lines.push(`Objective: ${c.objective}`);
  if (c.channels?.length) lines.push(`Channels: ${c.channels.join(", ")}`);
  if (c.startDate) {
    const d = c.startDate instanceof Date ? c.startDate : new Date(c.startDate);
    lines.push(`Start: ${d.toISOString().slice(0, 10)}`);
  }
  if (c.endDate) {
    const d = c.endDate instanceof Date ? c.endDate : new Date(c.endDate);
    lines.push(`End: ${d.toISOString().slice(0, 10)}`);
  }
  const budget = fmtAmount(c.budget, c.currency);
  const spent = fmtAmount(c.spent, c.currency);
  if (budget) lines.push(`Budget: ${budget}`);
  if (spent) lines.push(`Spent: ${spent}`);
  if (c.audience) lines.push(`Audience: ${c.audience}`);
  if (c.tags?.length) lines.push(`Tags: ${c.tags.join(", ")}`);
  if (c._count?.deals !== undefined)
    lines.push(`Attributed deals: ${c._count.deals}`);
  if (c.description) lines.push("", c.description);
  if (c.contentText) lines.push("", c.contentText);
  return lines.join("\n");
}

export class CampaignProvider implements DataProvider {
  domain = "marketing";
  types = ["campaign"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const campaigns = await prisma.campaign.findMany({
      include: { _count: { select: { deals: true } } },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    return campaigns.map((c) => {
      const extras = [
        c.status,
        c.channels?.join("/") || null,
        c._count.deals > 0 ? `${c._count.deals} deals` : null,
      ].filter(Boolean);
      return {
        id: `campaign:${c.id}`,
        type: "campaign",
        domain: this.domain,
        name: c.name,
        description: c.description || c.contentText.slice(0, 160) || null,
        contentLength: (c.contentText.length || 0) + 200,
        extra: extras.length ? extras.join(" · ") : undefined,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.campaign) return [];

    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: grouped.campaign } },
      include: { _count: { select: { deals: true } } },
    });

    return campaigns.map((c) => ({
      id: `campaign:${c.id}`,
      type: "campaign",
      name: c.name,
      content: truncate(renderCampaignContent(c)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("campaign")) return [];

    const campaigns = await prisma.campaign.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { audience: { contains: keyword, mode: "insensitive" } },
          { contentText: { contains: keyword, mode: "insensitive" } },
          { tags: { has: keyword } },
        ],
      },
      include: { _count: { select: { deals: true } } },
      take,
    });

    return campaigns.map((c) => ({
      id: `campaign:${c.id}`,
      type: "campaign",
      name: c.name,
      content: truncate(renderCampaignContent(c)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const campaigns = await prisma.campaign.findMany({
      where: { id: { in: ids } },
      include: { _count: { select: { deals: true } } },
    });

    return campaigns.map((c) => ({
      id: `campaign:${c.id}`,
      type: "campaign",
      name: c.name,
      description: c.description || null,
      imageUrl: null,
      category: c.status,
      meta: {
        status: c.status,
        objective: c.objective,
        channels: c.channels,
        startDate: c.startDate?.toISOString() ?? null,
        endDate: c.endDate?.toISOString() ?? null,
        budget: c.budget?.toString() ?? null,
        spent: c.spent?.toString() ?? null,
        currency: c.currency,
        audience: c.audience,
        dealCount: c._count.deals,
        tags: c.tags,
      },
    }));
  }
}
