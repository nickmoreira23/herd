import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { IntercomService } from "@/lib/services/intercom";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const integration = await prisma.integration.findUnique({
      where: { slug: "intercom" },
    });
    if (!integration) return apiError("Intercom integration not found", 404);
    if (!integration.credentials) return apiError("Intercom not connected", 400);

    const creds = JSON.parse(decrypt(integration.credentials)) as { apiToken: string };
    const svc = new IntercomService(creds.apiToken);

    const contact = await svc.getContact(id);
    return apiSuccess(contact);
  } catch (e) {
    console.error("GET /api/integrations/intercom/contacts/[id] error:", e);
    return apiError("Failed to fetch Intercom contact", 500);
  }
}
