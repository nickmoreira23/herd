import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { AirtableService } from "@/lib/services/airtable";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ baseId: string }> }
) {
  try {
    const { baseId } = await params;

    const integration = await prisma.integration.findUnique({
      where: { slug: "airtable" },
    });
    if (!integration) return apiError("Airtable integration not found", 404);
    if (!integration.credentials)
      return apiError("Airtable not connected", 400);

    const creds = JSON.parse(decrypt(integration.credentials)) as {
      apiToken: string;
    };
    const svc = new AirtableService(creds.apiToken);

    const tables = await svc.getBaseSchema(baseId);
    return apiSuccess(tables);
  } catch (e) {
    console.error("GET /api/integrations/airtable/bases/[baseId]/tables error:", e);
    return apiError("Failed to fetch Airtable tables", 500);
  }
}
