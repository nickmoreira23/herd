import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { batchClawbackRulesSchema } from "@/lib/validators/partner-agreement";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const rules = await prisma.clawbackRule.findMany({
      where: { agreementId: id },
      orderBy: { windowDays: "asc" },
    });
    return apiSuccess(rules);
  } catch (e) {
    console.error("GET /api/partner-agreements/[id]/clawback-rules error:", e);
    return apiError("Failed to fetch clawback rules", 500);
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, batchClawbackRulesSchema);
    if ("error" in result) return result.error;

    // Delete existing and replace
    await prisma.clawbackRule.deleteMany({ where: { agreementId: id } });

    const created = await Promise.all(
      result.data.rules.map((rule) =>
        prisma.clawbackRule.create({
          data: { agreementId: id, ...rule },
        })
      )
    );
    return apiSuccess(created);
  } catch (e) {
    console.error("POST /api/partner-agreements/[id]/clawback-rules error:", e);
    return apiError("Failed to save clawback rules", 500);
  }
}
