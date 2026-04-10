import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { GmailService } from "@/lib/services/gmail";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "gmail" },
    });
    if (!integration) return apiError("Gmail integration not found", 404);
    if (!integration.credentials) return apiError("Gmail not connected", 400);

    const svc = new GmailService(integration.id);
    const labels = await svc.listLabels();
    return apiSuccess(labels);
  } catch (e) {
    console.error("GET /api/integrations/gmail/labels error:", e);
    return apiError("Failed to fetch labels", 500);
  }
}

export async function POST(request: Request) {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "gmail" },
    });
    if (!integration) return apiError("Gmail integration not found", 404);
    if (!integration.credentials) return apiError("Gmail not connected", 400);

    const body = await request.json();
    const svc = new GmailService(integration.id);
    const label = await svc.createLabel(body);
    return apiSuccess(label);
  } catch (e) {
    console.error("POST /api/integrations/gmail/labels error:", e);
    return apiError("Failed to create label", 500);
  }
}
