import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updateKnowledgeAppSchema } from "@/lib/validators/apps";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const app = await prisma.knowledgeApp.findUnique({
    where: { id },
    include: {
      _count: { select: { dataPoints: true } },
    },
  });
  if (!app) return apiError("Not found", 404);
  return apiSuccess({
    ...app,
    connectedAt: app.connectedAt?.toISOString() ?? null,
    lastSyncAt: app.lastSyncAt?.toISOString() ?? null,
    syncStartDate: app.syncStartDate?.toISOString() ?? null,
    createdAt: app.createdAt.toISOString(),
    updatedAt: undefined,
    dataPointCount: app._count.dataPoints,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await parseAndValidate(request, updateKnowledgeAppSchema);
  if ("error" in result) return result.error;

  const app = await prisma.knowledgeApp.update({
    where: { id },
    data: result.data,
  });
  return apiSuccess(app);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const app = await prisma.knowledgeApp.findUnique({ where: { id } });
  if (!app) return apiError("Not found", 404);

  await prisma.knowledgeApp.delete({ where: { id } });

  return apiSuccess({ deleted: true });
}
