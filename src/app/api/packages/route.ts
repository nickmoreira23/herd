import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { createPackageSchema } from "@/lib/validators/package";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const goal = searchParams.get("goal");

    const packages = await prisma.package.findMany({
      where: goal ? { fitnessGoal: goal as never } : undefined,
      orderBy: [{ fitnessGoal: "asc" }, { sortOrder: "asc" }],
      include: {
        variants: {
          include: {
            subscriptionTier: { select: { id: true, name: true, monthlyCredits: true } },
            _count: { select: { products: true } },
          },
        },
      },
    });

    return apiSuccess(packages);
  } catch (e) {
    console.error("GET /api/packages error:", e);
    return apiError("Failed to fetch packages", 500);
  }
}

export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, createPackageSchema);
    if ("error" in result) return result.error;

    const existing = await prisma.package.findUnique({
      where: { slug: result.data.slug },
    });
    if (existing) {
      return apiError("A package with this slug already exists", 409);
    }

    // Get all active tiers to auto-scaffold variants
    const activeTiers = await prisma.subscriptionTier.findMany({
      where: { status: "ACTIVE" },
      select: { id: true },
      orderBy: { sortOrder: "asc" },
    });

    const pkg = await prisma.package.create({
      data: {
        ...result.data,
        variants: {
          create: activeTiers.map((tier) => ({
            subscriptionTierId: tier.id,
          })),
        },
      },
      include: {
        variants: {
          include: {
            subscriptionTier: { select: { id: true, name: true, monthlyCredits: true } },
          },
        },
      },
    });

    return apiSuccess(pkg, 201);
  } catch (e) {
    console.error("POST /api/packages error:", e);
    return apiError("Failed to create package", 500);
  }
}
