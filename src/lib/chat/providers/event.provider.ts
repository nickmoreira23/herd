import { prisma } from "@/lib/prisma";
import type {
  ArtifactMeta,
  CatalogItem,
  DataProvider,
  SearchResult,
} from "../types";
import { truncate } from "../types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderEventContent(e: any): string {
  const lines: string[] = [];

  lines.push(`# Event: ${e.title}`);

  const startDate = new Date(e.startAt);
  const endDate = new Date(e.endAt);

  if (e.isAllDay) {
    lines.push(`Date: ${startDate.toLocaleDateString()} (all day)`);
  } else {
    lines.push(
      `Date: ${startDate.toLocaleString()} – ${endDate.toLocaleString()}`
    );
  }

  if (e.calendarSync?.calendarName) {
    lines.push(`Calendar: ${e.calendarSync.calendarName}`);
  }
  lines.push(`Status: ${e.status}`);
  if (e.location) lines.push(`Location: ${e.location}`);
  if (e.meetingUrl) lines.push(`Meeting Link: ${e.meetingUrl}`);
  if (e.htmlLink) lines.push(`Calendar Link: ${e.htmlLink}`);

  if (e.organizerName || e.organizerEmail) {
    lines.push(
      `Organizer: ${e.organizerName || ""}${e.organizerEmail ? ` (${e.organizerEmail})` : ""}`
    );
  }

  if (e.description) {
    lines.push("", "## Description", e.description);
  }

  if (e.attendees && e.attendees.length > 0) {
    lines.push("", "## Attendees");
    for (const a of e.attendees) {
      const name = a.displayName || a.email;
      const status = a.responseStatus || "unknown";
      const role = a.isOrganizer ? " (organizer)" : "";
      lines.push(`- ${name} (${a.email}) — ${status}${role}`);
    }
  }

  return lines.join("\n");
}

export class EventProvider implements DataProvider {
  domain = "events";
  types = ["event"];

  async getCatalogItems(): Promise<CatalogItem[]> {
    // Include recent past events (7 days) and all future synced events
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const events = await prisma.calendarEvent.findMany({
      where: {
        startAt: { gte: cutoff },
        syncStatus: "SYNCED",
        status: { not: "CANCELLED" },
      },
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        isAllDay: true,
        location: true,
        calendarSync: {
          select: { calendarName: true },
        },
        _count: { select: { attendees: true } },
      },
      orderBy: { startAt: "asc" },
    });

    return events.map((e) => {
      const date = e.startAt.toLocaleDateString();
      const time = e.isAllDay
        ? "all day"
        : e.startAt.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
          });
      const cal = e.calendarSync?.calendarName || "Calendar";
      const attendees =
        e._count.attendees > 0 ? `${e._count.attendees} attendees` : null;
      const loc = e.location ? `at ${e.location}` : null;
      const extraParts = [
        `${date} ${time}`,
        cal,
        attendees,
        loc,
      ].filter(Boolean);

      return {
        id: `event:${e.id}`,
        type: "event",
        domain: this.domain,
        name: e.title,
        description: e.description,
        contentLength: (e.description?.length || 0) + 300,
        extra: extraParts.join(", "),
      };
    });
  }

  async fetchByIds(
    grouped: Record<string, string[]>
  ): Promise<SearchResult[]> {
    if (!grouped.event) return [];

    const events = await prisma.calendarEvent.findMany({
      where: { id: { in: grouped.event } },
      include: {
        attendees: true,
        calendarSync: {
          select: { calendarName: true, source: true },
        },
      },
    });

    return events.map((e) => ({
      id: `event:${e.id}`,
      type: "event",
      name: e.title,
      content: truncate(renderEventContent(e)),
    }));
  }

  async searchByKeyword(
    keyword: string,
    types: string[],
    take: number
  ): Promise<SearchResult[]> {
    if (types.length > 0 && !types.includes("event")) return [];

    // Search event fields
    const events = await prisma.calendarEvent.findMany({
      where: {
        syncStatus: "SYNCED",
        status: { not: "CANCELLED" },
        OR: [
          { title: { contains: keyword, mode: "insensitive" } },
          { description: { contains: keyword, mode: "insensitive" } },
          { location: { contains: keyword, mode: "insensitive" } },
          { organizerName: { contains: keyword, mode: "insensitive" } },
          { organizerEmail: { contains: keyword, mode: "insensitive" } },
        ],
      },
      include: {
        attendees: true,
        calendarSync: {
          select: { calendarName: true, source: true },
        },
      },
      take,
    });

    // Also search by attendee name/email
    const attendeeMatches = await prisma.calendarEventAttendee.findMany({
      where: {
        OR: [
          { email: { contains: keyword, mode: "insensitive" } },
          { displayName: { contains: keyword, mode: "insensitive" } },
        ],
        event: {
          syncStatus: "SYNCED",
          status: { not: "CANCELLED" },
        },
      },
      select: { eventId: true },
      take,
    });

    const attendeeEventIds = attendeeMatches
      .map((a) => a.eventId)
      .filter((id) => !events.some((e) => e.id === id));

    let attendeeEvents: typeof events = [];
    if (attendeeEventIds.length > 0) {
      attendeeEvents = await prisma.calendarEvent.findMany({
        where: { id: { in: attendeeEventIds } },
        include: {
          attendees: true,
          calendarSync: {
            select: { calendarName: true, source: true },
          },
        },
        take: Math.max(0, take - events.length),
      });
    }

    const allEvents = [...events, ...attendeeEvents];

    return allEvents.map((e) => ({
      id: `event:${e.id}`,
      type: "event",
      name: e.title,
      content: truncate(renderEventContent(e)),
    }));
  }

  async getArtifactMeta(ids: string[]): Promise<ArtifactMeta[]> {
    const events = await prisma.calendarEvent.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        title: true,
        description: true,
        startAt: true,
        endAt: true,
        isAllDay: true,
        status: true,
        location: true,
        calendarSync: {
          select: { calendarName: true, calendarColor: true },
        },
        _count: { select: { attendees: true } },
      },
    });

    return events.map((e) => ({
      id: `event:${e.id}`,
      type: "event",
      name: e.title,
      description: e.description,
      status: e.status,
      category: e.calendarSync?.calendarName || null,
      meta: {
        startAt: e.startAt.toISOString(),
        endAt: e.endAt.toISOString(),
        isAllDay: e.isAllDay,
        location: e.location,
        calendarName: e.calendarSync?.calendarName || null,
        calendarColor: e.calendarSync?.calendarColor || null,
        attendeeCount: e._count.attendees,
      },
    }));
  }
}
