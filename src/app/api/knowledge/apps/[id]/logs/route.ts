import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const app = await prisma.knowledgeApp.findUnique({ where: { id } });
  if (!app) return apiError("Not found", 404);

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get("limit") || "50", 10);
  const page = parseInt(url.searchParams.get("page") || "1", 10);

  const [logs, total] = await Promise.all([
    prisma.knowledgeAppSyncLog.findMany({
      where: { appId: id },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.knowledgeAppSyncLog.count({ where: { appId: id } }),
  ]);

  const serialized = logs.map((l) => ({
    ...l,
    createdAt: l.createdAt.toISOString(),
    syncedFrom: l.syncedFrom?.toISOString() ?? null,
    syncedTo: l.syncedTo?.toISOString() ?? null,
  }));

  return apiSuccess({ logs: serialized, total, page, limit });
}
