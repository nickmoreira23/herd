import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { TrelloService } from "@/lib/services/trello";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "trello" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Trello is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new TrelloService(creds.apiKey, creds.apiToken);

    const boards = await service.listBoards();

    return apiSuccess({ boards });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch boards";
    return apiError(msg, 500);
  }
}
