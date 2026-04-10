import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cacheLife } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PublishedPageRenderer } from "@/components/landing-page/renderer/published-page-renderer";
import type {
  PageStyles,
  SectionLayout,
  ComponentNode,
} from "@/types/landing-page";
import { DEFAULT_PAGE_STYLES } from "@/lib/landing-page/defaults";

const SITE_URL = process.env.SITE_URL || process.env.NEXTAUTH_URL || "";

// --- Cached data fetching ---

async function getPublishedPage(slug: string) {
  "use cache";
  cacheLife("hours");

  const page = await prisma.landingPage.findUnique({
    where: { slug },
  });

  if (!page || page.status !== "PUBLISHED") return null;

  const sections = await prisma.landingPageSection.findMany({
    where: { pageId: page.id },
    orderBy: { sortOrder: "asc" },
  });

  return { page, sections };
}

async function getPageMetadata(slug: string) {
  "use cache";
  cacheLife("hours");

  return prisma.landingPage.findUnique({
    where: { slug },
    select: {
      name: true,
      seoTitle: true,
      seoDescription: true,
      seoImage: true,
      description: true,
    },
  });
}

// --- Metadata ---

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPageMetadata(slug);

  if (!page) return { title: "Not Found" };

  const title = page.seoTitle || page.name;
  const description = page.seoDescription || page.description || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/p/${slug}`,
      type: "website",
      ...(page.seoImage ? { images: [{ url: page.seoImage }] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(page.seoImage ? { images: [page.seoImage] } : {}),
    },
  };
}

// --- Page ---

export default async function PublishedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getPublishedPage(slug);

  if (!result) notFound();

  const { page, sections } = result;

  const pageStyles = {
    ...DEFAULT_PAGE_STYLES,
    ...(page.pageStyles as unknown as Partial<PageStyles>),
  };

  const sectionData = sections.map((s) => ({
    id: s.id,
    sectionType: s.sectionType,
    name: s.name,
    layout: s.layout as unknown as SectionLayout,
    components: s.components as unknown as ComponentNode[],
    isVisible: s.isVisible,
    sortOrder: s.sortOrder,
  }));

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.seoTitle || page.name,
    description: page.seoDescription || page.description || undefined,
    url: `${SITE_URL}/p/${slug}`,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PublishedPageRenderer pageStyles={pageStyles} sections={sectionData} />
    </>
  );
}
