import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

// ─── Save Meeting to Knowledge Base ──────────────────────────────

/**
 * After a meeting is fully processed (transcript + summary + insights),
 * create a KnowledgeAudio record so the meeting data is discoverable
 * alongside other knowledge sources (documents, audios, Plaud imports).
 *
 * Uses sourceIntegration="meeting" + sourceId=meetingId for deduplication.
 */
export async function saveMeetingToKnowledge(meetingId: string): Promise<{
  created: boolean;
  knowledgeAudioId: string | null;
  reason: string;
}> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { participants: true },
  });

  if (!meeting) {
    return { created: false, knowledgeAudioId: null, reason: "Meeting not found" };
  }

  if (!meeting.transcript) {
    return { created: false, knowledgeAudioId: null, reason: "No transcript available" };
  }

  // Check for existing knowledge record (prevent duplicates)
  const existing = await prisma.knowledgeAudio.findUnique({
    where: {
      sourceIntegration_sourceId: {
        sourceIntegration: "meeting",
        sourceId: meetingId,
      },
    },
  });

  if (existing) {
    // Update existing record if meeting was reprocessed
    await prisma.knowledgeAudio.update({
      where: { id: existing.id },
      data: {
        textContent: meeting.transcript,
        metadata: buildMeetingMetadata(meeting),
        processedAt: new Date(),
      },
    });
    return {
      created: false,
      knowledgeAudioId: existing.id,
      reason: "Updated existing knowledge record",
    };
  }

  // Find or create a "Meeting Recordings" folder
  let folder = await prisma.knowledgeFolder.findFirst({
    where: { name: "Meeting Recordings", folderType: "AUDIO" },
  });

  if (!folder) {
    folder = await prisma.knowledgeFolder.create({
      data: {
        name: "Meeting Recordings",
        folderType: "AUDIO",
        description: "Automatically imported from processed meetings",
      },
    });
  }

  // Create the KnowledgeAudio record
  const knowledgeAudio = await prisma.knowledgeAudio.create({
    data: {
      name: meeting.title,
      description: buildDescription(meeting),
      fileType: meeting.audioMimeType === "audio/mp4" ? "M4A" : "MP3",
      fileName: `meeting-${meetingId}.${meeting.audioMimeType === "audio/mp4" ? "m4a" : "mp3"}`,
      fileUrl: meeting.audioFileUrl || "",
      fileSize: meeting.audioFileSize || 0,
      mimeType: meeting.audioMimeType || "audio/mp4",
      duration: meeting.duration || null,
      folderId: folder.id,
      status: "READY",
      textContent: meeting.transcript,
      sourceIntegration: "meeting",
      sourceId: meetingId,
      metadata: buildMeetingMetadata(meeting),
      processedAt: new Date(),
    },
  });

  return {
    created: true,
    knowledgeAudioId: knowledgeAudio.id,
    reason: "Meeting saved to knowledge base",
  };
}

// ─── Cross-Meeting Intelligence ──────────────────────────────────

export interface CrossMeetingInsights {
  recurringTopics: Array<{
    topic: string;
    count: number;
    lastMeeting: { id: string; title: string; date: string };
  }>;
  unresolvedActions: Array<{
    text: string;
    assignee: string | null;
    meetingTitle: string;
    meetingId: string;
    meetingDate: string;
  }>;
  meetingFrequency: {
    total: number;
    last7Days: number;
    last30Days: number;
    avgDurationMinutes: number;
  };
  topParticipants: Array<{
    name: string;
    email: string | null;
    meetingCount: number;
  }>;
}

/**
 * Analyze patterns across all processed meetings.
 * Returns recurring topics, unresolved action items, frequency stats,
 * and top participants.
 */
