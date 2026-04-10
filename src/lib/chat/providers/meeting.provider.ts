import { prisma } from "@/lib/prisma";
import type { ArtifactMeta, CatalogItem, DataProvider, SearchResult } from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderMeetingContent(m: any): string {
  const lines: string[] = [];

  lines.push(`# Meeting: ${m.title}`);
  if (m.scheduledAt) lines.push(`Date: ${new Date(m.scheduledAt).toLocaleString()}`);
  if (m.duration) lines.push(`Duration: ${Math.round(m.duration / 60)} minutes`);
  lines.push(`Platform: ${m.platform}`);
  if (m.participantCount) lines.push(`Participants: ${m.participantCount}`);

  if (m.description) {
    lines.push("", "## Description", m.description);
  }

  if (m.summary) {
    lines.push("", "## Summary", m.summary);
  }

  if (m.actionItems) {
    lines.push("", "## Action Items");
    try {
      const items = Array.isArray(m.actionItems)
        ? m.actionItems
        : JSON.parse(m.actionItems);
      for (const item of items) {
        const checkbox = item.completed ? "[x]" : "[ ]";
        const assignee = item.assignee ? ` (@${item.assignee})` : "";
        const due = item.dueDate ? ` — due ${item.dueDate}` : "";
        lines.push(`- ${checkbox} ${item.text}${assignee}${due}`);
      }
    } catch {
      lines.push(JSON.stringify(m.actionItems));
    }
  }

  if (m.keyTopics && m.keyTopics.length > 0) {
    lines.push("", "## Key Topics", m.keyTopics.join(", "));
  }

  if (m.participants && m.participants.length > 0) {
    lines.push("", "## Participants");
    for (const p of m.participants) {
      lines.push(`- ${p.name}${p.email ? ` (${p.email})` : ""}${p.role ? ` — ${p.role}` : ""}`);
    }
  }

  if (m.transcript) {
    lines.push("", "## Transcript", truncate(m.transcript));
  }

  return lines.join("\n");
}

export class MeetingProvider implements DataProvider {
  domain = "meetings";
  types = ["meeting"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const meetings = await prisma.meeting.findMany({
      where: { status: "READY" },
      select: {
        id: true,
        title: true,
        description: true,
        duration: true,
        participantCount: true,
        keyTopics: true,
        scheduledAt: true,
      },
      orderBy: { scheduledAt: "desc" },
    });

    return meetings.map((m) => {
      const durationMin = m.duration ? `${Math.round(m.duration / 60)}m` : null;
      const participants = m.participantCount ? `${m.participantCount} participants` : null;
      const topics = m.keyTopics.length > 0 ? m.keyTopics.slice(0, 3).join(", ") : null;
      const extraParts = [durationMin, participants, topics].filter(Boolean);

      return {
        id: `meeting:${m.id}`,
        type: "meeting",
        domain: this.domain,
        name: m.title,
        description: m.description,
        contentLength: (m.description?.length || 0) + 500,
        extra: extraParts.join(", "),
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.meeting) return [];

    const meetings = await prisma.meeting.findMany({
      where: { id: { in: grouped.meeting } },
      include: {
        participants: {
          select: { name: true, email: true, speakerLabel: true, role: true },
        },
      },
    });

    return meetings.map((m) => ({
      id: `meeting:${m.id}`,
      type: "meeting",
      name: m.title,
      content: truncate(renderMeetingContent(m)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("meeting")) return [];

    const meetings = await prisma.meeting.findMany({
      where: {
        status: "READY",
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { transcript: { contains: keyword, mode: "insensitive" } },
          { summary: { contains: keyword, mode: "insensitive" } },
          { keyTopics: { has: keyword } },
        ],
      },
      include: {
        participants: {
          select: { name: true, email: true, speakerLabel: true, role: true },
        },
      },
      take,
    });

    return meetings.map((m) => ({
      id: `meeting:${m.id}`,
      type: "meeting",
      name: m.title,
      content: truncate(renderMeetingContent(m)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const meetings = await prisma.meeting.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        description: true,
        platform: true,
        status: true,
        duration: true,
        participantCount: true,
        scheduledAt: true,
      },
    });

    return meetings.map((m) => ({
      id: `meeting:${m.id}`,
      type: "meeting",
      name: m.title,
      description: m.description,
      status: m.status,
      meta: {
        duration: m.duration,
        platform: m.platform,
        participantCount: m.participantCount,
        date: m.scheduledAt?.toISOString() ?? null,
      },
    }));
  }
}
