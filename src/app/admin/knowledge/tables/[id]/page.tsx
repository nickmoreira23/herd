import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TableView } from "@/components/tables/table-view";
import { connection } from "next/server";

export default async function KnowledgeTableDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;

  const table = await prisma.knowledgeTable.findUnique({
    where: { id },
    include: { fields: { orderBy: { sortOrder: "asc" } } },
  });

  if (!table) notFound();

  const records = await prisma.knowledgeTableRecord.findMany({
    where: { tableId: id },
    orderBy: { sortOrder: "asc" },
    take: 100,
  });

  const totalRecords = await prisma.knowledgeTableRecord.count({
    where: { tableId: id },
  });

  const serializedTable = {
    ...table,
    createdAt: table.createdAt.toISOString(),
    processedAt: table.processedAt?.toISOString() ?? null,
    sourceImportedAt: table.sourceImportedAt?.toISOString() ?? null,
    updatedAt: undefined,
  };

  const serializedFields = table.fields.map((f) => ({
    ...f,
    options: f.options as Record<string, unknown> | null,
    createdAt: f.createdAt.toISOString(),
    updatedAt: undefined,
  }));

  const serializedRecords = records.map((r) => ({
    ...r,
    data: r.data as Record<string, unknown>,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <TableView
      table={serializedTable}
      initialFields={serializedFields}
      initialRecords={serializedRecords}
      totalRecords={totalRecords}
    />
  );
}
