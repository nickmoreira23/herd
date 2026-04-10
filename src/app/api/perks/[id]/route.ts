import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { updatePerkSchema } from "@/lib/validators/perk";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const perk = await prisma.perk.findUnique({
      where: { id },
      include: {
        tierAssignments: {
          include: {
            tier: {
              select: { name: true },
            },
          },
        },
      },
    });
    if (!perk) return apiError("Perk not found", 404);
    return apiSuccess(perk);
  } catch (e) {
    console.error("GET /api/perks/[id] error:", e);
    return apiError("Failed to fetch perk", 500);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await parseAndValidate(request, updatePerkSchema);
    if ("error" in result) return result.error;

    const perk = await prisma.perk.update({
      where: { id },
      data: result.data,
    });

    return apiSuccess(perk);
  } catch (e) {
    console.error("PATCH /api/perks/[id] error:", e);
    return apiError("Failed to update perk", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.perk.delete({ where: { id } });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/perks/[id] error:", e);
    return apiError("Failed to delete perk", 500);
  }
}
