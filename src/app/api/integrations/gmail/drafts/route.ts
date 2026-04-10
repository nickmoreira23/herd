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
    const maxResults = searchParams.get("maxResults")
      ? parseInt(searchParams.get("maxResults")!)
      : undefined;
    const pageToken = searchParams.get("pageToken") || undefined;

    const drafts = await svc.listDrafts({ maxResults, pageToken });
    return apiSuccess(drafts);
  } catch (e) {
    console.error("GET /api/integrations/gmail/drafts error:", e);
    return apiError("Failed to fetch drafts", 500);
  }
}

export async function POST(request: Request) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "gmail" },
    });
    if (!integration) return apiError("Gmail integration not found", 404);
    if (!integration.credentials) return apiError("Gmail not connected", 400);

    const { raw } = await request.json();
    if (!raw) return apiError("raw (base64url-encoded RFC 2822 message) is required", 400);

    const svc = new GmailService(integration.id);
    const draft = await svc.createDraft({ raw });
    return apiSuccess(draft);
  } catch (e) {
    console.error("POST /api/integrations/gmail/drafts error:", e);
    return apiError("Failed to create draft", 500);
  }
}
