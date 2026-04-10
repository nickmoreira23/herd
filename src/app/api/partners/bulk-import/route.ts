import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { bulkImportPartnersSchema } from "@/lib/validators/partner";

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, bulkImportPartnersSchema);
    if ("error" in result) return result.error;

    let created = 0;
    let updated = 0;

    for (const partner of result.data.partners) {
      const existing = await prisma.partnerBrand.findFirst({
        where: { name: partner.name },
      });

      if (existing) {
        await prisma.partnerBrand.update({
          where: { id: existing.id },
          data: partner,
        });
        updated++;
      } else {
        await prisma.partnerBrand.create({ data: partner });
        created++;
      }
    }

    return apiSuccess({ created, updated, total: result.data.partners.length }, 201);
  } catch (e) {
    console.error("POST /api/partners/bulk-import error:", e);
    return apiError("Failed to bulk import partners", 500);
  }
}
