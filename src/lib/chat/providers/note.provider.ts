import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderNoteContent(n: any): string {
  const lines: string[] = [];

  lines.push(`# ${n.title}`);

  if (n.tags && n.tags.length > 0) {
    lines.push(`Tags: ${n.tags.join(", ")}`);
  }
  if (n.pinned) lines.push(`Pinned: yes`);
  if (n.archived) lines.push(`Archived: yes`);
  if (n.entityType && n.entityId) {
    lines.push(`Linked to: ${n.entityType} (${n.entityId})`);
  }

  if (n.contentText) {
    lines.push("", n.contentText);
  }

  return lines.join("\n");
}

export class NoteProvider implements DataProvider {
  domain = "knowledge";
  types = ["note"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const notes = await prisma.note.findMany({
      where: { archived: false },
      select: {
        id: true,
        title: true,
        contentText: true,
        tags: true,
        pinned: true,
        entityType: true,
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: 200,
    });

    return notes.map((n) => {
      const tags = n.tags.length > 0 ? `tags: ${n.tags.join(", ")}` : null;
      const pin = n.pinned ? "pinned" : null;
      const link = n.entityType ? `linked to ${n.entityType}` : null;
      const extra = [pin, tags, link].filter(Boolean).join(", ");

      return {
        id: `note:${n.id}`,
        type: "note",
        domain: this.domain,
        name: n.title,
        description: n.contentText.slice(0, 200) || null,
        contentLength: n.contentText.length + 100,
        extra: extra || undefined,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.note) return [];

    const notes = await prisma.note.findMany({
      where: { id: { in: grouped.note } },
    });

    return notes.map((n) => ({
      id: `note:${n.id}`,
      type: "note",
      name: n.title,
      content: truncate(renderNoteContent(n)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("note")) return [];

    const notes = await prisma.note.findMany({
      where: {
        archived: false,
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { contentText: { contains: keyword, mode: "insensitive" } },
          { tags: { has: keyword } },
        ],
      },
      take,
    });

    return notes.map((n) => ({
      id: `note:${n.id}`,
      type: "note",
      name: n.title,
      content: truncate(renderNoteContent(n)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const notes = await prisma.note.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        contentText: true,
        tags: true,
        pinned: true,
        archived: true,
        entityType: true,
        entityId: true,
        updatedAt: true,
      },
    });

    return notes.map((n) => ({
      id: `note:${n.id}`,
      type: "note",
      name: n.title,
      description: n.contentText.slice(0, 300),
      status: n.archived ? "archived" : n.pinned ? "pinned" : "active",
      meta: {
        tags: n.tags,
        pinned: n.pinned,
        archived: n.archived,
        entityType: n.entityType,
        entityId: n.entityId,
        updatedAt: n.updatedAt.toISOString(),
      },
    }));
  }
}
