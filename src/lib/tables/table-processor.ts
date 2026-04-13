import { prisma } from "@/lib/prisma";
import { serializeTableToText } from "./table-serializer";

/**
 * Process a knowledge table: serialize all records to text for RAG indexing.
 *
 * Pipeline:
 * 1. Set table status → PROCESSING
 * 2. Fetch table + all fields + all records
 * 3. Serialize records to structured text via table-serializer
 * 4. Store textContent, contentLength, estimated chunkCount
 * 5. Set status → READY (or ERROR on failure)
 */
export async function processTable(tableId: string): Promise<void> {
  // 1. Set PROCESSING
  await prisma.knowledgeTable.update({
    where: { id: tableId },
    data: { status: "PROCESSING", errorMessage: null },
  });

  try {
    // 2. Fetch table with fields and records
    const table = await prisma.knowledgeTable.findUnique({
      where: { id: tableId },
      include: {
        fields: { orderBy: { sortOrder: "asc" } },
        records: { orderBy: { sortOrder: "asc" } },
      },
    });

    if (!table) {
      throw new Error("Table not found");
    }

    // 3. Serialize
    const fields = table.fields.map((f) => ({
      id: f.id,
      name: f.name,
      type: f.type,
      options: f.options as Record<string, unknown> | null,
      isPrimary: f.isPrimary,
    }));

    const records = table.records.map((r) => ({
      id: r.id,
      data: r.data as Record<string, unknown>,
    }));

    const textContent = serializeTableToText(
      { name: table.name, description: table.description },
      fields,
      records
    );

    const contentLength = textContent.length;
    // Estimate chunks at ~1000 chars each (consistent with other knowledge types)
    const chunkCount = Math.max(1, Math.ceil(contentLength / 1000));

    // 4. Update table with processed text
    await prisma.knowledgeTable.update({
      where: { id: tableId },
      data: {
        textContent,
        contentLength,
        chunkCount,
        status: "READY",
        processedAt: new Date(),
        errorMessage: null,
      },
    });
  } catch (e) {
    const errorMessage =
      e instanceof Error ? e.message : "Unknown processing error";

    console.error(
      `[Knowledge] Table processing failed for ${tableId}:`,
      e
    );

    await prisma.knowledgeTable.update({
      where: { id: tableId },
      data: { status: "ERROR", errorMessage },
    });

    throw e;
  }
}
