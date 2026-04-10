import { prisma } from "@/lib/prisma";
import { PagesListClient } from "@/components/landing-page/pages-list/pages-list-client";
import type { LandingPageData } from "@/types/landing-page";
import type { PageStyles } from "@/types/landing-page";
import { connection } from "next/server";

export default async function BlocksPage() {
  await connection();
  const pages = await prisma.landingPage.findMany({
    orderBy: { updatedAt: "desc" },
  });

  const serialized: LandingPageData[] = pages.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    lastPublishedAt: p.lastPublishedAt?.toISOString() ?? null,
    pageStyles: p.pageStyles as unknown as PageStyles,
    status: p.status as LandingPageData["status"],
  }));

  return <PagesListClient initialPages={serialized} />;
}
