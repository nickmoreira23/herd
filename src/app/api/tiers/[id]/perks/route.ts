import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { z } from "zod";

const updateSchema = z.object({
  assignments: z.array(
    z.object({
      perkId: z.string().uuid(),
      isEnabled: z.boolean(),
      configValue: z.string().optional().nullable(),
    })
  ),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rows = await prisma.perkTierAssignment.findMany({
      where: { subscriptionTierId: id },
      include: {
        perk: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
            icon: true,
            status: true,
            hasSubConfig: true,
            subConfigLabel: true,
            subConfigType: true,
            subConfigOptions: true,
          },
        },
      },
      orderBy: { perk: { sortOrder: "asc" } },
    });
    return apiSuccess(rows);
  } catch (e) {
    console.error("GET /api/tiers/[id]/perks error:", e);
    return apiError("Failed to fetch tier perks", 500);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const result = updateSchema.safeParse(body);
    if (!result.success) {
      return apiError(result.error.issues[0]?.message || "Invalid input", 400);
    }

    const { assignments } = result.data;

    await prisma.$transaction(async (tx) => {
      // Remove all existing assignments for this tier
      await tx.perkTierAssignment.deleteMany({
        where: { subscriptionTierId: id },
      });

      // Create new assignments (only enabled ones)
      const enabled = assignments.filter((a) => a.isEnabled);
      if (enabled.length > 0) {
        await tx.perkTierAssignment.createMany({
          data: enabled.map((a) => ({
            perkId: a.perkId,
            subscriptionTierId: id,
            isEnabled: true,
            configValue: a.configValue ?? null,
          })),
        });
      }
    });

    const updated = await prisma.perkTierAssignment.findMany({
      where: { subscriptionTierId: id },
      include: {
        perk: {
          select: {
            id: true,
            name: true,
            key: true,
            description: true,
            icon: true,
            status: true,
            hasSubConfig: true,
            subConfigLabel: true,
            subConfigType: true,
            subConfigOptions: true,
          },
        },
      },
      orderBy: { perk: { sortOrder: "asc" } },
    });

    return apiSuccess(updated);
  } catch (e) {
    console.error("PUT /api/tiers/[id]/perks error:", e);
    return apiError("Failed to update tier perks", 500);
  }
}
