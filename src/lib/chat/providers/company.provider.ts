import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatAddress(c: any): string {
  const parts = [c.street, c.street2, c.city, c.state, c.zip].filter(Boolean);
  if (c.country) parts.push(c.country);
  return parts.join(", ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCompanyContent(c: any): string {
  const lines: string[] = [];
  lines.push(`# ${c.name}`);
  if (c.legalName) lines.push(`Legal name: ${c.legalName}`);
  if (c.taxId) lines.push(`Tax ID: ${c.taxId}`);
  if (c.industry || c.size) {
    lines.push(
      `Segment: ${c.industry || ""}${c.size ? ` (${c.size})` : ""}`
    );
  }
  if (c.website) lines.push(`Website: ${c.website}`);
  if (c.domain) lines.push(`Domain: ${c.domain}`);
  if (c.email) lines.push(`Email: ${c.email}`);
  if (c.phone) lines.push(`Phone: ${c.phone}`);
  if (c.linkedinUrl) lines.push(`LinkedIn: ${c.linkedinUrl}`);
  if (c.twitterHandle) lines.push(`Twitter: ${c.twitterHandle}`);
  const address = formatAddress(c);
  if (address) lines.push(`Address: ${address}`);
  if (c.tags?.length) lines.push(`Tags: ${c.tags.join(", ")}`);
  if (c._count?.contacts !== undefined) {
    lines.push(`Linked contacts: ${c._count.contacts}`);
  }
  if (c.description) lines.push("", c.description);
  if (c.contentText) lines.push("", c.contentText);
  return lines.join("\n");
}

export class CompanyProvider implements DataProvider {
  domain = "operations";
  types = ["company"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const companies = await prisma.company.findMany({
      include: { _count: { select: { contacts: true } } },
      orderBy: { name: "asc" },
      take: 200,
    });

    return companies.map((c) => {
      const seg = c.industry || c.size || null;
      const contactInfo =
        c._count.contacts > 0 ? `${c._count.contacts} contacts` : null;
      const extra = [seg, c.domain, contactInfo].filter(Boolean).join(", ");
      return {
        id: `company:${c.id}`,
        type: "company",
        domain: this.domain,
        name: c.name,
        description: c.description || c.contentText.slice(0, 160) || null,
        contentLength: (c.contentText.length || 0) + 200,
        extra: extra || undefined,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.company) return [];

    const companies = await prisma.company.findMany({
      where: { id: { in: grouped.company } },
      include: { _count: { select: { contacts: true } } },
    });

    return companies.map((c) => ({
      id: `company:${c.id}`,
      type: "company",
      name: c.name,
      content: truncate(renderCompanyContent(c)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("company")) return [];

    const companies = await prisma.company.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { legalName: { contains: keyword, mode: "insensitive" } },
          { domain: { contains: keyword, mode: "insensitive" } },
          { website: { contains: keyword, mode: "insensitive" } },
          { industry: { contains: keyword, mode: "insensitive" } },
          { email: { contains: keyword, mode: "insensitive" } },
          { contentText: { contains: keyword, mode: "insensitive" } },
          { tags: { has: keyword } },
        ],
      },
      include: { _count: { select: { contacts: true } } },
      take,
    });

    return companies.map((c) => ({
      id: `company:${c.id}`,
      type: "company",
      name: c.name,
      content: truncate(renderCompanyContent(c)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const companies = await prisma.company.findMany({
      where: { id: { in: ids } },
      include: { _count: { select: { contacts: true } } },
    });

    return companies.map((c) => ({
      id: `company:${c.id}`,
      type: "company",
      name: c.name,
      description: c.description || null,
      imageUrl: c.logoUrl,
      category: c.industry,
      meta: {
        legalName: c.legalName,
        taxId: c.taxId,
        website: c.website,
        domain: c.domain,
        industry: c.industry,
        size: c.size,
        email: c.email,
        phone: c.phone,
        linkedinUrl: c.linkedinUrl,
        twitterHandle: c.twitterHandle,
        contactCount: c._count.contacts,
        tags: c.tags,
      },
    }));
  }
}
