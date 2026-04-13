import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";
import { format } from "date-fns";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderThreadContent(thread: any): string {
  const lines: string[] = [];

  lines.push(`# Thread: ${thread.subject || "(no subject)"}`);
  lines.push(
    `Channel: ${thread.channel?.channelType || "UNKNOWN"} | Status: ${thread.status}`
  );

  if (thread.contact) {
    lines.push(
      `Contact: ${thread.contact.firstName} ${thread.contact.lastName}`
    );
  }

  if (thread.priority > 0) {
    lines.push(`Priority: ${thread.priority === 2 ? "Urgent" : "High"}`);
  }

  if (thread.tags && thread.tags.length > 0) {
    lines.push(`Tags: ${thread.tags.join(", ")}`);
  }

  lines.push("---");

  if (thread.messages && thread.messages.length > 0) {
    for (const msg of thread.messages) {
      const timestamp = format(new Date(msg.sentAt), "yyyy-MM-dd HH:mm");
      const direction = msg.direction === "OUTBOUND" ? "OUTBOUND" : "INBOUND";
      const sender = msg.senderName || (direction === "OUTBOUND" ? "Team" : "Contact");
      lines.push(`[${timestamp}] [${direction}] ${sender}:`);
      lines.push(msg.content);
      lines.push("");
    }
  }

  return lines.join("\n");
}

export class MessageProvider implements DataProvider {
  domain = "operations";
  types = ["message_thread", "message"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    const threads = await prisma.messageThread.findMany({
      where: { status: { in: ["OPEN", "SNOOZED"] } },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        channel: { select: { channelType: true } },
        contact: { select: { firstName: true, lastName: true } },
        _count: { select: { messages: true } },
      },
      orderBy: { lastMessageAt: "desc" },
      take: 200,
    });

    return threads.map((t) => {
      const contactName = t.contact
        ? `${t.contact.firstName} ${t.contact.lastName}`
        : "Unknown";
      return {
        id: `message_thread:${t.id}`,
        type: "message_thread",
        domain: this.domain,
        name: t.subject || `Thread with ${contactName}`,
        description: `${t.channel.channelType} conversation — ${t.status.toLowerCase()}`,
        contentLength: t._count.messages * 200, // estimate
        extra: `channel: ${t.channel.channelType}, contact: ${contactName}, ${t._count.messages} msgs`,
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    const ids = grouped.message_thread || [];
    if (ids.length === 0) return [];

    const threads = await prisma.messageThread.findMany({
      where: { id: { in: ids } },
      include: {
        channel: { select: { channelType: true, name: true } },
        contact: { select: { firstName: true, lastName: true } },
        messages: { orderBy: { sentAt: "asc" } },
      },
    });

    return threads.map((t) => ({
      id: `message_thread:${t.id}`,
      type: "message_thread",
      name: t.subject || `Thread ${t.id.slice(0, 8)}`,
      content: truncate(renderThreadContent(t)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (
      types.length > 0 &&
      !types.includes("message_thread") &&
      !types.includes("message")
    )
      return [];

    const threads = await prisma.messageThread.findMany({
      where: {
        OR: [
          { subject: { contains: keyword, mode: "insensitive" } },
          {
            messages: {
              some: { content: { contains: keyword, mode: "insensitive" } },
            },
          },
          {
            contact: {
              OR: [
                { firstName: { contains: keyword, mode: "insensitive" } },
                { lastName: { contains: keyword, mode: "insensitive" } },
              ],
            },
          },
        ],
      },
      include: {
        channel: { select: { channelType: true, name: true } },
        contact: { select: { firstName: true, lastName: true } },
        messages: { orderBy: { sentAt: "asc" } },
      },
      take,
    });

    return threads.map((t) => ({
      id: `message_thread:${t.id}`,
      type: "message_thread",
      name: t.subject || `Thread ${t.id.slice(0, 8)}`,
      content: truncate(renderThreadContent(t)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const threads = await prisma.messageThread.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        tags: true,
        channel: { select: { channelType: true } },
        contact: { select: { firstName: true, lastName: true } },
        _count: { select: { messages: true } },
        lastMessageAt: true,
      },
    });

    return threads.map((t) => {
      const contactName = t.contact
        ? `${t.contact.firstName} ${t.contact.lastName}`
        : undefined;
      return {
        id: `message_thread:${t.id}`,
        type: "message_thread",
        name: t.subject || `Thread with ${contactName || "Unknown"}`,
        description: `${t.channel.channelType} conversation`,
        status: t.status,
        category: t.channel.channelType,
        meta: {
          channelType: t.channel.channelType,
          contact: contactName,
          priority: t.priority,
          messageCount: t._count.messages,
          tags: t.tags,
          lastMessageAt: t.lastMessageAt,
        },
      };
    });
  }
}
