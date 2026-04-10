import { prisma } from "@/lib/prisma";
import { partnerConfig } from "@/lib/import-export/entity-config";
import { buildExportWorkbook } from "@/lib/import-export/export-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const columnsParam = searchParams.get("columns");
    const selectedColumns = columnsParam
      ? columnsParam.split(",").filter(Boolean)
      : partnerConfig.columns.map((c) => c.key);

    const partners = await prisma.partnerBrand.findMany({ orderBy: { name: "asc" } });

    const records = partners.map((p) => {
      const rec: Record<string, unknown> = {};
      rec[partnerConfig.identifierField] = p.key;
      for (const col of partnerConfig.columns) {
        if (selectedColumns.includes(col.key)) {
          rec[col.key] = (p as Record<string, unknown>)[col.key];
        }
      }
      return rec;
    });

    const buffer = await buildExportWorkbook(partnerConfig, selectedColumns, records);
    const date = new Date().toISOString().split("T")[0];

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="partners-export-${date}.xlsx"`,
      },
    });
  } catch (e) {
    console.error("GET /api/partners/export error:", e);
    return new Response("Failed to export partners", { status: 500 });
  }
}
