import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const plans = await prisma.networkCompensationPlan.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
    return apiSuccess(plans);
  } catch (error) {
    console.error("GET /api/network/compensation-plans", error);
    return apiError("Failed to fetch compensation plans", 500);
  }
}
