import { prisma } from "@/lib/prisma";
import { agentConfig } from "@/lib/import-export/entity-config";
import { buildExportWorkbook } from "@/lib/import-export/export-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const columnsParam = searchParams.get("columns");
    const selectedColumns = columnsParam
      ? columnsParam.split(",").filter(Boolean)
      : agentConfig.columns.map((c) => c.key);

    const agents = await prisma.agent.findMany({ orderBy: { name: "asc" } });

    const records = agents.map((a) => {
      const rec: Record<string, unknown> = {};
      rec[agentConfig.identifierField] = a.key;
      for (const col of agentConfig.columns) {
        if (selectedColumns.includes(col.key)) {
          rec[col.key] = (a as Record<string, unknown>)[col.key];
        }
      }
      return rec;
    });

    const buffer = await buildExportWorkbook(agentConfig, selectedColumns, records);
    const date = new Date().toISOString().split("T")[0];

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="agents-export-${date}.xlsx"`,
      },
    });
  } catch (e) {
    console.error("GET /api/agents/export error:", e);
    return new Response("Failed to export agents", { status: 500 });
  }
}
