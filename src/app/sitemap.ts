import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const SITE_URL = process.env.SITE_URL || process.env.NEXTAUTH_URL || "https://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages = await prisma.landingPage.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, updatedAt: true },
  });

  return pages.map((page) => ({
    url: `${SITE_URL}/p/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
}
