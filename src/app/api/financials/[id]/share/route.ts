import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { z } from "zod/v4";

const createShareSchema = z.object({
  // "general" | "party:<id>" | "member:<roleKey>" — the locked view of the projection.
  perspective: z.string().min(1).default("general"),
  // Which projection tabs the public page shows. Empty/omitted = all.
  sections: z.array(z.string()).default([]),
});

// GET /api/financials/:id/share — list active share links for a snapshot
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const links = await prisma.projectionShareLink.findMany({
      where: { snapshotId: id, isActive: true },
      orderBy: { createdAt: "desc" },
    });
    return apiSuccess(links);
  } catch (e) {
    console.error("GET /api/financials/:id/share error:", e);
    return apiError("Failed to fetch share links", 500);
  }
}

// POST /api/financials/:id/share — create a public share link for one perspective
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: snapshotId } = await params;

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
    const snapshot = await prisma.financialSnapshot.findUnique({ where: { id: snapshotId } });
    if (!snapshot) return apiError("Projection not found", 404);

    // Always mint a NEW link — a projection can have many active links at once
    // (different views / section sets); each stays live until explicitly revoked.
    const link = await prisma.projectionShareLink.create({
      data: {
        snapshotId,
        perspective: parsed.data.perspective,
        sections: parsed.data.sections,
      },
    });

    return apiSuccess(link, 201);
  } catch (e) {
    console.error("POST /api/financials/:id/share error:", e);
    return apiError("Failed to create share link", 500);
  }
}

// DELETE /api/financials/:id/share?linkId=... — revoke a share link
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: snapshotId } = await params;
  const linkId = new URL(request.url).searchParams.get("linkId");
  if (!linkId) return apiError("linkId query param required", 400);

  try {
    await prisma.projectionShareLink.update({
      where: { id: linkId, snapshotId },
      data: { isActive: false },
    });
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/financials/:id/share error:", e);
    return apiError("Failed to revoke share link", 500);
  }
}
