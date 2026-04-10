import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const users = await prisma.networkProfile.findMany({
      include: {
        profileType: { select: { id: true, displayName: true, slug: true, color: true, networkType: true } },
        profileRoles: {
          include: { role: { select: { id: true, displayName: true, slug: true } } },
        },
        profileRanks: {
          where: { isCurrent: true },
          include: { rankTier: { select: { displayName: true, color: true, level: true } } },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(users);
  } catch (e) {
    console.error("GET /api/users error:", e);
    return apiError("Failed to fetch users", 500);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { firstName, lastName, email, phone, profileTypeId, roleIds } = body;

    if (!firstName || !email || !profileTypeId) {
      return apiError("First name, email, and profile type are required", 400);
    }

    const existing = await prisma.networkProfile.findUnique({ where: { email } });
    if (existing) {
      return apiError("A user with this email already exists", 409);
    }

    // Fetch profile type to determine networkType
    const profileType = await prisma.networkProfileType.findUnique({
      where: { id: profileTypeId },
    });
    if (!profileType) {
      return apiError("Invalid profile type", 400);
    }

    const user = await prisma.networkProfile.create({
      data: {
        firstName,
        lastName: lastName || "",
        email,
        phone: phone || null,
        networkType: profileType.networkType,
        profileTypeId,
        status: "PENDING",
        profileRoles: roleIds?.length
          ? { createMany: { data: roleIds.map((roleId: string) => ({ roleId })) } }
          : undefined,
      },
      include: {
        profileType: { select: { id: true, displayName: true, slug: true, color: true, networkType: true } },
        profileRoles: {
          include: { role: { select: { id: true, displayName: true, slug: true } } },
        },
      },
    });

    return apiSuccess(user, 201);
  } catch (e) {
    console.error("POST /api/users error:", e);
    return apiError("Failed to create user", 500);
  }
}
