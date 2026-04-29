import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fmtPrice(v: any): string | null {
  if (v == null) return null;
  const n = typeof v === "object" && v.toNumber ? v.toNumber() : Number(v);
  if (!n) return null;
  return `BRL ${n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderTier(t: any): string {
  const lines: string[] = [];
  lines.push(`# ${t.name}`);
  if (t.tagline) lines.push(t.tagline);
  lines.push(`Status: ${t.status} · Visibility: ${t.visibility}`);
  const monthly = fmtPrice(t.monthlyPrice);
  const quarterly = fmtPrice(t.quarterlyPrice);
  const annual = fmtPrice(t.annualPrice);
  if (monthly) lines.push(`Monthly: ${monthly}`);
  if (quarterly) lines.push(`Quarterly: ${quarterly}`);
  if (annual) lines.push(`Annual: ${annual}`);
  const credits = fmtPrice(t.monthlyCredits);
  if (credits) lines.push(`Monthly credits: ${credits}`);
  if (t.trialDays) lines.push(`Trial: ${t.trialDays} days`);
  if (t.highlightFeatures?.length) {
    lines.push("", "Highlights:");
    for (const f of t.highlightFeatures.slice(0, 8)) lines.push(`- ${f}`);
  }
  if (t.description) lines.push("", t.description);
  return lines.join("\n");
}

export class SubscriptionProvider implements DataProvider {
  domain = "commerce";
  types = ["subscription_tier"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const tiers = await prisma.subscriptionTier.findMany({
      orderBy: { sortOrder: "asc" },
      take: 200,
    });
    return tiers.map((t) => {
      const extras = [t.status, t.visibility, fmtPrice(t.monthlyPrice)]
        .filter(Boolean)
        .join(" · ");
      return {
        id: `subscription_tier:${t.id}`,
        type: "subscription_tier",
        domain: this.domain,
        name: t.name,
        description: t.tagline || t.description || null,
        contentLength: (t.description?.length || 0) + 200,
        extra: extras || undefined,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    const ids = grouped.subscription_tier;
    if (!ids?.length) return [];
    const tiers = await prisma.subscriptionTier.findMany({
      where: { id: { in: ids } },
    });
    return tiers.map((t) => ({
      id: `subscription_tier:${t.id}`,
      type: "subscription_tier",
      name: t.name,
      content: truncate(renderTier(t)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("subscription_tier")) return [];
    const tiers = await prisma.subscriptionTier.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { slug: { contains: keyword, mode: "insensitive" } },
          { tagline: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { highlightFeatures: { has: keyword } },
        ],
      },
      take,
    });
    return tiers.map((t) => ({
      id: `subscription_tier:${t.id}`,
      type: "subscription_tier",
      name: t.name,
      content: truncate(renderTier(t)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const tiers = await prisma.subscriptionTier.findMany({
      where: { id: { in: ids } },
    });
    return tiers.map((t) => ({
      id: `subscription_tier:${t.id}`,
      type: "subscription_tier",
      name: t.name,
      description: t.tagline || t.description || null,
      imageUrl: t.iconUrl,
      category: t.status,
      meta: {
        slug: t.slug,
        status: t.status,
        visibility: t.visibility,
        colorAccent: t.colorAccent,
        monthlyPrice: t.monthlyPrice.toString(),
        quarterlyPrice: t.quarterlyPrice.toString(),
        annualPrice: t.annualPrice.toString(),
        monthlyCredits: t.monthlyCredits.toString(),
        trialDays: t.trialDays,
        highlightFeatures: t.highlightFeatures,
      },
    }));
  }
}
