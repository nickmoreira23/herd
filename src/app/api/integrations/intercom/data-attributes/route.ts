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
    const model = searchParams.get("model") as "contact" | "company" | "conversation" | null;

    const attributes = await svc.listDataAttributes(model || undefined);
    return apiSuccess(attributes);
  } catch (e) {
    console.error("GET /api/integrations/intercom/data-attributes error:", e);
    return apiError("Failed to fetch Intercom data attributes", 500);
  }
}
