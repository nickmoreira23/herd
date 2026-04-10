import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { GmailService } from "@/lib/services/gmail";

export async function GET(
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
    const label = await svc.getLabel(id);
    return apiSuccess(label);
  } catch (e) {
    console.error("GET /api/integrations/gmail/labels/[id] error:", e);
    return apiError("Failed to fetch label", 500);
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

    const body = await request.json();
    const svc = new GmailService(integration.id);
    const label = await svc.updateLabel(id, body);
    return apiSuccess(label);
  } catch (e) {
    console.error("PUT /api/integrations/gmail/labels/[id] error:", e);
    return apiError("Failed to update label", 500);
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
    await svc.deleteLabel(id);
    return apiSuccess({ deleted: true });
  } catch (e) {
    console.error("DELETE /api/integrations/gmail/labels/[id] error:", e);
    return apiError("Failed to delete label", 500);
  }
}
