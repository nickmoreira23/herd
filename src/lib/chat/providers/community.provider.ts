import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCommunityContent(c: any): string {
  const lines: string[] = [];

  lines.push(`# Community Benefit: ${c.name}`);
  lines.push(`Key: ${c.key}`);
  lines.push(`Status: ${c.status}`);
  if (c.platform) lines.push(`Platform: ${c.platform}`);
  if (c.accessUrl) lines.push(`Access URL: ${c.accessUrl}`);

  if (c.description) {
    lines.push("", "## Description", c.description);
  }

  if (c.longDescription) {
    lines.push("", "## Details", c.longDescription);
  }

  if (c.tierAssignments && c.tierAssignments.length > 0) {
    lines.push("", "## Tier Access");
    for (const ta of c.tierAssignments) {
      lines.push(
        `- ${ta.tier.name}: ${ta.isEnabled ? "Enabled" : "Disabled"}`
      );
    }
  }

  if (c.tags && c.tags.length > 0) {
    lines.push("", `Tags: ${c.tags.join(", ")}`);
  }

  return lines.join("\n");
}

export class CommunityProvider implements DataProvider {
  domain = "foundation";
  types = ["community_benefit"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const benefits = await prisma.communityBenefit.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        description: true,
        platform: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return benefits.map((c) => ({
      id: `community_benefit:${c.id}`,
      type: "community_benefit",
      domain: this.domain,
      name: c.name,
      description: c.description,
      contentLength: (c.description?.length || 0) + 300,
      extra: c.platform ? `platform: ${c.platform}` : undefined,
    }));
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.community_benefit) return [];

    const benefits = await prisma.communityBenefit.findMany({
      where: { id: { in: grouped.community_benefit } },
      include: {
        tierAssignments: {
          include: { tier: { select: { name: true } } },
        },
      },
    });

    return benefits.map((c) => ({
      id: `community_benefit:${c.id}`,
      type: "community_benefit",
      name: c.name,
      content: truncate(renderCommunityContent(c)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("community_benefit")) return [];

    const benefits = await prisma.communityBenefit.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { longDescription: { contains: keyword, mode: "insensitive" } },
          { platform: { contains: keyword, mode: "insensitive" } },
        ],
      },
      include: {
        tierAssignments: {
          include: { tier: { select: { name: true } } },
        },
      },
      take,
    });

    return benefits.map((c) => ({
      id: `community_benefit:${c.id}`,
      type: "community_benefit",
      name: c.name,
      content: truncate(renderCommunityContent(c)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const benefits = await prisma.communityBenefit.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        platform: true,
        accessUrl: true,
      },
    });

    return benefits.map((c) => ({
      id: `community_benefit:${c.id}`,
      type: "community_benefit",
      name: c.name,
      description: c.description,
      status: c.status,
      meta: { platform: c.platform, accessUrl: c.accessUrl },
    }));
  }
}
