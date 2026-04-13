import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeRSSFeedSchema } from "@/lib/validators/feeds";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const feed = await prisma.knowledgeRSSFeed.findUnique({
    where: { id },
    include: {
      entries: {
        orderBy: { publishedAt: "desc" },
        select: {
          id: true,
          guid: true,
          title: true,
          author: true,
          summary: true,
          sourceUrl: true,
          publishedAt: true,
          categories: true,
          imageUrl: true,
          status: true,
          contentLength: true,
          scrapedAt: true,
          createdAt: true,
        },
      },
    },
  });
  if (!feed) return apiError("Not found", 404);
  return apiSuccess(feed);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateKnowledgeRSSFeedSchema);
  if ("error" in result) return result.error;

  const feed = await prisma.knowledgeRSSFeed.update({
    where: { id },
    data: result.data,
  });
  return apiSuccess(feed);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const feed = await prisma.knowledgeRSSFeed.findUnique({ where: { id } });
  if (!feed) return apiError("Not found", 404);

  await prisma.knowledgeRSSFeed.delete({ where: { id } });
  return apiSuccess({ deleted: true });
}
