import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id, entryId } = await params;

  const entry = await prisma.knowledgeRSSEntry.findFirst({
    where: { id: entryId, feedId: id },
  });
  if (!entry) return apiError("Not found", 404);

  return apiSuccess(entry);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const { id, entryId } = await params;

  const entry = await prisma.knowledgeRSSEntry.findFirst({
    where: { id: entryId, feedId: id },
  });
  if (!entry) return apiError("Not found", 404);

  await prisma.knowledgeRSSEntry.delete({ where: { id: entryId } });

  // Update feed entry count
  const count = await prisma.knowledgeRSSEntry.count({ where: { feedId: id } });
  await prisma.knowledgeRSSFeed.update({
    where: { id },
    data: { entryCount: count },
  });

  return apiSuccess({ deleted: true });
}
