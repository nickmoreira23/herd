import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const tables = await prisma.knowledgeTable.findMany({
      where: { sourceType: "airtable" },
      select: {
        id: true,
        name: true,
        sourceId: true,
        status: true,
        recordCount: true,
      },
    });
    return apiSuccess(tables);
  } catch (e) {
    console.error("GET /api/integrations/airtable/imported error:", e);
    return apiError("Failed to fetch imported tables", 500);
  }
}
