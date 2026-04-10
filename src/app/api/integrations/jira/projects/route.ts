import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { JiraService } from "@/lib/services/jira";

export async function GET() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "jira" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Jira is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new JiraService(creds.domain, creds.email, creds.apiToken);

    const projects = await service.listProjects();

    return apiSuccess({ projects });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch projects";
    return apiError(msg, 500);
  }
}
