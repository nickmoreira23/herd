import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { manualEntrySchema } from "@/lib/validators/commission-ledger";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const partnerId = url.searchParams.get("partnerId");
    const orgNodeId = url.searchParams.get("orgNodeId");
    const agreementId = url.searchParams.get("agreementId");
    const entryType = url.searchParams.get("entryType");
    const source = url.searchParams.get("source");
    const dateFrom = url.searchParams.get("dateFrom");
    const dateTo = url.searchParams.get("dateTo");
    const page = parseInt(url.searchParams.get("page") || "1");
    const pageSize = Math.min(parseInt(url.searchParams.get("pageSize") || "50"), 100);

    const where: Prisma.CommissionLedgerEntryWhereInput = {};

    if (orgNodeId) where.orgNodeId = orgNodeId;
    if (agreementId) where.agreementId = agreementId;
    if (entryType) where.entryType = entryType as Prisma.EnumLedgerEntryTypeFilter["equals"];
    if (source) where.source = source as Prisma.EnumLedgerEntrySourceFilter["equals"];
    if (partnerId) where.orgNode = { d2dPartnerId: partnerId };
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    const [entries, total] = await Promise.all([
      prisma.commissionLedgerEntry.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          orgNode: { select: { id: true, name: true, roleType: true, d2dPartnerId: true } },
          agreement: { select: { id: true, name: true, partner: { select: { name: true } } } },
        },
      }),
      prisma.commissionLedgerEntry.count({ where }),
    ]);

    return apiSuccess({ entries, total, page, pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (e) {
    console.error("GET /api/commission-ledger error:", e);
    return apiError("Failed to fetch ledger entries", 500);
  }
}

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, manualEntrySchema);
    if ("error" in result) return result.error;

    const entry = await prisma.commissionLedgerEntry.create({
      data: {
        ...result.data,
        metadata: result.data.metadata ?? undefined,
      } as Parameters<typeof prisma.commissionLedgerEntry.create>[0]["data"],
    });
    return apiSuccess(entry, 201);
  } catch (e) {
    console.error("POST /api/commission-ledger error:", e);
    return apiError("Failed to create ledger entry", 500);
  }
}
