import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { LinearService } from "@/lib/services/linear";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "linear" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Linear is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new LinearService(creds.apiToken);

    const teams = await service.listTeams();

    return apiSuccess({ teams });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch teams";
    return apiError(msg, 500);
  }
}
