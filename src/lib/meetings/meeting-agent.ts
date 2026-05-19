import { prisma } from "@/lib/prisma";
import { RecallAiService } from "@/lib/services/recall-ai";
import type { MeetingAgentConfig } from "@prisma/client";
import type { NormalizedEvent } from "./calendar-providers";
import { processRecording } from "./process-recording";

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
 * Sub-etapa 8.5 delegate.
 *
 * Pre-8.5 this function carried its own copy of the download → transcribe
 * → summarize → insights → knowledge-save pipeline. The whole body was a
 * superset of the Recall webhook's `processRecording`. Sub-etapa 8.5
 * extracted the canonical pipeline to `process-recording.ts` and this
 * function now maps `MeetingAgentConfig` to its options and delegates.
 *
 * Behavior preserved:
 *   - status flipped to PROCESSING up front (caller pre-8.5 contract).
 *   - autoTranscribe / autoSummarize / generateNextSteps /
 *     generateSuggestions taken from the config, NOT defaulted.
 *   - saveToKnowledge: true — the original pipeline always tried
 *     `saveMeetingToKnowledge`; preserved as a non-defaulted option.
 *
 * The `audioUrl` parameter is now redundant (canonical fetches it from
 * the Recall API itself). Kept in the signature to avoid breaking the
 * caller's call site — see `meetings-sync` cron — and prevent the
 * signature change from rippling. Future cleanup can drop it once all
 * callsites are confirmed.
 */
export async function processCompletedMeeting(
  meetingId: string,
  audioUrl: string,
  config: MeetingAgentConfig
): Promise<void> {
  void audioUrl; // canonical resolves audioUrl via RecallAiService.getBot.

  await prisma.meeting.update({
    where: { id: meetingId },
    data: { status: "PROCESSING" },
  });

  await processRecording(meetingId, {
    autoTranscribe: config.autoTranscribe,
    autoSummarize: config.autoSummarize,
    generateNextSteps: config.generateNextSteps,
    generateSuggestions: config.generateSuggestions,
    // Cron-with-agent path always ran knowledge save (best-effort).
    saveToKnowledge: true,
  });
}
