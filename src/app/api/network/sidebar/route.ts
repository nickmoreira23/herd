import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const [departments, channels] = await Promise.all([
      prisma.department.findMany({
        where: { networkType: "INTERNAL" },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: { id: true, slug: true, name: true, color: true, icon: true },
      }),
      prisma.networkProfileType.findMany({
        where: { networkType: "EXTERNAL", isActive: true },
        orderBy: [{ sortOrder: "asc" }, { displayName: "asc" }],
        select: { id: true, slug: true, displayName: true, color: true, icon: true },
      }),
    ]);

    return apiSuccess({ departments, channels });
  } catch (error) {
    console.error("GET /api/network/sidebar", error);
    return apiError("Failed to load network sidebar", 500);
  }
}
