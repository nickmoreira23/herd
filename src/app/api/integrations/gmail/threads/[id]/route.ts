import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { GmailService } from "@/lib/services/gmail";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const integration = await prisma.integration.findUnique({
      where: { slug: "gmail" },
    });
    if (!integration) return apiError("Gmail integration not found", 404);
    if (!integration.credentials) return apiError("Gmail not connected", 400);

    const { searchParams } = new URL(request.url);
    const format = (searchParams.get("format") as "full" | "metadata" | "minimal") || "full";

    const svc = new GmailService(integration.id);
    const thread = await svc.getThread(id, format);
    return apiSuccess(thread);
  } catch (e) {
    console.error("GET /api/integrations/gmail/threads/[id] error:", e);
    return apiError("Failed to fetch thread", 500);
  }
}
