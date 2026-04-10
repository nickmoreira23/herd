import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createPartnerSchema } from "@/lib/validators/partner";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const network = searchParams.get("network") || "";
    const benefitType = searchParams.get("benefitType") || "";
    const tierAccess = searchParams.get("tierAccess") || "";

    const where: Record<string, unknown> = {};
    if (search) {
      where.name = { contains: search, mode: "insensitive" };
    }
    if (category) {
      where.category = category;
    }
    if (status) {
      where.status = status;
    }
    if (network) {
      where.affiliateNetwork = { contains: network, mode: "insensitive" };
    }
    if (benefitType) {
      where.benefitType = benefitType;
    }
    if (tierAccess) {
      where.tierAccess = tierAccess;
    }

    const partners = await prisma.partnerBrand.findMany({
      where,
      orderBy: { name: "asc" },
      include: {
        tierAssignments: {
          include: { tier: true },
        },
      },
    });
    return apiSuccess(partners);
  } catch (e) {
    console.error("GET /api/partners error:", e);
    return apiError("Failed to fetch partners", 500);
  }
}

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, createPartnerSchema);
    if ("error" in result) return result.error;

    // Check for duplicate key
    const existing = await prisma.partnerBrand.findUnique({ where: { key: result.data.key } });
    if (existing) return apiError("A partner with this key already exists", 409);

    const partner = await prisma.partnerBrand.create({
      data: result.data,
    });

    return apiSuccess(partner, 201);
  } catch (e) {
    console.error("POST /api/partners error:", e);
    return apiError("Failed to create partner", 500);
  }
}
