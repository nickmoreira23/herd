import { prisma } from "@/lib/prisma";
import { RecallAiService } from "@/lib/services/recall-ai";
import type { MeetingAgentConfig, Prisma } from "@prisma/client";
import type { NormalizedEvent } from "./calendar-providers";

// ─── Agent Config Management ──────────────────────────────────────

/**
 * Get the meeting agent configuration. Creates a default if none exists.
 */
export async function getAgentConfig(): Promise<MeetingAgentConfig> {
  const config = await prisma.meetingAgentConfig.findFirst();
  if (config) return config;

  // Create default config
  return prisma.meetingAgentConfig.create({ data: {} });
}

/**
 * Update the meeting agent configuration.
 */
export async function updateAgentConfig(
  data: Partial<Omit<MeetingAgentConfig, "id" | "createdAt" | "updatedAt">>
): Promise<MeetingAgentConfig> {
  const config = await getAgentConfig();
  return prisma.meetingAgentConfig.update({
    where: { id: config.id },
    data,
  });
}

// ─── Decision Engine ──────────────────────────────────────────────

export interface JoinDecision {
  shouldJoin: boolean;
  reason: string;
}

/**
 * Determine whether the agent should join a given meeting.
 * Evaluates the meeting against all filtering rules in the agent config.
 */
export function shouldJoinMeeting(
  event: NormalizedEvent,
  config: MeetingAgentConfig
): JoinDecision {
  // Agent must be enabled
  if (!config.isEnabled) {
    return { shouldJoin: false, reason: "Meeting agent is disabled" };
  }

  // Auto-join must be enabled
  if (!config.autoJoin) {
    return { shouldJoin: false, reason: "Auto-join is disabled" };
  }

  // Must be an online meeting
  if (!event.isOnlineMeeting || !event.meetingUrl) {
    return { shouldJoin: false, reason: "Not an online meeting" };
  }

  // Platform filter
  if (config.includePlatforms.length > 0) {
    if (!config.includePlatforms.includes(event.platform)) {
      return {
        shouldJoin: false,
        reason: `Platform ${event.platform} is not in allowed list`,
      };
    }
  }

  // Minimum attendees check
  if (config.minimumAttendees > 0) {
    if (event.attendees.length < config.minimumAttendees) {
      return {
        shouldJoin: false,
        reason: `Only ${event.attendees.length} attendee(s), minimum is ${config.minimumAttendees}`,
      };
    }
  }

  // Exclude keywords — skip meetings whose title contains any excluded word
  if (config.excludeKeywords.length > 0) {
    const titleLower = event.title.toLowerCase();
    for (const keyword of config.excludeKeywords) {
      if (titleLower.includes(keyword.toLowerCase())) {
        return {
          shouldJoin: false,
          reason: `Title contains excluded keyword: "${keyword}"`,
        };
      }
    }
  }

  // Include keywords — if set, the title must contain at least one
  if (config.includeKeywords.length > 0) {
    const titleLower = event.title.toLowerCase();
    const hasMatch = config.includeKeywords.some((kw) =>
      titleLower.includes(kw.toLowerCase())
    );
    if (!hasMatch) {
      return {
        shouldJoin: false,
        reason: "Title does not match any include keywords",
      };
    }
  }

  // If joinAllMeetings is false and no include keywords matched, skip
  if (!config.joinAllMeetings && config.includeKeywords.length === 0) {
    return {
      shouldJoin: false,
      reason: "joinAllMeetings is off and no include keywords configured",
    };
  }

  return { shouldJoin: true, reason: "All filters passed" };
}

// ─── Bot Deployment ───────────────────────────────────────────────

/**
 * Deploy a Recall.ai bot for a meeting using the agent's configuration.
 */
export async function deployBotForMeeting(
  meetingId: string,
  meetingUrl: string,
  scheduledAt: string,
  config: MeetingAgentConfig
): Promise<string | null> {
  const recallService = await RecallAiService.fromIntegration();
  if (!recallService) return null;

  // Calculate join time (X minutes before)
  const joinTime = new Date(
    new Date(scheduledAt).getTime() - config.joinMinutesBefore * 60000
  ).toISOString();

  try {
    const bot = await recallService.createBot({
      meeting_url: meetingUrl,
      bot_name: config.botName,
      join_at: joinTime,
      recording_mode: config.recordingMode as "audio_only" | "speaker_view" | "gallery_view",
      automatic_leave: {
        waiting_room_timeout: 600,
        noone_joined_timeout: 300,
        everyone_left_timeout: 30,
      },
    });

    await prisma.meeting.update({
      where: { id: meetingId },
      data: { externalBotId: bot.id },
    });

    return bot.id;
  } catch (err) {
    console.error(`Agent failed to deploy bot for meeting ${meetingId}:`, err);
    return null;
  }
}

