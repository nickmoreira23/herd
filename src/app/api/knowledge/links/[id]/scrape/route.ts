import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { scrapeUrl } from "@/lib/knowledge/scraper";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const link = await prisma.knowledgeLink.findUnique({ where: { id } });
  if (!link) return apiError("Not found", 404);

  // Set PROCESSING
  await prisma.knowledgeLink.update({
    where: { id },
    data: { status: "PROCESSING", errorMessage: null },
  });

  try {
    const result = await scrapeUrl(link.url);

    const updated = await prisma.knowledgeLink.update({
      where: { id },
      data: {
        // Only overwrite name if user didn't provide a custom one (still equals domain)
        name: link.name === link.domain ? result.title : link.name,
        description: link.description || result.description,
        faviconUrl: result.faviconUrl,
        ogImageUrl: result.ogImageUrl,
        textContent: result.markdown,
        contentLength: result.contentLength,
        lastScrapedAt: new Date(),
        status: "READY",
        errorMessage: null,
      },
    });

    return apiSuccess(updated);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown scraping error";

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
