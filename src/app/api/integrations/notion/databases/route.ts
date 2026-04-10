import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { NotionTasksService } from "@/lib/services/notion-tasks";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "notion" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Notion is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new NotionTasksService(creds.apiToken);

    const databases = await service.searchDatabases();

    return apiSuccess({ databases });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch databases";
    return apiError(msg, 500);
  }
}
