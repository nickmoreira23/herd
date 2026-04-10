import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createKnowledgeTableFieldSchema } from "@/lib/validators/knowledge-table";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fields = await prisma.knowledgeTableField.findMany({
    where: { tableId: id },
    orderBy: { sortOrder: "asc" },
  });
  return apiSuccess(fields);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tableId } = await params;
  const result = await parseAndValidate(request, createKnowledgeTableFieldSchema);
  if ("error" in result) return result.error;

  const table = await prisma.knowledgeTable.findUnique({ where: { id: tableId } });
  if (!table) return apiError("Table not found", 404);

  try {
    return await createField(tableId, table, result.data);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return apiError("A field with this name already exists in this table", 409);
    }
    console.error("Field creation error:", e);
    return apiError("Failed to create field", 500);
  }
}

async function createField(
  tableId: string,
  table: { id: string; name: string },
  input: {
    name: string;
    type: string;
    description?: string;
    options?: Record<string, unknown>;
    isPrimary?: boolean;
    isRequired?: boolean;
  }
) {

  const { name, type, description, options, isPrimary, isRequired } = input;

  // Auto-assign sortOrder
  const maxField = await prisma.knowledgeTableField.findFirst({
    where: { tableId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (maxField?.sortOrder ?? -1) + 1;

  // Handle linkedRecord: create inverse field on the linked table
  const finalOptions = (options ?? undefined) as Prisma.InputJsonValue | undefined;

  if (type === "linkedRecord") {
    const linkedTableId = options?.linkedTableId as string | undefined;
    if (!linkedTableId) {
      return apiError("linkedRecord fields require options.linkedTableId", 400);
    }

    const linkedTable = await prisma.knowledgeTable.findUnique({
      where: { id: linkedTableId },
    });
    if (!linkedTable) {
      return apiError("Linked table not found", 404);
    }

    // Create the field first
    const field = await prisma.knowledgeTableField.create({
      data: {
        tableId,
        name,
        type,
        description: description || null,
        options: { linkedTableId },
        isPrimary: isPrimary ?? false,
        isRequired: isRequired ?? false,
        sortOrder,
      },
    });

    // Create inverse field on the linked table
    const inverseMaxField = await prisma.knowledgeTableField.findFirst({
      where: { tableId: linkedTableId },
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    const inverseSortOrder = (inverseMaxField?.sortOrder ?? -1) + 1;

    const inverseField = await prisma.knowledgeTableField.create({
      data: {
        tableId: linkedTableId,
        name: table.name,
        type: "linkedRecord",
        description: `Linked from ${table.name}`,
        options: {
          linkedTableId: tableId,
          inverseLinkFieldId: field.id,
        },
        sortOrder: inverseSortOrder,
      },
    });

    // Update original field with inverse link reference
    const updatedField = await prisma.knowledgeTableField.update({
      where: { id: field.id },
      data: {
        options: {
          linkedTableId,
          inverseLinkFieldId: inverseField.id,
        },
      },
    });

    // Increment field counts
    await prisma.knowledgeTable.update({
      where: { id: tableId },
      data: { fieldCount: { increment: 1 } },
    });
    await prisma.knowledgeTable.update({
      where: { id: linkedTableId },
      data: { fieldCount: { increment: 1 } },
    });

    return apiSuccess(updatedField, 201);
  }

  // Non-linkedRecord field creation
  const field = await prisma.knowledgeTableField.create({
    data: {
      tableId,
      name,
      type,
      description: description || null,
      options: finalOptions,
      isPrimary: isPrimary ?? false,
      isRequired: isRequired ?? false,
      sortOrder,
    },
  });

  await prisma.knowledgeTable.update({
    where: { id: tableId },
    data: { fieldCount: { increment: 1 } },
  });

  return apiSuccess(field, 201);
}