// ─── Post-Meeting Pipeline ────────────────────────────────────────

/**
 * Run the full post-meeting processing pipeline:
 * 1. Download audio from Recall.ai
 * 2. Transcribe via Deepgram
 * 3. Summarize via Claude
 * 4. Generate next steps + suggestions (if enabled)
 */
export async function processCompletedMeeting(
  meetingId: string,
  audioUrl: string,
  config: MeetingAgentConfig
): Promise<void> {
  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: "PROCESSING" },
  });

  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
  });
  if (!meeting) return;

  try {
    // 1. Download audio
    const audioRes = await fetch(audioUrl);
    if (!audioRes.ok) throw new Error("Failed to download audio");

    const buffer = Buffer.from(await audioRes.arrayBuffer());
    const { writeFile, unlink } = await import("fs/promises");
    const { join } = await import("path");
    const { tmpdir } = await import("os");
    const tmpPath = join(tmpdir(), `recall-${meeting.externalBotId || meetingId}.mp4`);
    await writeFile(tmpPath, buffer);

    // 2. Transcribe
    let transcriptText = "";
    if (config.autoTranscribe) {
      const { transcribeAudio } = await import("@/lib/knowledge/audio-transcriber");
      transcriptText = await transcribeAudio(tmpPath);
    }

    // Clean up temp file
    await unlink(tmpPath).catch(() => {});

    // Calculate duration
    const duration =
      meeting.startedAt && meeting.endedAt
        ? (meeting.endedAt.getTime() - meeting.startedAt.getTime()) / 1000
        : null;

    // Update with transcript
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        transcript: transcriptText || null,
        chunkCount: transcriptText ? Math.ceil(transcriptText.length / 1000) : 0,
        audioFileUrl: audioUrl,
        audioMimeType: "audio/mp4",
        duration,
        status: "READY",
        processedAt: new Date(),
      },
    });

    // 3. Summarize
    if (config.autoSummarize && transcriptText) {
      try {
        const { summarizeMeeting } = await import("@/lib/meetings/meeting-summarizer");
        const summary = await summarizeMeeting(transcriptText, meeting.title);
        await prisma.meeting.update({
          where: { id: meetingId },
          data: {
            summary: summary.summary,
            actionItems: summary.actionItems,
            keyTopics: summary.keyTopics,
          },
        });

        // 4. Generate next steps and suggestions (if enabled)
        if (config.generateNextSteps || config.generateSuggestions) {
          try {
            const { generateMeetingInsights } = await import(
              "@/lib/meetings/meeting-summarizer"
            );
            const insights = await generateMeetingInsights(
              transcriptText,
              summary.summary,
              meeting.title,
              {
                generateNextSteps: config.generateNextSteps,
                generateSuggestions: config.generateSuggestions,
              }
            );

            // Store insights as part of actionItems metadata
            const existingActions = (summary.actionItems || []) as Array<Record<string, unknown>>;
            if (insights.nextSteps?.length) {
              for (const step of insights.nextSteps) {
                existingActions.push({
                  text: step,
                  assignee: null,
                  dueDate: null,
                  completed: false,
                  type: "next_step",
                });
              }
            }

            await prisma.meeting.update({
              where: { id: meetingId },
              data: {
                actionItems: existingActions as Prisma.InputJsonValue,
                // Store suggestions as a JSON metadata field on keyTopics
                keyTopics: [
                  ...summary.keyTopics,
                  ...(insights.suggestions || []).map(
                    (s: string) => `💡 ${s}`
                  ),
                ],
              },
            });
          } catch {
            // Insights are optional, don't fail the pipeline
          }
        }
      } catch {
        // Summary is optional
      }
    }

    // 5. Save to knowledge base (best-effort)
    try {
      const { saveMeetingToKnowledge } = await import(
        "@/lib/meetings/meeting-knowledge"
      );
      await saveMeetingToKnowledge(meetingId);
    } catch {
      // Knowledge pipeline is optional, don't fail the main pipeline
    }
  } catch (err) {
    console.error(`Agent pipeline failed for meeting ${meetingId}:`, err);
    await prisma.meeting.update({
      where: { id: meetingId },
      data: {
        status: "ERROR",
        errorMessage: err instanceof Error ? err.message : "Processing failed",
      },
    });
  }
}
