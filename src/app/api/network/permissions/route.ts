import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const permissions = await prisma.networkPermission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });

    // Group by resource for convenience
    const grouped = permissions.reduce<Record<string, typeof permissions>>(
      (acc, p) => {
        if (!acc[p.resource]) acc[p.resource] = [];
        acc[p.resource].push(p);
        return acc;
      },
      {}
    );

    return apiSuccess({ permissions, grouped });
  } catch (error) {
    console.error("GET /api/network/permissions", error);
    return apiError("Failed to fetch permissions", 500);
  }
}
