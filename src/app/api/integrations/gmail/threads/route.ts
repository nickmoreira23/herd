import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { GmailService } from "@/lib/services/gmail";

export async function GET(request: Request) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "gmail" },
    });
    if (!integration) return apiError("Gmail integration not found", 404);
    if (!integration.credentials) return apiError("Gmail not connected", 400);

    const svc = new GmailService(integration.id);
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;
    const maxResults = searchParams.get("maxResults")
      ? parseInt(searchParams.get("maxResults")!)
      : undefined;
    const pageToken = searchParams.get("pageToken") || undefined;
    const labelIds = searchParams.getAll("labelIds");

    const threads = await svc.listThreads({
      q,
      maxResults,
      pageToken,
      labelIds: labelIds.length > 0 ? labelIds : undefined,
    });
    return apiSuccess(threads);
  } catch (e) {
    console.error("GET /api/integrations/gmail/threads error:", e);
    return apiError("Failed to fetch threads", 500);
  }
}
