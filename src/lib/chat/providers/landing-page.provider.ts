import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderPageContent(p: any): string {
  const lines: string[] = [];

  lines.push(`# Page: ${p.name}`);
  lines.push(`Slug: /${p.slug}`);
  lines.push(`Status: ${p.status}`);

  if (p.description) lines.push(`Description: ${p.description}`);
  if (p.seoTitle) lines.push(`SEO Title: ${p.seoTitle}`);
  if (p.seoDescription) lines.push(`SEO Description: ${p.seoDescription}`);
  if (p.seoImage) lines.push(`SEO Image: ${p.seoImage}`);

  lines.push(`Created: ${new Date(p.createdAt).toLocaleDateString()}`);
  lines.push(`Updated: ${new Date(p.updatedAt).toLocaleDateString()}`);

  if (p.lastPublishedAt) {
    lines.push(
      `Last Published: ${new Date(p.lastPublishedAt).toLocaleDateString()}`
    );
  }

  if (p._count?.versions > 0) {
    lines.push(`Versions: ${p._count.versions}`);
  }

  return lines.join("\n");
}

export class LandingPageProvider implements DataProvider {
  domain = "pages";
  types = ["landing-page"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const pages = await prisma.landingPage.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        _count: { select: { versions: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    return pages.map((p) => {
      const extraParts = [
        `/${p.slug}`,
        p.status.toLowerCase(),
        `${p._count.versions} versions`,
      ].filter(Boolean);

      return {
        id: `landing-page:${p.id}`,
        type: "landing-page",
        domain: this.domain,
        name: p.name,
        description: p.description,
        contentLength: (p.description?.length || 0) + 200,
        extra: extraParts.join(", "),
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    const ids = grouped["landing-page"];
    if (!ids) return [];

    const pages = await prisma.landingPage.findMany({
      where: { id: { in: ids } },
      include: {
        _count: { select: { versions: true } },
      },
    });

    return pages.map((p) => ({
      id: `landing-page:${p.id}`,
      type: "landing-page",
      name: p.name,
      content: truncate(renderPageContent(p)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("landing-page")) return [];

    const pages = await prisma.landingPage.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { slug: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { seoTitle: { contains: keyword, mode: "insensitive" } },
          { seoDescription: { contains: keyword, mode: "insensitive" } },
        ],
      },
      include: {
        _count: { select: { versions: true } },
      },
      take,
    });

    return pages.map((p) => ({
      id: `landing-page:${p.id}`,
      type: "landing-page",
      name: p.name,
      content: truncate(renderPageContent(p)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const pages = await prisma.landingPage.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        lastPublishedAt: true,
        _count: { select: { versions: true } },
      },
    });

    return pages.map((p) => ({
      id: `landing-page:${p.id}`,
      type: "landing-page",
      name: p.name,
      description: p.description,
      status: p.status,
      category: null,
      meta: {
        slug: p.slug,
        versionCount: p._count.versions,
        lastPublishedAt: p.lastPublishedAt?.toISOString() || null,
      },
    }));
  }
}
