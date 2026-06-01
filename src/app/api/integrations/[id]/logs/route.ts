import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { requireSuperAdmin } from "@/lib/auth/require-super-admin";
import { withTenant } from "@/lib/tenancy/context";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionOrResponse = await requireSuperAdmin();
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  return withTenant(session.user.activeOrgId ?? "", async () => {
    try {
      const { id } = await params;
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "50");
      const skip = (page - 1) * limit;

      // Sequential (not Promise.all): both queries are tenant-scoped, so the
      // Extension wraps each in its own $transaction — running them concurrently
      // collides on the pg connection (DeprecationWarning, pg@9).
      const logs = await prisma.integrationSyncLog.findMany({
        where: { integrationId: id },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      });
      const total = await prisma.integrationSyncLog.count({
        where: { integrationId: id },
      });

      return apiSuccess({ logs, total, page, limit });
    } catch (e) {
      console.error("GET /api/integrations/[id]/logs error:", e);
      return apiError("Failed to fetch logs", 500);
    }
  });
}
