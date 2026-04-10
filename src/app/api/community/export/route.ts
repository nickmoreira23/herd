import { prisma } from "@/lib/prisma";
import { communityConfig } from "@/lib/import-export/entity-config";
import { buildExportWorkbook } from "@/lib/import-export/export-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const columnsParam = searchParams.get("columns");
    const selectedColumns = columnsParam
      ? columnsParam.split(",").filter(Boolean)
      : communityConfig.columns.map((c) => c.key);

    const benefits = await prisma.communityBenefit.findMany({ orderBy: { name: "asc" } });

    const records = benefits.map((b) => {
      const rec: Record<string, unknown> = {};
      rec[communityConfig.identifierField] = b.key;
      for (const col of communityConfig.columns) {
        if (selectedColumns.includes(col.key)) {
          rec[col.key] = (b as Record<string, unknown>)[col.key];
        }
      }
      return rec;
    });

    const buffer = await buildExportWorkbook(communityConfig, selectedColumns, records);
    const date = new Date().toISOString().split("T")[0];

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="community-export-${date}.xlsx"`,
      },
    });
  } catch (e) {
    console.error("GET /api/community/export error:", e);
    return new Response("Failed to export community benefits", { status: 500 });
  }
}
