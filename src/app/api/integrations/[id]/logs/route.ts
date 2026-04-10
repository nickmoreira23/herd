import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.integrationSyncLog.findMany({
        where: { integrationId: id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.integrationSyncLog.count({
        where: { integrationId: id },
      }),
    ]);

    return apiSuccess({ logs, total, page, limit });
  } catch (e) {
    console.error("GET /api/integrations/[id]/logs error:", e);
    return apiError("Failed to fetch logs", 500);
  }
}
