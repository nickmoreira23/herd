import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeLinkSchema } from "@/lib/validators/knowledge-link";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const link = await prisma.knowledgeLink.findUnique({ where: { id } });
  if (!link) return apiError("Not found", 404);

  // Include pages list (without textContent) for full-site links
  if (link.scrapeMode === "FULL_SITE") {
    const pages = await prisma.knowledgeLinkPage.findMany({
      where: { linkId: id },
      orderBy: { path: "asc" },
      select: {
        id: true,
        url: true,
        path: true,
        title: true,
        status: true,
        contentLength: true,
        depth: true,
        scrapedAt: true,
      },
    });
    return apiSuccess({ ...link, pages });
  }

  return apiSuccess(link);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateKnowledgeLinkSchema);
  if ("error" in result) return result.error;

  const link = await prisma.knowledgeLink.update({
    where: { id },
    data: result.data,
  });
  return apiSuccess(link);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const link = await prisma.knowledgeLink.findUnique({ where: { id } });
  if (!link) return apiError("Not found", 404);

  await prisma.knowledgeLink.delete({ where: { id } });

  return apiSuccess({ deleted: true });
}
