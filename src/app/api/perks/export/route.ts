import { prisma } from "@/lib/prisma";
import { perkConfig } from "@/lib/import-export/entity-config";
import { buildExportWorkbook } from "@/lib/import-export/export-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const columnsParam = searchParams.get("columns");
    const selectedColumns = columnsParam
      ? columnsParam.split(",").filter(Boolean)
      : perkConfig.columns.map((c) => c.key);

    const perks = await prisma.perk.findMany({ orderBy: { name: "asc" } });

    const records = perks.map((p) => {
      const rec: Record<string, unknown> = {};
      rec[perkConfig.identifierField] = p.key;
      for (const col of perkConfig.columns) {
        if (selectedColumns.includes(col.key)) {
          rec[col.key] = (p as Record<string, unknown>)[col.key];
        }
      }
      return rec;
    });

    const buffer = await buildExportWorkbook(perkConfig, selectedColumns, records);
    const date = new Date().toISOString().split("T")[0];

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="perks-export-${date}.xlsx"`,
      },
    });
  } catch (e) {
    console.error("GET /api/perks/export error:", e);
    return new Response("Failed to export perks", { status: 500 });
  }
}
