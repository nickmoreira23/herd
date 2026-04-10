import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { EventDetailClient } from "@/components/events/event-detail-client";
import type { CalendarEventRow } from "@/components/events/types";
import EventDetailLoading from "./loading";

interface EventDetailPageProps {
  params: Promise<{ id: string }>;
}

async function EventContent({ id }: { id: string }) {
  const event = await prisma.calendarEvent.findUnique({
    where: { id },
    include: {
      attendees: true,
      calendarSync: {
        select: {
          id: true,
          calendarName: true,
          calendarColor: true,
          source: true,
          timeZone: true,
        },
      },
    },
  });

  if (!event) notFound();

  const serialized: CalendarEventRow = {
    ...event,
    startAt: event.startAt.toISOString(),
    endAt: event.endAt.toISOString(),
    lastSyncedAt: event.lastSyncedAt.toISOString(),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
    conferenceData: event.conferenceData as unknown,
    attendees: event.attendees.map((a) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    })),
  };

  return <EventDetailClient initialEvent={serialized} />;
}

export default async function EventDetailPage({
  params,
}: EventDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<EventDetailLoading />}>
      <EventContent id={id} />
    </Suspense>
  );
}
