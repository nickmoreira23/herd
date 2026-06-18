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

    // Brand the public header with the org the link was created from.
    let orgName: string | null = null;
    let orgLogoUrl: string | null = null;
    if (link.organizationId) {
      const org = await prisma.organization.findUnique({
        where: { id: link.organizationId },
        select: {
          name: true,
          assets: {
            where: { type: { in: ["LOGO_SQUARE", "LOGO_LIGHT"] } },
            select: { type: true, url: true },
          },
        },
      });
      orgName = org?.name ?? null;
      // Prefer a square mark for the icon slot, else the light-bg logo.
      orgLogoUrl =
        org?.assets.find((a) => a.type === "LOGO_SQUARE")?.url ??
        org?.assets.find((a) => a.type === "LOGO_LIGHT")?.url ??
        null;
    }

    return apiSuccess({
      scenarioName: snapshot.scenarioName,
      assumptions: snapshot.assumptions,
      perspective: link.perspective,
      sections: link.sections,
      orgName,
      orgLogoUrl,
    });
  } catch (e) {
    console.error("GET /api/projections/shared/:token error:", e);
    return apiError("Failed to load shared projection", 500);
  }
}
