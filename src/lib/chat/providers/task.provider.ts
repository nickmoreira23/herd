import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderTaskContent(t: any): string {
  const lines: string[] = [];

  lines.push(`# Task: ${t.title}`);
  lines.push(`Status: ${t.status} | Priority: ${t.priority}`);

  if (t.dueDate) {
    lines.push(`Due: ${new Date(t.dueDate).toLocaleString()}`);
  }
  if (t.completedAt) {
    lines.push(`Completed: ${new Date(t.completedAt).toLocaleString()}`);
  }

  if (t.assignee || t.assigneeEmail) {
    lines.push(
      `Assignee: ${t.assignee || ""}${t.assigneeEmail ? ` (${t.assigneeEmail})` : ""}`
    );
  }
  if (t.projectName) lines.push(`Project: ${t.projectName}`);
  if (t.labels && t.labels.length > 0) {
    lines.push(`Labels: ${t.labels.join(", ")}`);
  }

  if (t.sourceIntegration) {
    lines.push(
      `Source: ${t.sourceIntegration}${t.sourceUrl ? ` — ${t.sourceUrl}` : ""}`
    );
  }

  if (t.description) {
    lines.push("", "## Description", t.description);
  }

  return lines.join("\n");
}

export class TaskProvider implements DataProvider {
  domain = "operations";
  types = ["task"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const tasks = await prisma.task.findMany({
      where: {
        status: { notIn: ["DONE", "CANCELLED"] },
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        assignee: true,
        projectName: true,
        sourceIntegration: true,
      },
      orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
      take: 200,
    });

    return tasks.map((t) => {
      const due = t.dueDate
        ? `due ${new Date(t.dueDate).toLocaleDateString()}`
        : null;
      const assignee = t.assignee ? `assigned to ${t.assignee}` : null;
      const project = t.projectName ? `project: ${t.projectName}` : null;
      const source = t.sourceIntegration
        ? `via ${t.sourceIntegration}`
        : null;
      const extraParts = [
        `${t.status} / ${t.priority}`,
        due,
        assignee,
        project,
        source,
      ].filter(Boolean);

      return {
        id: `task:${t.id}`,
        type: "task",
        domain: this.domain,
        name: t.title,
        description: t.description,
        contentLength: (t.description?.length || 0) + 200,
        extra: extraParts.join(", "),
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.task) return [];

    const tasks = await prisma.task.findMany({
      where: { id: { in: grouped.task } },
    });

    return tasks.map((t) => ({
      id: `task:${t.id}`,
      type: "task",
      name: t.title,
      content: truncate(renderTaskContent(t)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("task")) return [];

    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { projectName: { contains: keyword, mode: "insensitive" } },
          { assignee: { contains: keyword, mode: "insensitive" } },
          { assigneeEmail: { contains: keyword, mode: "insensitive" } },
          { labels: { has: keyword } },
        ],
      },
      take,
    });

    return tasks.map((t) => ({
      id: `task:${t.id}`,
      type: "task",
      name: t.title,
      content: truncate(renderTaskContent(t)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const tasks = await prisma.task.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        completedAt: true,
        assignee: true,
        assigneeEmail: true,
        projectName: true,
        labels: true,
        sourceIntegration: true,
        sourceUrl: true,
      },
    });

    return tasks.map((t) => ({
      id: `task:${t.id}`,
      type: "task",
      name: t.title,
      description: t.description,
      status: t.status,
      category: t.projectName,
      meta: {
        priority: t.priority,
        dueDate: t.dueDate?.toISOString() ?? null,
        completedAt: t.completedAt?.toISOString() ?? null,
        assignee: t.assignee,
        assigneeEmail: t.assigneeEmail,
        projectName: t.projectName,
        labels: t.labels,
        sourceIntegration: t.sourceIntegration,
        sourceUrl: t.sourceUrl,
      },
    }));
  }
}
