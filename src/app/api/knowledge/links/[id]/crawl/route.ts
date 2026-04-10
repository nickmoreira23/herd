import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { crawlSite } from "@/lib/knowledge/crawler";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const link = await prisma.knowledgeLink.findUnique({ where: { id } });
  if (!link) return apiError("Not found", 404);

  // Set PROCESSING, reset counters
  await prisma.knowledgeLink.update({
    where: { id },
    data: {
      status: "PROCESSING",
      errorMessage: null,
      pagesDiscovered: 0,
      pagesScraped: 0,
      pagesErrored: 0,
    },
  });

  // Delete existing pages for clean re-crawl
  await prisma.knowledgeLinkPage.deleteMany({ where: { linkId: id } });

  try {
    await crawlSite(id, link.url, {
      maxPages: link.maxPages,
    });

    const updated = await prisma.knowledgeLink.findUnique({ where: { id } });
    return apiSuccess(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Crawl failed";

    const updated = await prisma.knowledgeLink.update({
      where: { id },
      data: {
        status: "ERROR",
        errorMessage: message,
      },
    });

    return apiSuccess(updated);
  }
}
