import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderFeedbackContent(f: any): string {
  const lines: string[] = [];

  lines.push(`# ${f.title}`);
  lines.push(`Type: ${f.type} | Status: ${f.status} | Priority: ${f.priority}`);
  lines.push(`Votes: ${f.voteCount}`);

  if (f.submitterName || f.submitterEmail) {
    lines.push(
      `Submitter: ${f.submitterName || ""}${f.submitterEmail ? ` (${f.submitterEmail})` : ""}`
    );
  }
  if (f.source) lines.push(`Source: ${f.source}`);
  if (f.tags && f.tags.length > 0) lines.push(`Tags: ${f.tags.join(", ")}`);
  if (f.entityType && f.entityId) {
    lines.push(`Linked to: ${f.entityType} (${f.entityId})`);
  }
  if (f.resolvedAt) {
    lines.push(`Resolved: ${new Date(f.resolvedAt).toLocaleString()}`);
  }

  if (f.contentText) {
    lines.push("", f.contentText);
  }

  return lines.join("\n");
}

export class FeedbackProvider implements DataProvider {
  domain = "knowledge";
  types = ["feedback"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const feedbacks = await prisma.feedback.findMany({
      where: { status: { notIn: ["DONE", "DECLINED"] } },
      select: {
        id: true,
        title: true,
        contentText: true,
        type: true,
        status: true,
        priority: true,
        voteCount: true,
        submitterName: true,
        entityType: true,
      },
      orderBy: [{ voteCount: "desc" }, { updatedAt: "desc" }],
      take: 200,
    });

    return feedbacks.map((f) => {
      const meta = `${f.type}/${f.status}/${f.priority}`;
      const votes = `${f.voteCount} votes`;
      const sub = f.submitterName ? `from ${f.submitterName}` : null;
      const link = f.entityType ? `linked to ${f.entityType}` : null;
      const extra = [meta, votes, sub, link].filter(Boolean).join(", ");

      return {
        id: `feedback:${f.id}`,
        type: "feedback",
        domain: this.domain,
        name: f.title,
        description: f.contentText.slice(0, 200) || null,
        contentLength: f.contentText.length + 200,
        extra,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.feedback) return [];

    const feedbacks = await prisma.feedback.findMany({
      where: { id: { in: grouped.feedback } },
    });

    return feedbacks.map((f) => ({
      id: `feedback:${f.id}`,
      type: "feedback",
      name: f.title,
      content: truncate(renderFeedbackContent(f)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("feedback")) return [];

    const feedbacks = await prisma.feedback.findMany({
      where: {
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { contentText: { contains: keyword, mode: "insensitive" } },
          { submitterName: { contains: keyword, mode: "insensitive" } },
          { submitterEmail: { contains: keyword, mode: "insensitive" } },
          { tags: { has: keyword } },
        ],
      },
      take,
    });

    return feedbacks.map((f) => ({
      id: `feedback:${f.id}`,
      type: "feedback",
      name: f.title,
      content: truncate(renderFeedbackContent(f)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const feedbacks = await prisma.feedback.findMany({
      where: { id: { in: ids } },
    });

    return feedbacks.map((f) => ({
      id: `feedback:${f.id}`,
      type: "feedback",
      name: f.title,
      description: f.contentText.slice(0, 300) || null,
      status: f.status,
      category: f.type,
      meta: {
        type: f.type,
        priority: f.priority,
        voteCount: f.voteCount,
        source: f.source,
        submitterName: f.submitterName,
        submitterEmail: f.submitterEmail,
        tags: f.tags,
        entityType: f.entityType,
        entityId: f.entityId,
        resolvedAt: f.resolvedAt?.toISOString() ?? null,
      },
    }));
  }
}
