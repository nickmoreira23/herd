import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createIntegrationSchema } from "@/lib/validators/integration";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const search = searchParams.get("search") || "";

    const where: Record<string, unknown> = {};
    if (category) where.category = category;
    if (status) where.status = status;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const integrations = await prisma.integration.findMany({
      where,
      orderBy: { name: "asc" },
    });
    return apiSuccess(integrations);
  } catch (e) {
    console.error("GET /api/integrations error:", e);
    return apiError("Failed to fetch integrations", 500);
  }
}

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, createIntegrationSchema);
    if ("error" in result) return result.error;

    const integration = await prisma.integration.create({
      data: result.data,
    });
    return apiSuccess(integration, 201);
  } catch (e) {
    console.error("POST /api/integrations error:", e);
    return apiError("Failed to create integration", 500);
  }
}
