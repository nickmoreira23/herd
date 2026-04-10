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
    const message = await svc.getMessage(id, format);
    return apiSuccess(message);
  } catch (e) {
    console.error("GET /api/integrations/gmail/messages/[id] error:", e);
    return apiError("Failed to fetch message", 500);
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
    const message = await svc.trashMessage(id);
    return apiSuccess(message);
  } catch (e) {
    console.error("DELETE /api/integrations/gmail/messages/[id] error:", e);
    return apiError("Failed to trash message", 500);
  }
}

export async function PATCH(
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

    const { addLabelIds, removeLabelIds } = await request.json();
    const svc = new GmailService(integration.id);
    const message = await svc.modifyMessage(id, addLabelIds, removeLabelIds);
    return apiSuccess(message);
  } catch (e) {
    console.error("PATCH /api/integrations/gmail/messages/[id] error:", e);
    return apiError("Failed to modify message", 500);
  }
}
