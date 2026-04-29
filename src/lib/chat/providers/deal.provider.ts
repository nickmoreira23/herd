import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function contactName(c: any): string | null {
  if (!c) return null;
  return [c.firstName, c.lastName].filter(Boolean).join(" ") || null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatAmount(d: any): string | null {
  if (d.amount == null) return null;
  const n =
    typeof d.amount === "object" && d.amount.toNumber
      ? d.amount.toNumber()
      : Number(d.amount);
  return `${d.currency ?? "BRL"} ${n.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderDealContent(d: any): string {
  const lines: string[] = [];
  lines.push(`# ${d.title}`);
  lines.push(`Stage: ${d.stage}`);
  const amount = formatAmount(d);
  if (amount) lines.push(`Amount: ${amount}`);
  if (d.probability != null) lines.push(`Probability: ${d.probability}%`);
  if (d.expectedCloseDate) {
    const ed = d.expectedCloseDate instanceof Date ? d.expectedCloseDate : new Date(d.expectedCloseDate);
    lines.push(`Expected close: ${ed.toISOString().slice(0, 10)}`);
  }
  if (d.closedAt) {
    const cd = d.closedAt instanceof Date ? d.closedAt : new Date(d.closedAt);
    lines.push(`Closed: ${cd.toISOString().slice(0, 10)}`);
  }
  if (d.lostReason) lines.push(`Lost reason: ${d.lostReason}`);
  const cn = contactName(d.contact);
  if (cn) lines.push(`Contact: ${cn}`);
  if (d.company?.name) lines.push(`Company: ${d.company.name}`);
  if (d.source) lines.push(`Source: ${d.source}`);
  if (d.tags?.length) lines.push(`Tags: ${d.tags.join(", ")}`);
  if (d.description) lines.push("", d.description);
  if (d.contentText) lines.push("", d.contentText);
  return lines.join("\n");
}

export class DealProvider implements DataProvider {
  domain = "sales";
  types = ["deal"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const deals = await prisma.deal.findMany({
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    return deals.map((d) => {
      const extras = [
        d.stage,
        formatAmount(d),
        d.company?.name,
        contactName(d.contact),
      ].filter(Boolean);
      return {
        id: `deal:${d.id}`,
        type: "deal",
        domain: this.domain,
        name: d.title,
        description: d.description || d.contentText.slice(0, 160) || null,
        contentLength: (d.contentText.length || 0) + 200,
        extra: extras.length ? extras.join(" · ") : undefined,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.deal) return [];

    const deals = await prisma.deal.findMany({
      where: { id: { in: grouped.deal } },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
      },
    });

    return deals.map((d) => ({
      id: `deal:${d.id}`,
      type: "deal",
      name: d.title,
      content: truncate(renderDealContent(d)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("deal")) return [];

    const deals = await prisma.deal.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { contentText: { contains: keyword, mode: "insensitive" } },
          { source: { contains: keyword, mode: "insensitive" } },
          { tags: { has: keyword } },
          { contact: { firstName: { contains: keyword, mode: "insensitive" } } },
          { contact: { lastName: { contains: keyword, mode: "insensitive" } } },
          { company: { name: { contains: keyword, mode: "insensitive" } } },
        ],
      },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
      },
      take,
    });

    return deals.map((d) => ({
      id: `deal:${d.id}`,
      type: "deal",
      name: d.title,
      content: truncate(renderDealContent(d)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const deals = await prisma.deal.findMany({
      where: { id: { in: ids } },
      include: {
        contact: { select: { id: true, firstName: true, lastName: true } },
        company: { select: { id: true, name: true } },
      },
    });

    return deals.map((d) => ({
      id: `deal:${d.id}`,
      type: "deal",
      name: d.title,
      description: d.description || null,
      imageUrl: null,
      category: d.stage,
      meta: {
        stage: d.stage,
        amount: d.amount?.toString() ?? null,
        currency: d.currency,
        probability: d.probability,
        expectedCloseDate: d.expectedCloseDate?.toISOString() ?? null,
        closedAt: d.closedAt?.toISOString() ?? null,
        contactId: d.contactId,
        contactName: contactName(d.contact),
        companyId: d.companyId,
        companyName: d.company?.name ?? null,
        source: d.source,
        tags: d.tags,
      },
    }));
  }
}
