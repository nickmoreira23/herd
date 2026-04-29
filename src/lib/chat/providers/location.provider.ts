import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatAddress(l: any): string {
  const parts = [l.street, l.street2, l.city, l.state, l.zip].filter(Boolean);
  if (l.country) parts.push(l.country);
  return parts.join(", ");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderLocationContent(l: any): string {
  const lines: string[] = [];

  lines.push(`# ${l.name}`);
  lines.push(`Type: ${l.type}${l.isHeadquarters ? " (headquarters)" : ""}`);

  const address = formatAddress(l);
  if (address) lines.push(`Address: ${address}`);

  if (l.phone) lines.push(`Phone: ${l.phone}`);
  if (l.email) lines.push(`Email: ${l.email}`);
  if (!l.isActive) lines.push(`Status: inactive`);
  if (l.notes) lines.push("", "## Notes", l.notes);

  return lines.join("\n");
}

export class LocationProvider implements DataProvider {
  domain = "operations";
  types = ["location"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const locations = await prisma.location.findMany({
      where: { isActive: true },
      orderBy: [{ isHeadquarters: "desc" }, { name: "asc" }],
    });

    return locations.map((l) => {
      const address = formatAddress(l);
      const hq = l.isHeadquarters ? "headquarters" : null;
      const extra = [l.type, hq, address || null].filter(Boolean).join(", ");

      return {
        id: `location:${l.id}`,
        type: "location",
        domain: this.domain,
        name: l.name,
        description: address || null,
        contentLength: (l.notes?.length || 0) + 200,
        extra: extra || undefined,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.location) return [];

    const locations = await prisma.location.findMany({
      where: { id: { in: grouped.location } },
    });

    return locations.map((l) => ({
      id: `location:${l.id}`,
      type: "location",
      name: l.name,
      content: truncate(renderLocationContent(l)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("location")) return [];

    const locations = await prisma.location.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { city: { contains: keyword, mode: "insensitive" } },
          { state: { contains: keyword, mode: "insensitive" } },
          { country: { contains: keyword, mode: "insensitive" } },
          { street: { contains: keyword, mode: "insensitive" } },
          { notes: { contains: keyword, mode: "insensitive" } },
        ],
      },
      take,
    });

    return locations.map((l) => ({
      id: `location:${l.id}`,
      type: "location",
      name: l.name,
      content: truncate(renderLocationContent(l)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const locations = await prisma.location.findMany({
      where: { id: { in: ids } },
    });

    return locations.map((l) => ({
      id: `location:${l.id}`,
      type: "location",
      name: l.name,
      description: formatAddress(l) || null,
      status: l.isActive ? (l.isHeadquarters ? "headquarters" : "active") : "inactive",
      category: l.type,
      meta: {
        type: l.type,
        isHeadquarters: l.isHeadquarters,
        isActive: l.isActive,
        street: l.street,
        city: l.city,
        state: l.state,
        country: l.country,
        zip: l.zip,
        phone: l.phone,
        email: l.email,
      },
    }));
  }
}
