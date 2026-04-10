import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { buildAuthorizeUrl } from "@/lib/services/integration-oauth";

/**
 * POST — Initiate OAuth2 flow for an integration.
 * Returns the authorization URL to redirect the user to.
 */
export async function POST(request: Request) {
  try {
    const { integrationId, returnTo } = await request.json();
    if (!integrationId) return apiError("integrationId is required", 400);

    const integration = await prisma.integration.findUnique({
      where: { id: integrationId },
    });
    if (!integration) return apiError("Integration not found", 404);

    const authorizeUrl = buildAuthorizeUrl(integration.slug, integration.id, returnTo);
    return apiSuccess({ authorizeUrl });
  } catch (e) {
    console.error("POST /api/integrations/oauth/authorize error:", e);
    const message = e instanceof Error ? e.message : "Failed to initiate OAuth";
    return apiError(message, 500);
  }
}
