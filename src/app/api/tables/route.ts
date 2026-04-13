import { prisma } from "@/lib/prisma";
import { apiSuccess, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeTableSchema } from "@/lib/validators/tables";

export async function GET() {
  const tables = await prisma.knowledgeTable.findMany({
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: tables.length,
    pending: tables.filter((t) => t.status === "PENDING").length,
    processing: tables.filter((t) => t.status === "PROCESSING").length,
    ready: tables.filter((t) => t.status === "READY").length,
    error: tables.filter((t) => t.status === "ERROR").length,
    totalRecords: tables.reduce((sum, t) => sum + t.recordCount, 0),
  };

  return apiSuccess({ tables, stats });
}

export async function POST(request: Request) {
  const result = await parseAndValidate(request, createKnowledgeTableSchema);
  if ("error" in result) return result.error;

  const { name, description } = result.data;

  const table = await prisma.knowledgeTable.create({
    data: {
      name,
      description: description || null,
      fieldCount: 1,
      fields: {
        create: {
          name: "Name",
          type: "singleLineText",
          isPrimary: true,
          isRequired: true,
          sortOrder: 0,
        },
      },
    },
    include: { fields: true },
  });

  return apiSuccess(table, 201);
}
