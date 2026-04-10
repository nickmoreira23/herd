import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { INTEGRATION_OAUTH_CONFIGS } from "@/lib/services/integration-oauth";

const CALENDAR_SLUGS = ["google-calendar", "microsoft-outlook", "zoom"];

/**
 * GET — Returns calendar-related integrations with their connection status
 * and whether the required OAuth env vars are configured.
 */
export async function GET() {
  try {
    const integrations = await prisma.integration.findMany({
      where: { slug: { in: CALENDAR_SLUGS } },
      select: {
        id: true,
        name: true,
        slug: true,
        logoUrl: true,
        status: true,
        connectedAt: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });

    const result = integrations.map((integration) => {
      const config = INTEGRATION_OAUTH_CONFIGS[integration.slug];
      const configured = config
        ? !!(process.env[config.clientIdEnv] && process.env[config.clientSecretEnv])
        : false;

      return { ...integration, configured };
    });

    return apiSuccess(result);
  } catch (e) {
    console.error("GET /api/integrations/calendar-status error:", e);
    return apiError("Failed to fetch calendar integrations", 500);
  }
}
