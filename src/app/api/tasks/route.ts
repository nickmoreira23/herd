import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const source = searchParams.get("source");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") ?? "50", 10);
    const offset = parseInt(searchParams.get("offset") ?? "0", 10);

    const where: Prisma.TaskWhereInput = {};

    if (status) {
      where.status = status as Prisma.TaskWhereInput["status"];
    }
    if (priority) {
      where.priority = priority as Prisma.TaskWhereInput["priority"];
    }
    if (source) {
      where.sourceIntegration = source;
    }
    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { projectName: { contains: search, mode: "insensitive" } },
      ];
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.task.count({ where }),
    ]);

    return apiSuccess({ tasks, total });
  } catch (e) {
    console.error("GET /api/tasks error:", e);
    return apiError("Failed to fetch tasks", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title || typeof body.title !== "string" || body.title.trim() === "") {
      return apiError("Title is required", 400);
    }

    const task = await prisma.task.create({
      data: {
        title: body.title.trim(),
        description: body.description ?? null,
        status: body.status ?? "TODO",
        priority: body.priority ?? "NONE",
        dueDate: body.dueDate ? new Date(body.dueDate) : null,
        assignee: body.assignee ?? null,
        assigneeEmail: body.assigneeEmail ?? null,
        projectName: body.projectName ?? null,
        labels: body.labels ?? [],
        sourceIntegration: null,
      },
    });

    return apiSuccess(task, 201);
  } catch (e) {
    console.error("POST /api/tasks error:", e);
    return apiError("Failed to create task", 500);
  }
}
