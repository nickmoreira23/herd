import { Suspense } from "react";
import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventsClient } from "@/components/events/events-client";
import type { CalendarEventRow, CalendarSyncRow, IntegrationRow } from "@/components/events/types";
import EventsLoading from "./loading";

const CALENDAR_INTEGRATION_SLUGS = [
  "google-calendar",
  "microsoft-outlook",
  "zoom",
  "slack",
];

async function EventsContent() {
  await connection();

  const now = new Date();
  const futureLimit = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

  const [events, calendars, integrations] = await Promise.all([
    prisma.calendarEvent.findMany({
      where: {
        startAt: { gte: now },
        endAt: { lte: futureLimit },
        status: { not: "CANCELLED" },
      },
      include: {
        attendees: true,
        calendarSync: {
          select: {
            id: true,
            calendarName: true,
            calendarColor: true,
            source: true,
          },
        },
      },
      orderBy: { startAt: "asc" },
      take: 200,
    }),
    prisma.calendarEventSync.findMany({
      orderBy: { calendarName: "asc" },
      include: { _count: { select: { events: true } } },
    }),
    prisma.integration.findMany({
      where: { slug: { in: CALENDAR_INTEGRATION_SLUGS } },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedEvents: CalendarEventRow[] = events.map((e) => ({
    ...e,
    startAt: e.startAt.toISOString(),
    endAt: e.endAt.toISOString(),
    lastSyncedAt: e.lastSyncedAt.toISOString(),
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
    conferenceData: e.conferenceData as unknown,
    attendees: e.attendees.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  }));

  const serializedCalendars: CalendarSyncRow[] = calendars.map((c) => ({
    ...c,
    eventCount: c._count.events,
    _count: undefined as never,
    lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }));

  const serializedIntegrations: IntegrationRow[] = integrations.map((i) => ({
    id: i.id,
    slug: i.slug,
    name: i.name,
    description: i.description,
    logoUrl: i.logoUrl,
    status: i.status as IntegrationRow["status"],
    category: i.category,
  }));

  return (
    <EventsClient
      initialEvents={serializedEvents}
      initialCalendars={serializedCalendars}
      initialIntegrations={serializedIntegrations}
    />
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={<EventsLoading />}>
      <EventsContent />
    </Suspense>
  );
}