export async function getCrossMeetingInsights(): Promise<CrossMeetingInsights> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Fetch all processed meetings with participants
  const meetings = await prisma.meeting.findMany({
    where: { status: "READY" },
    include: { participants: true },
    orderBy: { scheduledAt: "desc" },
  });

  // ── Recurring Topics ──
  const topicCounts = new Map<
    string,
    { count: number; lastMeeting: { id: string; title: string; date: string } }
  >();

  for (const meeting of meetings) {
    for (const topic of meeting.keyTopics) {
      // Skip suggestion-prefixed topics (💡)
      if (topic.startsWith("💡")) continue;

      const normalized = topic.toLowerCase().trim();
      const existing = topicCounts.get(normalized);
      if (existing) {
        existing.count++;
      } else {
        topicCounts.set(normalized, {
          count: 1,
          lastMeeting: {
            id: meeting.id,
            title: meeting.title,
            date: (meeting.scheduledAt || meeting.createdAt).toISOString(),
          },
        });
      }
    }
  }

  const recurringTopics = Array.from(topicCounts.entries())
    .filter(([, v]) => v.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .map(([topic, data]) => ({
      topic,
      count: data.count,
      lastMeeting: data.lastMeeting,
    }));

  // ── Unresolved Action Items ──
  const unresolvedActions: CrossMeetingInsights["unresolvedActions"] = [];

  for (const meeting of meetings) {
    if (!meeting.actionItems) continue;
    const items = meeting.actionItems as Array<{
      text: string;
      assignee?: string | null;
      completed?: boolean;
      type?: string;
    }>;

    for (const item of items) {
      if (item.completed) continue;
      if (item.type === "next_step") continue; // next steps tracked separately

      unresolvedActions.push({
        text: item.text,
        assignee: item.assignee || null,
        meetingTitle: meeting.title,
        meetingId: meeting.id,
        meetingDate: (meeting.scheduledAt || meeting.createdAt).toISOString(),
      });
    }
  }

  // ── Meeting Frequency ──
  const last7Days = meetings.filter(
    (m) => (m.scheduledAt || m.createdAt) >= sevenDaysAgo
  ).length;
  const last30Days = meetings.filter(
    (m) => (m.scheduledAt || m.createdAt) >= thirtyDaysAgo
  ).length;

  const durations = meetings
    .filter((m) => m.duration && m.duration > 0)
    .map((m) => m.duration!);
  const avgDurationMinutes =
    durations.length > 0
      ? Math.round(
          durations.reduce((sum, d) => sum + d, 0) / durations.length / 60
        )
      : 0;

  // ── Top Participants ──
  const participantMap = new Map<
    string,
    { name: string; email: string | null; meetingCount: number }
  >();

  for (const meeting of meetings) {
    for (const p of meeting.participants) {
      const key = p.email || p.name;
      const existing = participantMap.get(key);
      if (existing) {
        existing.meetingCount++;
      } else {
        participantMap.set(key, {
          name: p.name,
          email: p.email,
          meetingCount: 1,
        });
      }
    }
  }

  const topParticipants = Array.from(participantMap.values())
    .sort((a, b) => b.meetingCount - a.meetingCount)
    .slice(0, 10);

  return {
    recurringTopics,
    unresolvedActions: unresolvedActions.slice(0, 20),
    meetingFrequency: {
      total: meetings.length,
      last7Days,
      last30Days,
      avgDurationMinutes,
    },
    topParticipants,
  };
}

// ─── Pre-Meeting Briefing ────────────────────────────────────────

/**
 * Generate a pre-meeting briefing for an upcoming meeting by finding
 * past meetings with overlapping attendees.
 */
export async function getPreMeetingBriefing(meetingId: string): Promise<{
  briefing: string;
  pastMeetingCount: number;
  commonAttendees: string[];
}> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { participants: true },
  });

  if (!meeting) throw new Error("Meeting not found");

  const attendeeEmails = meeting.participants
    .filter((p) => p.email)
    .map((p) => p.email!);

  if (attendeeEmails.length === 0) {
    return {
      briefing: "No attendee information available for briefing generation.",
      pastMeetingCount: 0,
      commonAttendees: [],
    };
  }

  // Find past meetings that share attendees
  const pastMeetings = await prisma.meeting.findMany({
    where: {
      id: { not: meetingId },
      status: "READY",
      summary: { not: null },
      participants: {
        some: {
          email: { in: attendeeEmails },
        },
      },
    },
    include: { participants: true },
    orderBy: { scheduledAt: "desc" },
    take: 5,
  });

  if (pastMeetings.length === 0) {
    return {
      briefing: "No previous meetings with these attendees found.",
      pastMeetingCount: 0,
      commonAttendees: attendeeEmails,
    };
  }

  // Build context for the briefing generator
  const pastMeetingContext = pastMeetings.map((pm) => ({
    title: pm.title,
    summary: pm.summary || "",
    actionItems: (
      (pm.actionItems as Array<{ text: string; completed?: boolean }>) || []
    ).map((a) => ({
      text: a.text,
      completed: a.completed,
    })),
    date: (pm.scheduledAt || pm.createdAt).toISOString().split("T")[0],
  }));

  const { generateMeetingBriefing } = await import(
    "@/lib/meetings/meeting-summarizer"
  );

  const briefing = await generateMeetingBriefing(
    meeting.title,
    attendeeEmails,
    pastMeetingContext
  );

  return {
    briefing,
    pastMeetingCount: pastMeetings.length,
    commonAttendees: attendeeEmails,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────

function buildDescription(meeting: {
  platform: string;
  scheduledAt: Date | null;
  participantCount: number | null;
  summary: string | null;
}): string {
  const parts: string[] = [];
  if (meeting.platform) parts.push(`Platform: ${meeting.platform}`);
  if (meeting.scheduledAt) {
    parts.push(`Date: ${meeting.scheduledAt.toISOString().split("T")[0]}`);
  }
  if (meeting.participantCount) {
    parts.push(`Participants: ${meeting.participantCount}`);
  }
  return parts.join(" | ");
}

function buildMeetingMetadata(meeting: {
  id: string;
  summary: string | null;
  actionItems: unknown;
  keyTopics: string[];
  platform: string;
  meetingUrl: string | null;
  scheduledAt: Date | null;
  participantCount: number | null;
  participants: Array<{ name: string; email: string | null }>;
}): Prisma.InputJsonValue {
  return {
    meetingId: meeting.id,
    summary: meeting.summary,
    actionItems: (meeting.actionItems ?? []) as Prisma.InputJsonValue,
    keyTopics: meeting.keyTopics.filter((t) => !t.startsWith("💡")),
    suggestions: meeting.keyTopics
      .filter((t) => t.startsWith("💡"))
      .map((t) => t.replace("💡 ", "")),
    platform: meeting.platform,
    meetingUrl: meeting.meetingUrl,
    scheduledAt: meeting.scheduledAt?.toISOString(),
    participantCount: meeting.participantCount,
    participants: meeting.participants.map((p) => ({
      name: p.name,
      email: p.email,
    })),
  };
}
