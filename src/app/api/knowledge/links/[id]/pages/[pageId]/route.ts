import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; pageId: string }> }
) {
  const { id, pageId } = await params;

  const page = await prisma.knowledgeLinkPage.findFirst({
    where: { id: pageId, linkId: id },
  });

  if (!page) return apiError("Not found", 404);

  return apiSuccess(page);
}
