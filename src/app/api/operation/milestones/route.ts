import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { z } from "zod";

const milestoneLevelSchema = z.object({
  memberCount: z.number().int().min(0),
  label: z.string().min(1),
});

const bulkSchema = z.object({
  milestones: z.array(milestoneLevelSchema),
});

const createSchema = z.object({
  memberCount: z.number().int().min(0),
  label: z.string().min(1),
  sortOrder: z.number().int().optional(),
});

const updateSchema = z.object({
  id: z.string().uuid(),
  memberCount: z.number().int().min(0).optional(),
  label: z.string().min(1).optional(),
  sortOrder: z.number().int().optional(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

// GET: Fetch all milestone levels
export async function GET() {
  try {
    const milestones = await prisma.opexMilestoneLevel.findMany({
      orderBy: { memberCount: "asc" },
    });
    return apiSuccess(milestones);
  } catch (e) {
    console.error("GET /api/operation/milestones error:", e);
    return apiError("Failed to fetch milestones", 500);
  }
}

// POST: Create a single milestone level
export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, createSchema);
    if ("error" in result) return result.error;

    const milestone = await prisma.opexMilestoneLevel.create({
      data: result.data,
    });

    return apiSuccess(milestone, 201);
  } catch (e) {
    console.error("POST /api/operation/milestones error:", e);
    if ((e as { code?: string }).code === "P2002") {
      return apiError("A milestone with that member count already exists", 409);
    }
    return apiError("Failed to create milestone", 500);
  }
}

// PATCH: Update a single milestone level
export async function PATCH(request: Request) {
  try {
    const result = await parseAndValidate(request, updateSchema);
    if ("error" in result) return result.error;

    const { id, ...data } = result.data;
    const milestone = await prisma.opexMilestoneLevel.update({
      where: { id },
      data,
    });

    return apiSuccess(milestone);
  } catch (e) {
    console.error("PATCH /api/operation/milestones error:", e);
    if ((e as { code?: string }).code === "P2002") {
      return apiError("A milestone with that member count already exists", 409);
    }
    if ((e as { code?: string }).code === "P2025") {
      return apiError("Milestone not found", 404);
    }
    return apiError("Failed to update milestone", 500);
  }
}

// DELETE: Delete a single milestone level
export async function DELETE(request: Request) {
  try {
    const result = await parseAndValidate(request, deleteSchema);
    if ("error" in result) return result.error;

    await prisma.opexMilestoneLevel.delete({
      where: { id: result.data.id },
    });

    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/operation/milestones error:", e);
    if ((e as { code?: string }).code === "P2025") {
      return apiError("Milestone not found", 404);
    }
    return apiError("Failed to delete milestone", 500);
  }
}

// PUT: Replace all milestone levels
export async function PUT(request: Request) {
  try {
    const result = await parseAndValidate(request, bulkSchema);
    if ("error" in result) return result.error;

    const { milestones } = result.data;

    // Delete all and re-create
    await prisma.opexMilestoneLevel.deleteMany();
    await prisma.opexMilestoneLevel.createMany({
      data: milestones.map((m, i) => ({
        memberCount: m.memberCount,
        label: m.label,
        sortOrder: i,
      })),
    });

    const created = await prisma.opexMilestoneLevel.findMany({
      orderBy: { memberCount: "asc" },
    });

    return apiSuccess(created);
  } catch (e) {
    console.error("PUT /api/operation/milestones error:", e);
    return apiError("Failed to update milestones", 500);
  }
}
