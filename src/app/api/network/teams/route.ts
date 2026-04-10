import { prisma } from "@/lib/prisma"
import { apiSuccess, apiError } from "@/lib/api-utils"

export async function GET() {
  try {
    const teams = await prisma.networkTeam.findMany({
      include: {
        teamLead: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { members: true } },
      },
      orderBy: { name: "asc" },
    })
    return apiSuccess(teams)
  } catch (error) {
    console.error("GET /api/network/teams", error)
    return apiError("Failed to fetch teams", 500)
  }
}
