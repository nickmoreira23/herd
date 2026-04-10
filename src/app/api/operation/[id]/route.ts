import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { z } from "zod";

const milestoneSchema = z.object({
  id: z.string().optional(),
  memberCount: z.number().int().min(0),
  monthlyCost: z.number().min(0),
  notes: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  sortOrder: z.number().int().optional(),
});

const addItemSchema = z.object({
  action: z.literal("addItem"),
  name: z.string().min(1),
  description: z.string().optional(),
  vendor: z.string().optional(),
  milestones: z.array(milestoneSchema).optional(),
});

const updateItemSchema = z.object({
  action: z.literal("updateItem"),
  itemId: z.string(),
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  vendor: z.string().optional(),
  milestones: z.array(milestoneSchema).optional(),
});

const deleteItemSchema = z.object({
  action: z.literal("deleteItem"),
  itemId: z.string(),
});

const reorderItemsSchema = z.object({
  action: z.literal("reorderItems"),
  itemIds: z.array(z.string()),
});

const patchSchema = z.discriminatedUnion("action", [
  updateCategorySchema.extend({ action: z.literal("updateCategory") }),
  addItemSchema,
  updateItemSchema,
  deleteItemSchema,
  reorderItemsSchema,
]);

// GET: Fetch a single category with items and milestones
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const category = await prisma.opexCategory.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
          include: {
            milestones: { orderBy: { memberCount: "asc" } },
          },
        },
      },
    });

    if (!category) return apiError("Category not found", 404);
    return apiSuccess(category);
  } catch (e) {
    console.error("GET /api/operations/[id] error:", e);
    return apiError("Failed to fetch category", 500);
  }
}

// PATCH: Update category, add/update/delete items
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const result = await parseAndValidate(request, patchSchema);
    if ("error" in result) return result.error;

    const data = result.data;

    if (data.action === "updateCategory") {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { action: _, ...updates } = data;
      const category = await prisma.opexCategory.update({
        where: { id },
        data: updates,
        include: {
          items: {
            include: { milestones: { orderBy: { memberCount: "asc" } } },
          },
        },
      });
      return apiSuccess(category);
    }

    if (data.action === "addItem") {
      const item = await prisma.opexItem.create({
        data: {
          categoryId: id,
          name: data.name,
          description: data.description,
          vendor: data.vendor,
          milestones: data.milestones
            ? {
                create: data.milestones.map((m) => ({
                  memberCount: m.memberCount,
                  monthlyCost: m.monthlyCost,
                  notes: m.notes,
                })),
              }
            : undefined,
        },
        include: { milestones: { orderBy: { memberCount: "asc" } } },
      });
      return apiSuccess(item, 201);
    }

    if (data.action === "updateItem") {
      // Delete existing milestones and re-create
      if (data.milestones) {
        await prisma.opexMilestone.deleteMany({
          where: { itemId: data.itemId },
        });
        await prisma.opexMilestone.createMany({
          data: data.milestones.map((m) => ({
            itemId: data.itemId,
            memberCount: m.memberCount,
            monthlyCost: m.monthlyCost,
            notes: m.notes,
          })),
        });
      }

      const item = await prisma.opexItem.update({
        where: { id: data.itemId },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.vendor !== undefined && { vendor: data.vendor }),
        },
        include: { milestones: { orderBy: { memberCount: "asc" } } },
      });
      return apiSuccess(item);
    }

    if (data.action === "deleteItem") {
      await prisma.opexItem.update({
        where: { id: data.itemId },
        data: { isActive: false },
      });
      return apiSuccess({ deleted: true });
    }

    if (data.action === "reorderItems") {
      await Promise.all(
        data.itemIds.map((itemId, index) =>
          prisma.opexItem.update({
            where: { id: itemId },
            data: { sortOrder: index },
          })
        )
      );
      return apiSuccess({ reordered: true });
    }

    return apiError("Unknown action", 400);
  } catch (e) {
    console.error("PATCH /api/operations/[id] error:", e);
    return apiError("Failed to update", 500);
  }
}

// DELETE: Soft-delete a category
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.opexCategory.update({
      where: { id },
      data: { isActive: false },
    });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/operations/[id] error:", e);
    return apiError("Failed to delete category", 500);
  }
}
