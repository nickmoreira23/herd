import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";

// GET /api/projections/shared/:token — PUBLIC. Resolve a projection share link
// and return the inputs + locked perspective so the public page can render the
// projection full-screen (no assumptions). No auth by design (V1).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  try {
    const link = await prisma.projectionShareLink.findUnique({ where: { token } });
    if (!link || !link.isActive) {
      return apiError("Share link not found or has been revoked", 404);
    }
    if (link.expiresAt && link.expiresAt < new Date()) {
      return apiError("Share link has expired", 410);
    }

    const snapshot = await prisma.financialSnapshot.findUnique({
      where: { id: link.snapshotId },
      select: { scenarioName: true, assumptions: true },
    });
    if (!snapshot) return apiError("Projection not found", 404);

    return apiSuccess({
      scenarioName: snapshot.scenarioName,
      assumptions: snapshot.assumptions,
      perspective: link.perspective,
      sections: link.sections,
    });
  } catch (e) {
    console.error("GET /api/projections/shared/:token error:", e);
    return apiError("Failed to load shared projection", 500);
  }
}
