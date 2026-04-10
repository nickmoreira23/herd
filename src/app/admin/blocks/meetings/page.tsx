import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { MeetingsListClient } from "@/components/meetings/meetings-list-client";
import type { MeetingRow } from "@/components/meetings/types";
import MeetingsLoading from "./loading";

async function MeetingsContent() {
  const meetings = await prisma.meeting.findMany({
    orderBy: { createdAt: "desc" },
    include: { participants: true },
  });

  const serialized: MeetingRow[] = meetings.map((m) => ({
    ...m,
    scheduledAt: m.scheduledAt?.toISOString() ?? null,
    startedAt: m.startedAt?.toISOString() ?? null,
    endedAt: m.endedAt?.toISOString() ?? null,
    processedAt: m.processedAt?.toISOString() ?? null,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
    actionItems: m.actionItems as MeetingRow["actionItems"],
    participants: m.participants.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  }));

  return <MeetingsListClient initialMeetings={serialized} />;
}

export default function MeetingsPage() {
  return (
    <Suspense fallback={<MeetingsLoading />}>
      <MeetingsContent />
    </Suspense>
  );
}
