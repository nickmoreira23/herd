import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const feed = await prisma.knowledgeRSSFeed.findUnique({ where: { id } });
  if (!feed) return apiError("Not found", 404);

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const offset = (page - 1) * limit;

  const [entries, total] = await Promise.all([
    prisma.knowledgeRSSEntry.findMany({
      where: { feedId: id },
      orderBy: { publishedAt: "desc" },
      skip: offset,
      take: limit,
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
    }),
    prisma.knowledgeRSSEntry.count({ where: { feedId: id } }),
  ]);

  return apiSuccess({ entries, total, page, limit });
}
