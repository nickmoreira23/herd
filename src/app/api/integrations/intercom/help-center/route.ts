import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { IntercomService } from "@/lib/services/intercom";

export async function GET(request: Request) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "intercom" },
    });
    if (!integration) return apiError("Intercom integration not found", 404);
    if (!integration.credentials) return apiError("Intercom not connected", 400);

    const creds = JSON.parse(decrypt(integration.credentials)) as { apiToken: string };
    const svc = new IntercomService(creds.apiToken);

    const { searchParams } = new URL(request.url);
    const startingAfter = searchParams.get("starting_after") || undefined;
    const perPage = parseInt(searchParams.get("per_page") || "25");

    const [collections, articlesResult] = await Promise.all([
      svc.listHelpCenterCollections(),
      svc.listHelpCenterArticles({ startingAfter, perPage }),
    ]);

    return apiSuccess({ collections, ...articlesResult });
  } catch (e) {
    console.error("GET /api/integrations/intercom/help-center error:", e);
    return apiError("Failed to fetch Intercom help center", 500);
  }
}
