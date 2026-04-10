import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { MeetingDetailClient } from "@/components/meetings/meeting-detail-client";
import type { MeetingRow } from "@/components/meetings/types";
import MeetingDetailLoading from "./loading";

interface MeetingDetailPageProps {
  params: Promise<{ id: string }>;
}

async function MeetingContent({ id }: { id: string }) {
  const meeting = await prisma.meeting.findUnique({
    where: { id },
    include: { participants: true },
  });

  if (!meeting) notFound();

  const serialized: MeetingRow = {
    ...meeting,
    scheduledAt: meeting.scheduledAt?.toISOString() ?? null,
    startedAt: meeting.startedAt?.toISOString() ?? null,
    endedAt: meeting.endedAt?.toISOString() ?? null,
    processedAt: meeting.processedAt?.toISOString() ?? null,
    createdAt: meeting.createdAt.toISOString(),
    updatedAt: meeting.updatedAt.toISOString(),
    actionItems: meeting.actionItems as MeetingRow["actionItems"],
    participants: meeting.participants.map((p) => ({
      ...p,
      createdAt: p.createdAt.toISOString(),
    })),
  };

  return <MeetingDetailClient initialMeeting={serialized} />;
}

export default async function MeetingDetailPage({ params }: MeetingDetailPageProps) {
  const { id } = await params;

  return (
    <Suspense fallback={<MeetingDetailLoading />}>
      <MeetingContent id={id} />
    </Suspense>
  );
}
