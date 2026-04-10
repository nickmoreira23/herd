import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderProductContent(p: any): string {
  const lines: string[] = [];

  lines.push(`# Product: ${p.name} (SKU: ${p.sku})`);
  lines.push(
    `Category: ${p.category}${p.subCategory ? ` > ${p.subCategory}` : ""}`
  );
  if (p.brand) lines.push(`Brand: ${p.brand}`);
  lines.push(`Redemption: ${p.redemptionType}`);
  lines.push(
    `Retail Price: $${p.retailPrice} | Member Price: $${p.memberPrice} | Cost: $${p.costOfGoods}`
  );
  if (p.weightOz) lines.push(`Weight: ${p.weightOz} oz`);
  lines.push(`Active: ${p.isActive ? "Yes" : "No"}`);

  if (p.description) {
    lines.push("", "## Description", p.description);
  }

  if (p.ingredients) {
    lines.push("", "## Ingredients", p.ingredients);
  }

  if (p.supplementFacts) {
    lines.push("", "## Supplement Facts");
    if (p.servingSize) lines.push(`Serving Size: ${p.servingSize}`);
    if (p.servingsPerContainer)
      lines.push(`Servings Per Container: ${p.servingsPerContainer}`);
    try {
      const facts = Array.isArray(p.supplementFacts)
        ? p.supplementFacts
        : JSON.parse(p.supplementFacts);
      for (const f of facts) {
        lines.push(
          `- ${f.name}: ${f.amount}${f.unit || ""} ${f.dailyValue ? `(${f.dailyValue}% DV)` : ""}`
        );
      }
    } catch {
      lines.push(JSON.stringify(p.supplementFacts));
    }
  }

  if (p.variants) {
    lines.push("", "## Variants");
    try {
      const variants = Array.isArray(p.variants)
        ? p.variants
        : JSON.parse(p.variants);
      for (const v of variants) {
        lines.push(
          `- ${v.name}: ${Array.isArray(v.options) ? v.options.join(", ") : v.options}`
        );
      }
    } catch {
      lines.push(JSON.stringify(p.variants));
    }
  }

  if (p.warnings) {
    lines.push("", "## Warnings", p.warnings);
  }

  if (p.tags && p.tags.length > 0) {
    lines.push("", `Tags: ${p.tags.join(", ")}`);
  }

  if (p.images && p.images.length > 0) {
    lines.push("", `Images: ${p.images.length} product images`);
  }

  return lines.join("\n");
}

export class ProductProvider implements DataProvider {
  domain = "foundation";
  types = ["product"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        description: true,
        sku: true,
        category: true,
        brand: true,
        memberPrice: true,
      },
      orderBy: { name: "asc" },
    });

    return products.map((p) => ({
      id: `product:${p.id}`,
      type: "product",
      domain: this.domain,
      name: p.name,
      description: p.description,
      contentLength: (p.description?.length || 0) + 500,
      extra: `sku: ${p.sku}, category: ${p.category}${p.brand ? `, brand: ${p.brand}` : ""}, $${p.memberPrice} member`,
    }));
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.product) return [];

    const products = await prisma.product.findMany({
      where: { id: { in: grouped.product } },
      include: { images: { select: { url: true, alt: true, isPrimary: true } } },
    });

    return products.map((p) => ({
      id: `product:${p.id}`,
      type: "product",
      name: p.name,
      content: truncate(renderProductContent(p)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("product")) return [];

    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { brand: { contains: keyword, mode: "insensitive" } },
          { sku: { contains: keyword, mode: "insensitive" } },
          { ingredients: { contains: keyword, mode: "insensitive" } },
          { category: { contains: keyword, mode: "insensitive" } },
        ],
      },
      include: { images: { select: { url: true, alt: true, isPrimary: true } } },
      take,
    });

    return products.map((p) => ({
      id: `product:${p.id}`,
      type: "product",
      name: p.name,
      content: truncate(renderProductContent(p)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const products = await prisma.product.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        name: true,
        description: true,
        imageUrl: true,
        category: true,
        subCategory: true,
        brand: true,
        sku: true,
        retailPrice: true,
        memberPrice: true,
        isActive: true,
      },
    });

    return products.map((p) => ({
      id: `product:${p.id}`,
      type: "product",
      name: p.name,
      description: p.description,
      imageUrl: p.imageUrl,
      status: p.isActive ? "Active" : "Inactive",
      category: p.category,
      meta: {
        brand: p.brand,
        retailPrice: Number(p.retailPrice),
        memberPrice: Number(p.memberPrice),
        sku: p.sku,
        subCategory: p.subCategory,
      },
    }));
  }
}
