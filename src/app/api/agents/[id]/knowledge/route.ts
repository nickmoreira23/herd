import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeItemSchema } from "@/lib/validators/agent";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const items = await prisma.agentKnowledgeItem.findMany({
      where: { agentId: id },
      orderBy: { sortOrder: "asc" },
    });
    return apiSuccess(items);
  } catch (e) {
    console.error("GET /api/agents/[id]/knowledge error:", e);
    return apiError("Failed to fetch knowledge items", 500);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, createKnowledgeItemSchema);
    if ("error" in result) return result.error;

    const item = await prisma.agentKnowledgeItem.create({
      data: { ...result.data, agentId: id },
    });
    return apiSuccess(item, 201);
  } catch (e) {
    console.error("POST /api/agents/[id]/knowledge error:", e);
    return apiError("Failed to create knowledge item", 500);
  }
}
