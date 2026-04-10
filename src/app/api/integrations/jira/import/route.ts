import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-utils";
import { decrypt } from "@/lib/encryption";
import { JiraService } from "@/lib/services/jira";
import type { TaskStatus, TaskPriority } from "@prisma/client";

function mapJiraStatus(statusCategoryKey: string): TaskStatus {
  switch (statusCategoryKey) {
    case "new":
      return "TODO";
    case "indeterminate":
      return "IN_PROGRESS";
    case "done":
      return "DONE";
    default:
      return "TODO";
  }
}

function mapJiraPriority(priorityName: string): TaskPriority {
  const lower = priorityName.toLowerCase();
  if (lower === "highest" || lower === "critical") return "URGENT";
  if (lower === "high") return "HIGH";
  if (lower === "medium") return "MEDIUM";
  if (lower === "low" || lower === "lowest") return "LOW";
  return "NONE";
}

export async function POST() {
  try {
    const integration = await prisma.integration.findUnique({
      where: { slug: "jira" },
    });
    if (!integration || integration.status !== "CONNECTED") {
      return apiError("Jira is not connected", 400);
    }

    const creds = JSON.parse(decrypt(integration.credentials!));
    const service = new JiraService(creds.domain, creds.email, creds.apiToken);
    const cleanDomain = creds.domain.replace(/\.atlassian\.net$/i, "");

    let imported = 0;
    let updated = 0;
    let skipped = 0;
    let errors = 0;

    const projects = await service.listProjects();

    for (const project of projects) {
      const jql = `project = ${project.key} ORDER BY updated DESC`;
      const result = await service.searchIssues(jql);

      for (const issue of result.issues) {
        try {
          const status: TaskStatus = mapJiraStatus(
            issue.fields.status.statusCategory.key
          );
          const priority: TaskPriority = mapJiraPriority(
            issue.fields.priority.name
          );
          const sourceUrl = `https://${cleanDomain}.atlassian.net/browse/${issue.key}`;

          const existing = await prisma.task.findUnique({
            where: {
              sourceIntegration_sourceId: {
                sourceIntegration: "jira",
                sourceId: issue.key,
              },
            },
          });

          await prisma.task.upsert({
            where: {
              sourceIntegration_sourceId: {
                sourceIntegration: "jira",
                sourceId: issue.key,
              },
            },
            update: {
              title: issue.fields.summary,
              description: issue.fields.description
                ? JSON.stringify(issue.fields.description)
                : null,
              status,
              priority,
              dueDate: issue.fields.duedate
                ? new Date(issue.fields.duedate)
                : null,
              assignee: issue.fields.assignee?.displayName ?? null,
              assigneeEmail: issue.fields.assignee?.emailAddress ?? null,
              projectName: issue.fields.project.name,
              labels: issue.fields.labels,
              sourceUrl,
              sourceStatus: issue.fields.status.name,
              sourcePriority: issue.fields.priority.name,
              completedAt: status === "DONE" ? new Date() : null,
              updatedAt: new Date(),
            },
            create: {
              title: issue.fields.summary,
              description: issue.fields.description
                ? JSON.stringify(issue.fields.description)
                : null,
              status,
              priority,
              dueDate: issue.fields.duedate
                ? new Date(issue.fields.duedate)
                : null,
              assignee: issue.fields.assignee?.displayName ?? null,
              assigneeEmail: issue.fields.assignee?.emailAddress ?? null,
              projectName: issue.fields.project.name,
              labels: issue.fields.labels,
              sourceIntegration: "jira",
              sourceId: issue.key,
              sourceUrl,
              sourceStatus: issue.fields.status.name,
              sourcePriority: issue.fields.priority.name,
              completedAt: status === "DONE" ? new Date() : null,
            },
          });

          if (existing) {
            updated++;
          } else {
            imported++;
          }
        } catch {
          errors++;
        }
      }
    }

    await prisma.integration.update({
      where: { slug: "jira" },
      data: { lastSyncAt: new Date() },
    });

    return apiSuccess({ imported, updated, skipped, errors });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to import tasks";
    return apiError(msg, 500);
  }
}
