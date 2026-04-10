import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError, parseAndValidate } from "@/lib/api-utils";
import { z } from "zod";

const milestoneSchema = z.object({
  memberCount: z.number().int().min(0),
  monthlyCost: z.number().min(0),
  notes: z.string().optional(),
});

const itemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  vendor: z.string().optional(),
  milestones: z.array(milestoneSchema).optional(),
});

const categorySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  icon: z.string().optional(),
  items: z.array(itemSchema).optional(),
});

// GET: Fetch all categories with items and milestones
export async function GET() {
  try {
    const categories = await prisma.opexCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { name: "asc" },
          include: {
            milestones: {
              orderBy: { memberCount: "asc" },
            },
          },
        },
      },
    });

    return apiSuccess(categories);
  } catch (e) {
    console.error("GET /api/operations error:", e);
    return apiError("Failed to fetch operations data", 500);
  }
}

// POST: Create a new category (optionally with items and milestones)
export async function POST(request: Request) {
  try {
    const result = await parseAndValidate(request, categorySchema);
    if ("error" in result) return result.error;

    const { name, description, icon, items } = result.data;

    const maxSort = await prisma.opexCategory.aggregate({
      _max: { sortOrder: true },
    });

    const category = await prisma.opexCategory.create({
      data: {
        name,
        description,
        icon,
        sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
        items: items
          ? {
              create: items.map((item) => ({
                name: item.name,
                description: item.description,
                vendor: item.vendor,
                milestones: item.milestones
                  ? {
                      create: item.milestones.map((m) => ({
                        memberCount: m.memberCount,
                        monthlyCost: m.monthlyCost,
                        notes: m.notes,
                      })),
                    }
                  : undefined,
              })),
            }
          : undefined,
      },
      include: {
        items: {
          include: { milestones: { orderBy: { memberCount: "asc" } } },
        },
      },
    });

    return apiSuccess(category, 201);
  } catch (e) {
    console.error("POST /api/operations error:", e);
    return apiError("Failed to create category", 500);
  }
}
