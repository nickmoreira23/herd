import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function displayName(c: any): string {
  return `${c.firstName}${c.lastName ? " " + c.lastName : ""}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatAddress(c: any): string {
  const parts = [c.street, c.street2, c.city, c.state, c.zip].filter(Boolean);
  if (c.country) parts.push(c.country);
  return parts.join(", ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderContactContent(c: any): string {
  const lines: string[] = [];
  lines.push(`# ${displayName(c)}`);
  if (c.jobTitle || c.department) {
    lines.push(
      `Role: ${c.jobTitle || ""}${c.department ? ` (${c.department})` : ""}`
    );
  }
  if (c.email) lines.push(`Email: ${c.email}`);
  if (c.phone) lines.push(`Phone: ${c.phone}`);
  if (c.source) lines.push(`Source: ${c.source}`);
  const address = formatAddress(c);
  if (address) lines.push(`Address: ${address}`);
  if (c.linkedinUrl) lines.push(`LinkedIn: ${c.linkedinUrl}`);
  if (c.twitterHandle) lines.push(`Twitter: ${c.twitterHandle}`);
  if (c.tags?.length) lines.push(`Tags: ${c.tags.join(", ")}`);
  if (c.contentText) lines.push("", c.contentText);
  return lines.join("\n");
}

export class ContactProvider implements DataProvider {
  domain = "operations";
  types = ["contact"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const contacts = await prisma.contact.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        jobTitle: true,
        department: true,
        source: true,
        contentText: true,
        tags: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    return contacts.map((c) => {
      const role = c.jobTitle
        ? `${c.jobTitle}${c.department ? ` @ ${c.department}` : ""}`
        : null;
      const contact = c.email || c.phone || null;
      const extras = [role, contact, c.source].filter(Boolean).join(", ");
      return {
        id: `contact:${c.id}`,
        type: "contact",
        domain: this.domain,
        name: displayName(c),
        description: c.contentText.slice(0, 200) || null,
        contentLength: c.contentText.length + 200,
        extra: extras || undefined,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.contact) return [];

    const contacts = await prisma.contact.findMany({
      where: { id: { in: grouped.contact } },
    });

    return contacts.map((c) => ({
      id: `contact:${c.id}`,
      type: "contact",
      name: displayName(c),
      content: truncate(renderContactContent(c)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("contact")) return [];

    const contacts = await prisma.contact.findMany({
      where: {
        OR: [
          { firstName: { contains: keyword, mode: "insensitive" } },
          { lastName: { contains: keyword, mode: "insensitive" } },
          { email: { contains: keyword, mode: "insensitive" } },
          { phone: { contains: keyword, mode: "insensitive" } },
          { jobTitle: { contains: keyword, mode: "insensitive" } },
          { department: { contains: keyword, mode: "insensitive" } },
          { contentText: { contains: keyword, mode: "insensitive" } },
          { tags: { has: keyword } },
        ],
      },
      take,
    });

    return contacts.map((c) => ({
      id: `contact:${c.id}`,
      type: "contact",
      name: displayName(c),
      content: truncate(renderContactContent(c)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const contacts = await prisma.contact.findMany({
      where: { id: { in: ids } },
    });

    return contacts.map((c) => ({
      id: `contact:${c.id}`,
      type: "contact",
      name: displayName(c),
      description: c.jobTitle,
      imageUrl: c.avatarUrl,
      category: c.source,
      meta: {
        email: c.email,
        phone: c.phone,
        jobTitle: c.jobTitle,
        department: c.department,
        companyId: c.companyId,
        ownerId: c.ownerId,
        tags: c.tags,
        linkedinUrl: c.linkedinUrl,
        twitterHandle: c.twitterHandle,
      },
    }));
  }
}
