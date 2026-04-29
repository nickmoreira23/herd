import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function triggerSummary(r: any): string {
  if (r.triggerType === "MANUAL") return "Manual";
  if (r.triggerType === "SCHEDULE")
    return `Schedule · ${r.cronExpression ?? "?"} (${r.timezone})`;
  if (r.triggerType === "EVENT")
    return `Event · ${r.eventBlock ?? "?"}.${r.eventType ?? "?"}`;
  return r.triggerType;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderRoutine(r: any): string {
  const lines: string[] = [];
  lines.push(`# ${r.name}`);
  lines.push(`Status: ${r.status} · Trigger: ${triggerSummary(r)}`);
  if (r.agent?.name) lines.push(`Agent: ${r.agent.name}`);
  if (r.lastRunAt) {
    const d = r.lastRunAt instanceof Date ? r.lastRunAt : new Date(r.lastRunAt);
    lines.push(`Last run: ${d.toISOString().slice(0, 19)} (${r.lastRunStatus ?? "—"})`);
  }
  if (r.nextRunAt) {
    const d = r.nextRunAt instanceof Date ? r.nextRunAt : new Date(r.nextRunAt);
    lines.push(`Next run: ${d.toISOString().slice(0, 19)}`);
  }
  lines.push(`Runs: ${r.runCount} total · ${r.successCount} ok · ${r.failureCount} failed`);
  if (r.tags?.length) lines.push(`Tags: ${r.tags.join(", ")}`);
  if (r.description) lines.push("", r.description);
  if (r.promptTemplate) lines.push("", "Prompt:", r.promptTemplate);
  return lines.join("\n");
}

export class RoutineProvider implements DataProvider {
  domain = "operations";
  types = ["routine"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const routines = await prisma.routine.findMany({
      include: {
        agent: { select: { id: true, name: true, key: true } },
        _count: { select: { runs: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    return routines.map((r) => {
      const extras = [
        r.status,
        triggerSummary(r),
        r.agent?.name,
        r._count.runs > 0 ? `${r._count.runs} runs` : null,
      ]
        .filter(Boolean)
        .join(" · ");
      return {
        id: `routine:${r.id}`,
        type: "routine",
        domain: this.domain,
        name: r.name,
        description: r.description || r.promptTemplate.slice(0, 160) || null,
        contentLength: r.promptTemplate.length + 200,
        extra: extras || undefined,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    const ids = grouped.routine;
    if (!ids?.length) return [];
    const routines = await prisma.routine.findMany({
      where: { id: { in: ids } },
      include: { agent: { select: { id: true, name: true, key: true } } },
    });
    return routines.map((r) => ({
      id: `routine:${r.id}`,
      type: "routine",
      name: r.name,
      content: truncate(renderRoutine(r)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("routine")) return [];
    const routines = await prisma.routine.findMany({
      where: {
        OR: [
          { name: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { promptTemplate: { contains: keyword, mode: "insensitive" } },
          { contentText: { contains: keyword, mode: "insensitive" } },
          { tags: { has: keyword } },
          { agent: { name: { contains: keyword, mode: "insensitive" } } },
        ],
      },
      include: { agent: { select: { id: true, name: true, key: true } } },
      take,
    });
    return routines.map((r) => ({
      id: `routine:${r.id}`,
      type: "routine",
      name: r.name,
      content: truncate(renderRoutine(r)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const routines = await prisma.routine.findMany({
      where: { id: { in: ids } },
      include: {
        agent: { select: { id: true, name: true, key: true } },
        _count: { select: { runs: true } },
      },
    });
    return routines.map((r) => ({
      id: `routine:${r.id}`,
      type: "routine",
      name: r.name,
      description: r.description || null,
      imageUrl: null,
      category: r.status,
      meta: {
        status: r.status,
        triggerType: r.triggerType,
        cronExpression: r.cronExpression,
        timezone: r.timezone,
        eventBlock: r.eventBlock,
        eventType: r.eventType,
        agentId: r.agentId,
        agentName: r.agent?.name ?? null,
        nextRunAt: r.nextRunAt?.toISOString() ?? null,
        lastRunAt: r.lastRunAt?.toISOString() ?? null,
        lastRunStatus: r.lastRunStatus,
        runCount: r.runCount,
        successCount: r.successCount,
        failureCount: r.failureCount,
        tags: r.tags,
      },
    }));
  }
}
