import { prisma } from "@/lib/prisma";
import { TablesListClient } from "@/components/tables/tables-list-client";
import { connection } from "next/server";

export default async function TablesPage() {
  await connection();
  const [tables, airtableIntegration] = await Promise.all([
    prisma.knowledgeTable.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.integration.findUnique({
      where: { slug: "airtable" },
      select: { status: true },
    }),
  ]);

  const airtableConnected = airtableIntegration?.status === "CONNECTED";

  const serialized = tables.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    processedAt: t.processedAt?.toISOString() ?? null,
    sourceImportedAt: t.sourceImportedAt?.toISOString() ?? null,
    updatedAt: undefined,
  }));

  const stats = {
    total: tables.length,
    pending: tables.filter((t) => t.status === "PENDING").length,
    processing: tables.filter((t) => t.status === "PROCESSING").length,
    ready: tables.filter((t) => t.status === "READY").length,
    error: tables.filter((t) => t.status === "ERROR").length,
    totalRecords: tables.reduce((sum, t) => sum + t.recordCount, 0),
  };

  return (
    <TablesListClient
      initialTables={serialized}
      initialStats={stats}
      airtableConnected={airtableConnected}
    />
  );
}
