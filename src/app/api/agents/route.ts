import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createAgentSchema } from "@/lib/validators/agent";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search") || undefined;
    const category = searchParams.get("category") || undefined;
    const status = searchParams.get("status") || undefined;
    const sort = searchParams.get("sort") || "sortOrder";
    const order = searchParams.get("order") === "desc" ? "desc" : "asc";

    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { key: { contains: search, mode: "insensitive" as const } },
          { description: { contains: search, mode: "insensitive" as const } },
        ],
      }),
      ...(category && { category: category as never }),
      ...(status && { status: status as never }),
    };

    const agents = await prisma.agent.findMany({
      where,
      orderBy: { [sort]: order },
      include: {
        _count: { select: { tierAccess: true } },
      },
    });

    return apiSuccess(agents);
  } catch (e) {
    console.error("GET /api/agents error:", e);
    return apiError("Failed to fetch agents", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const result = await parseAndValidate(request, createAgentSchema);
    if ("error" in result) return result.error;

    const existing = await prisma.agent.findUnique({
      where: { key: result.data.key },
    });
    if (existing) {
      return apiError("An agent with this key already exists", 409);
    }

    const agent = await prisma.agent.create({
      data: {
        ...result.data,
        tags: result.data.tags || [],
      },
    });

    return apiSuccess(agent, 201);
  } catch (e) {
    console.error("POST /api/agents error:", e);
    return apiError("Failed to create agent", 500);
  }
}
