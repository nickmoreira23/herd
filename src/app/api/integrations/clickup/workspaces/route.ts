import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { ClickUpService } from "@/lib/services/clickup";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "clickup" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("ClickUp is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new ClickUpService(creds.apiToken);

    const workspaces = await service.listWorkspaces();

    const workspacesWithSpaces = await Promise.all(
      workspaces.map(async (workspace) => {
        const spaces = await service.listSpaces(workspace.id);
        return { ...workspace, spaces };
      })
    );

    return apiSuccess({ workspaces: workspacesWithSpaces });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch workspaces";
    return apiError(msg, 500);
  }
}
