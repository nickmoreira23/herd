import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where = {
      routineId: id,
      ...(status ? { status: status as never } : {}),
    };

    const [runs, total] = await Promise.all([
      prisma.routineRun.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.routineRun.count({ where }),
    ]);

    return apiSuccess({ runs, total });
  } catch (e) {
    console.error("GET /api/routines/[id]/runs error:", e);
    return apiError("Failed to fetch runs", 500);
  }
}
