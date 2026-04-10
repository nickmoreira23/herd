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
    const draft = await svc.getDraft(id, format);
    return apiSuccess(draft);
  } catch (e) {
    console.error("GET /api/integrations/gmail/drafts/[id] error:", e);
    return apiError("Failed to fetch draft", 500);
  }
}

export async function PUT(
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

    const { raw } = await request.json();
    if (!raw) return apiError("raw (base64url-encoded RFC 2822 message) is required", 400);

    const svc = new GmailService(integration.id);
    const draft = await svc.updateDraft(id, { raw });
    return apiSuccess(draft);
  } catch (e) {
    console.error("PUT /api/integrations/gmail/drafts/[id] error:", e);
    return apiError("Failed to update draft", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const integration = await prisma.integration.findUnique({
      where: { slug: "gmail" },
    });
    if (!integration) return apiError("Gmail integration not found", 404);
    if (!integration.credentials) return apiError("Gmail not connected", 400);

    const svc = new GmailService(integration.id);
    await svc.deleteDraft(id);
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/integrations/gmail/drafts/[id] error:", e);
    return apiError("Failed to delete draft", 500);
  }
}
