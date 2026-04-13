import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const feed = await prisma.knowledgeRSSFeed.findUnique({ where: { id } });
  if (!feed) return apiError("Not found", 404);

  const logs = await prisma.knowledgeRSSSyncLog.findMany({
    where: { feedId: id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return apiSuccess(logs);
}
