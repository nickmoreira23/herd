import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { AsanaService } from "@/lib/services/asana";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "asana" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Asana is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new AsanaService(creds.apiToken);

    const workspaces = await service.listWorkspaces();

    const workspacesWithProjects = await Promise.all(
      workspaces.map(async (workspace) => {
        const projects = await service.listProjects(workspace.gid);
        return { ...workspace, projects };
      })
    );

    return apiSuccess({ workspaces: workspacesWithProjects });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch workspaces";
    return apiError(msg, 500);
  }
}
