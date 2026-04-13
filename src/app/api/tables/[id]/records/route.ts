import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import {
  createKnowledgeTableRecordSchema,
  batchCreateRecordsSchema,
} from "@/lib/validators/tables";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tableId } = await params;
  const url = new URL(request.url);

  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "50")));
  const search = url.searchParams.get("search") || "";
  const sortField = url.searchParams.get("sort") || "";
  const sortDir = url.searchParams.get("dir") === "desc" ? "desc" : "asc";

  const skip = (page - 1) * limit;

  // Build where clause
  const where: Prisma.KnowledgeTableRecordWhereInput = { tableId };

  // For search, we use raw SQL since Prisma doesn't support JSON text search well
  let records;
  let total;

  if (search) {
    // Search across all text values in JSON data
    const searchPattern = `%${search}%`;
    const countResult = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
      `SELECT COUNT(*) as count FROM "KnowledgeTableRecord" WHERE "tableId" = $1::uuid AND data::text ILIKE $2`,
      tableId,
      searchPattern
    );
    total = Number(countResult[0]?.count ?? 0);

    records = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT * FROM "KnowledgeTableRecord" WHERE "tableId" = $1::uuid AND data::text ILIKE $2 ORDER BY "sortOrder" ASC, "createdAt" ASC LIMIT $3 OFFSET $4`,
      tableId,
      searchPattern,
      limit,
      skip
    );
  } else {
    total = await prisma.knowledgeTableRecord.count({ where });

    records = await prisma.knowledgeTableRecord.findMany({
      where,
      orderBy: sortField
        ? [{ sortOrder: "asc" }, { createdAt: "asc" }]
        : [{ sortOrder: "asc" }, { createdAt: "asc" }],
      take: limit,
      skip,
    });
  }

  return apiSuccess({
    records,
    total,
    page,
    limit,
    hasMore: skip + records.length < total,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tableId } = await params;

  const table = await prisma.knowledgeTable.findUnique({ where: { id: tableId } });
  if (!table) return apiError("Table not found", 404);

  const body = await request.json();

  try {
    // Check if batch create
    if (body.records && Array.isArray(body.records)) {
      const parsed = batchCreateRecordsSchema.safeParse(body);
      if (!parsed.success) {
        return apiError("Validation failed", 400, parsed.error.issues);
      }

      const maxSort = await prisma.knowledgeTableRecord.findFirst({
        where: { tableId },
        orderBy: { sortOrder: "desc" },
        select: { sortOrder: true },
      });
      let nextSort = (maxSort?.sortOrder ?? -1) + 1;

      const created = await prisma.knowledgeTableRecord.createMany({
        data: parsed.data.records.map((r) => ({
          tableId,
          data: r.data as Prisma.InputJsonValue,
          sortOrder: nextSort++,
        })),
      });

      await prisma.knowledgeTable.update({
        where: { id: tableId },
        data: {
          recordCount: { increment: created.count },
          status: "PENDING",
        },
      });

      return apiSuccess({ created: created.count }, 201);
    }

    // Single record create
    const parsed = createKnowledgeTableRecordSchema.safeParse(body);
    if (!parsed.success) {
      return apiError("Validation failed", 400, parsed.error.issues);
    }

    const maxSort = await prisma.knowledgeTableRecord.findFirst({
      where: { tableId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });

    const record = await prisma.knowledgeTableRecord.create({
      data: {
        tableId,
        data: parsed.data.data as Prisma.InputJsonValue,
        sortOrder: (maxSort?.sortOrder ?? -1) + 1,
      },
    });

    await prisma.knowledgeTable.update({
      where: { id: tableId },
      data: {
        recordCount: { increment: 1 },
        status: "PENDING",
      },
    });

    return apiSuccess(record, 201);
  } catch (e) {
    console.error("Record creation error:", e);
    return apiError("Failed to create record", 500);
  }
}
