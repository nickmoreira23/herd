import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPerkContent(p: any): string {
  const lines: string[] = [];

  lines.push(`# Perk: ${p.name}`);
  lines.push(`Key: ${p.key}`);
  lines.push(`Status: ${p.status}`);

  if (p.description) {
    lines.push("", "## Description", p.description);
  }

  if (p.longDescription) {
    lines.push("", "## Details", p.longDescription);
  }

  if (p.hasSubConfig) {
    lines.push("", "## Configuration");
    if (p.subConfigLabel) lines.push(`Label: ${p.subConfigLabel}`);
    if (p.subConfigType) lines.push(`Type: ${p.subConfigType}`);
    if (p.subConfigOptions && p.subConfigOptions.length > 0) {
      lines.push(`Options: ${p.subConfigOptions.join(", ")}`);
    }
  }

  if (p.tierAssignments && p.tierAssignments.length > 0) {
    lines.push("", "## Tier Access");
    for (const ta of p.tierAssignments) {
      lines.push(
        `- ${ta.tier.name}: ${ta.isEnabled ? "Enabled" : "Disabled"}${ta.configValue ? ` (value: ${ta.configValue})` : ""}`
      );
    }
  }

  if (p.tags && p.tags.length > 0) {
    lines.push("", `Tags: ${p.tags.join(", ")}`);
  }

  return lines.join("\n");
}

export class PerkProvider implements DataProvider {
  domain = "foundation";
  types = ["perk"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const perks = await prisma.perk.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        description: true,
        tags: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return perks.map((p) => ({
      id: `perk:${p.id}`,
      type: "perk",
      domain: this.domain,
      name: p.name,
      description: p.description,
      contentLength: (p.description?.length || 0) + 300,
      extra: p.tags.length > 0 ? `tags: ${p.tags.join(", ")}` : undefined,
    }));
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.perk) return [];

    const perks = await prisma.perk.findMany({
      where: { id: { in: grouped.perk } },
      include: {
        tierAssignments: {
          include: { tier: { select: { name: true } } },
        },
      },
    });

    return perks.map((p) => ({
      id: `perk:${p.id}`,
      type: "perk",
      name: p.name,
      content: truncate(renderPerkContent(p)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("perk")) return [];

    const perks = await prisma.perk.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { longDescription: { contains: keyword, mode: "insensitive" } },
        ],
      },
      include: {
        tierAssignments: {
          include: { tier: { select: { name: true } } },
        },
      },
      take,
    });

    return perks.map((p) => ({
      id: `perk:${p.id}`,
      type: "perk",
      name: p.name,
      content: truncate(renderPerkContent(p)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const perks = await prisma.perk.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        tags: true,
        _count: { select: { tierAssignments: true } },
      },
    });

    return perks.map((p) => ({
      id: `perk:${p.id}`,
      type: "perk",
      name: p.name,
      description: p.description,
      status: p.status,
      meta: { tags: p.tags, tierCount: p._count.tierAssignments },
    }));
  }
}
