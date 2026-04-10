import { prisma } from "@/lib/prisma";
import { productConfig } from "@/lib/import-export/entity-config";
import { buildExportWorkbook } from "@/lib/import-export/export-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const columnsParam = searchParams.get("columns");

    // Default to all columns if none specified
    const selectedColumns = columnsParam
      ? columnsParam.split(",").filter(Boolean)
      : productConfig.columns.map((c) => c.key);

    const products = await prisma.product.findMany({
      orderBy: { name: "asc" },
    });

    const records = products.map((p) => {
      const rec: Record<string, unknown> = {};
      rec[productConfig.identifierField] = p.sku;
      for (const col of productConfig.columns) {
        if (selectedColumns.includes(col.key)) {
          rec[col.key] = (p as Record<string, unknown>)[col.key];
        }
      }
      return rec;
    });

    const buffer = await buildExportWorkbook(productConfig, selectedColumns, records);
    const date = new Date().toISOString().split("T")[0];

    return new Response(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="products-export-${date}.xlsx"`,
      },
    });
  } catch (e) {
    console.error("GET /api/products/export error:", e);
    return new Response("Failed to export products", { status: 500 });
  }
}
