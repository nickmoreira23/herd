import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const users = await prisma.networkProfile.findMany({
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(users);
  } catch (e) {
    console.error("GET /api/users error:", e);
    return apiError("Failed to fetch users", 500);
  }
}

// POST removed Sub-etapa 24 — direct user creation replaced by invitation flow.
// Use POST /api/org/invitations instead.
