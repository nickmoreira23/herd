import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPartnerContent(p: any): string {
  const lines: string[] = [];

  lines.push(`# Partner Brand: ${p.name}`);
  lines.push(`Category: ${p.category}`);
  lines.push(`Status: ${p.status}`);
  if (p.tagline) lines.push(`Tagline: ${p.tagline}`);
  if (p.websiteUrl) lines.push(`Website: ${p.websiteUrl}`);

  if (p.description) {
    lines.push("", "## Description", p.description);
  }

  if (p.audienceBenefit || p.discountDescription || p.benefitType) {
    lines.push("", "## Member Benefit");
    if (p.audienceBenefit) lines.push(`Benefit: ${p.audienceBenefit}`);
    if (p.discountDescription)
      lines.push(`Discount: ${p.discountDescription}`);
    if (p.benefitType) lines.push(`Type: ${p.benefitType}`);
  }

  if (p.kickbackType !== "NONE") {
    lines.push("", "## Revenue Share");
    lines.push(`Type: ${p.kickbackType}`);
    if (p.kickbackValue) lines.push(`Value: ${p.kickbackValue}`);
  }

  if (
    p.commissionRate ||
    p.commissionType ||
    p.affiliateNetwork ||
    p.cookieDuration
  ) {
    lines.push("", "## Affiliate Details");
    if (p.affiliateNetwork) lines.push(`Network: ${p.affiliateNetwork}`);
    if (p.commissionRate) lines.push(`Commission: ${p.commissionRate}`);
    if (p.commissionType) lines.push(`Commission Type: ${p.commissionType}`);
    if (p.cookieDuration) lines.push(`Cookie Duration: ${p.cookieDuration}`);
  }

  lines.push("", `Tier Access: ${p.tierAccess}`);

  if (p.tierAssignments && p.tierAssignments.length > 0) {
    lines.push("", "## Tier-Specific Discounts");
    for (const ta of p.tierAssignments) {
      lines.push(
        `- ${ta.tier.name}: ${ta.discountPercent}% discount${ta.isActive ? "" : " (inactive)"}`
      );
    }
  }

  if (p.notes) {
    lines.push("", "## Notes", p.notes);
  }

  return lines.join("\n");
}

export class PartnerProvider implements DataProvider {
  domain = "foundation";
  types = ["partner_brand"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const partners = await prisma.partnerBrand.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        audienceBenefit: true,
      },
      orderBy: { name: "asc" },
    });

    return partners.map((p) => ({
      id: `partner_brand:${p.id}`,
      type: "partner_brand",
      domain: this.domain,
      name: p.name,
      description: p.description,
      contentLength: (p.description?.length || 0) + 500,
      extra: `category: ${p.category}${p.audienceBenefit ? `, benefit: ${p.audienceBenefit}` : ""}`,
    }));
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.partner_brand) return [];

    const partners = await prisma.partnerBrand.findMany({
      where: { id: { in: grouped.partner_brand } },
      include: {
        tierAssignments: {
          include: { tier: { select: { name: true } } },
        },
      },
    });

    return partners.map((p) => ({
      id: `partner_brand:${p.id}`,
      type: "partner_brand",
      name: p.name,
      content: truncate(renderPartnerContent(p)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("partner_brand")) return [];

    const partners = await prisma.partnerBrand.findMany({
      where: {
        status: "ACTIVE",
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { tagline: { contains: keyword, mode: "insensitive" } },
          { discountDescription: { contains: keyword, mode: "insensitive" } },
          { audienceBenefit: { contains: keyword, mode: "insensitive" } },
          { category: { contains: keyword, mode: "insensitive" } },
        ],
      },
      include: {
        tierAssignments: {
          include: { tier: { select: { name: true } } },
        },
      },
      take,
    });

    return partners.map((p) => ({
      id: `partner_brand:${p.id}`,
      type: "partner_brand",
      name: p.name,
      content: truncate(renderPartnerContent(p)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const partners = await prisma.partnerBrand.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        description: true,
        logoUrl: true,
        category: true,
        status: true,
        audienceBenefit: true,
      },
    });

    return partners.map((p) => ({
      id: `partner_brand:${p.id}`,
      type: "partner_brand",
      name: p.name,
      description: p.description,
      imageUrl: p.logoUrl,
      status: p.status,
      category: p.category,
      meta: { audienceBenefit: p.audienceBenefit },
    }));
  }
}
