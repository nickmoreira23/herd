import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { z } from "zod";

const createShareSchema = z.object({
  permission: z.enum(["view", "edit"]),
});

// GET /api/packages/:id/share — list share links for a package
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const links = await prisma.packageShareLink.findMany({
      where: { packageId: id, isActive: true },
      orderBy: { createdAt: "desc" },
    });

    return apiSuccess(links);
  } catch (e) {
    console.error("GET /api/packages/:id/share error:", e);
    return apiError("Failed to fetch share links", 500);
  }
}

// POST /api/packages/:id/share — create a new share link
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: packageId } = await params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON", 400);
  }

  const parsed = createShareSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("Validation failed", 400, parsed.error.issues);
  }

  try {
    // Verify package exists
    const pkg = await prisma.package.findUnique({ where: { id: packageId } });
    if (!pkg) return apiError("Package not found", 404);

    const link = await prisma.packageShareLink.create({
      data: {
        packageId,
        permission: parsed.data.permission,
      },
    });

    return apiSuccess(link, 201);
  } catch (e) {
    console.error("POST /api/packages/:id/share error:", e);
    return apiError("Failed to create share link", 500);
  }
}

// DELETE /api/packages/:id/share — revoke a share link
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: packageId } = await params;

  const url = new URL(request.url);
  const linkId = url.searchParams.get("linkId");
  if (!linkId) return apiError("linkId query param required", 400);

  try {
    await prisma.packageShareLink.update({
      where: { id: linkId, packageId },
      data: { isActive: false },
    });

    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/packages/:id/share error:", e);
    return apiError("Failed to revoke share link", 500);
  }
}
