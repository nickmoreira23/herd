import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const link = await prisma.knowledgeLink.findUnique({ where: { id } });
  if (!link) return apiError("Not found", 404);

  // Get recent pages (last 5 scraped)
  const recentPages = await prisma.knowledgeLinkPage.findMany({
    where: { linkId: id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      url: true,
      path: true,
      title: true,
      status: true,
      contentLength: true,
    },
  });

  return apiSuccess({
    status: link.status,
    pagesDiscovered: link.pagesDiscovered,
    pagesScraped: link.pagesScraped,
    pagesErrored: link.pagesErrored,
    recentPages,
  });
}
