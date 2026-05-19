import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

/**
 * Sub-etapa 8.5 — canonical `processRecording` integration tests.
 *
 * Verifies idempotency by step (transcribe skipped if transcript present;
 * summarize skipped if summary present), `summaryError` semantics, and
 * fatal-failure handling.
 *
 * The 3 external services (Recall API, Deepgram, Anthropic) are mocked at
 * module level. Prisma + DB are real — Meeting state changes are what we
 * assert on. Mocks survive `vi.resetAllMocks()` for the function bodies
 * because vi.mock substitutes the entire module.
 */

// ─── Mocks (module-level — fire before any dynamic import resolves) ──

vi.mock("@/lib/services/recall-ai", () => ({
  RecallAiService: {
    fromIntegration: vi.fn(),
  },
}));

vi.mock("@/lib/audios/audio-transcriber", () => ({
  transcribeAudio: vi.fn(),
}));

vi.mock("@/lib/meetings/meeting-summarizer", () => ({
  summarizeMeeting: vi.fn(),
  generateMeetingInsights: vi.fn(),
}));

vi.mock("@/lib/meetings/meeting-knowledge", () => ({
  saveMeetingToKnowledge: vi.fn(),
}));

// Audio fetch — replaces global fetch in the transcribe stage.
const originalFetch = global.fetch;

import { processRecording } from "../process-recording";
import { RecallAiService } from "@/lib/services/recall-ai";
import { transcribeAudio } from "@/lib/audios/audio-transcriber";
import {
  summarizeMeeting,
  generateMeetingInsights,
} from "@/lib/meetings/meeting-summarizer";
import { saveMeetingToKnowledge } from "@/lib/meetings/meeting-knowledge";

const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error("DATABASE_URL required");
const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });

const TEST_PREFIX = `test-procrec-${Date.now()}`;
let meetingId: string;

async function seedMeeting(overrides: Record<string, unknown> = {}): Promise<string> {
  const m = await adminClient.meeting.create({
    data: {
      title: `${TEST_PREFIX}-meeting`,
      meetingType: "VIRTUAL",
      platform: "GOOGLE_MEET",
      status: "PROCESSING",
      externalBotId: `bot-${TEST_PREFIX}`,
      ...overrides,
    },
    select: { id: true },
  });
  return m.id;
}

async function cleanupAllSeeded() {
  await adminClient.meeting.deleteMany({
    where: { title: { startsWith: TEST_PREFIX } },
  });
}

// Build a minimal stubbed RecallAiService — only what processRecording calls.
function stubRecallService(audioUrl: string | null) {
  return {
    getBot: vi.fn().mockResolvedValue({
      audio_url: audioUrl,
      status_changes: [],
    }),
  };
}

beforeEach(async () => {
  vi.mocked(RecallAiService.fromIntegration).mockReset();
  vi.mocked(transcribeAudio).mockReset();
  vi.mocked(summarizeMeeting).mockReset();
  vi.mocked(generateMeetingInsights).mockReset();
  vi.mocked(saveMeetingToKnowledge).mockReset();

  // Default audio fetch — small valid buffer so writeFile/transcribe succeed.
  // Tests that need a different fetch behavior override `global.fetch`.
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
    status: 200,
  }) as unknown as typeof fetch;
});

afterAll(async () => {
  global.fetch = originalFetch;
  await cleanupAllSeeded();
  await adminClient.$disconnect();
});

describe("processRecording — idempotency", () => {
  it("transcript already present: skips RecallAiService + transcribe, still summarizes", async () => {
    meetingId = await seedMeeting({
      transcript: "pre-existing transcript text",
      status: "READY",
    });

    vi.mocked(summarizeMeeting).mockResolvedValue({
      summary: "test summary",
      actionItems: [],
      keyTopics: ["topic-a"],
    });

    await processRecording(meetingId);

    // Idempotency: transcribe stage entirely skipped — RecallAiService.fromIntegration
    // is only invoked from inside the transcribe branch.
    expect(RecallAiService.fromIntegration).not.toHaveBeenCalled();
    expect(transcribeAudio).not.toHaveBeenCalled();
    expect(summarizeMeeting).toHaveBeenCalledOnce();

    const m = await adminClient.meeting.findUnique({ where: { id: meetingId } });
    expect(m?.summary).toBe("test summary");
    expect(m?.transcript).toBe("pre-existing transcript text");
  });

  it("summary already present: skips Anthropic; idempotent no-op on summarize", async () => {
    meetingId = await seedMeeting({
      transcript: "transcript",
      summary: "pre-existing summary",
      status: "READY",
    });

    await processRecording(meetingId);

    expect(transcribeAudio).not.toHaveBeenCalled();
    expect(summarizeMeeting).not.toHaveBeenCalled();
  });

  it("both transcript and summary present: completely no-op (zero external calls)", async () => {
    meetingId = await seedMeeting({
      transcript: "transcript",
      summary: "summary",
      status: "READY",
    });

    await processRecording(meetingId);

    expect(RecallAiService.fromIntegration).not.toHaveBeenCalled();
    expect(transcribeAudio).not.toHaveBeenCalled();
    expect(summarizeMeeting).not.toHaveBeenCalled();
    expect(saveMeetingToKnowledge).not.toHaveBeenCalled();
  });
});

describe("processRecording — partial vs fatal failures", () => {
  it("summarize fails: summaryError populated, status stays READY", async () => {
    meetingId = await seedMeeting({
      transcript: "long transcript",
      status: "READY",
    });

    vi.mocked(summarizeMeeting).mockRejectedValue(new Error("Anthropic 503"));

    await processRecording(meetingId);

    const m = await adminClient.meeting.findUnique({ where: { id: meetingId } });
    expect(m?.status).toBe("READY");
    expect(m?.summaryError).toBe("Anthropic 503");
    expect(m?.errorMessage).toBeNull();
  });

  it("transcribe-stage fatal failure: status ERROR + errorMessage", async () => {
    meetingId = await seedMeeting();

    vi.mocked(RecallAiService.fromIntegration).mockResolvedValue(
      stubRecallService("https://recall.example/audio.mp4") as never,
    );
    vi.mocked(transcribeAudio).mockRejectedValue(new Error("Deepgram timeout"));

    await processRecording(meetingId);

    const m = await adminClient.meeting.findUnique({ where: { id: meetingId } });
    expect(m?.status).toBe("ERROR");
    expect(m?.errorMessage).toBe("Deepgram timeout");
  });

  it("happy path: transcribe + summarize succeed, summaryError stays null", async () => {
    meetingId = await seedMeeting();

    vi.mocked(RecallAiService.fromIntegration).mockResolvedValue(
      stubRecallService("https://recall.example/audio.mp4") as never,
    );
    vi.mocked(transcribeAudio).mockResolvedValue("happy transcript content");
    vi.mocked(summarizeMeeting).mockResolvedValue({
      summary: "happy summary",
      actionItems: [{ text: "do thing", completed: false }],
      keyTopics: ["alpha", "beta"],
    });

    await processRecording(meetingId);

    const m = await adminClient.meeting.findUnique({ where: { id: meetingId } });
    expect(m?.status).toBe("READY");
    expect(m?.transcript).toBe("happy transcript content");
    expect(m?.summary).toBe("happy summary");
    expect(m?.errorMessage).toBeNull();
    expect(m?.summaryError).toBeNull();
  });

  it("missing externalBotId: returns silently without touching the Meeting", async () => {
    meetingId = await seedMeeting({ externalBotId: null });

    await processRecording(meetingId);

    expect(RecallAiService.fromIntegration).not.toHaveBeenCalled();
    const m = await adminClient.meeting.findUnique({ where: { id: meetingId } });
    // No status flip, no error populated — function exits early with a log.
    expect(m?.status).toBe("PROCESSING");
    expect(m?.errorMessage).toBeNull();
  });
});

describe("processRecording — options propagation (delegate smoke)", () => {
  it("saveToKnowledge: true triggers the knowledge save", async () => {
    meetingId = await seedMeeting({
      transcript: "t",
      summary: "s",
      status: "READY",
    });

    vi.mocked(saveMeetingToKnowledge).mockResolvedValue({
      created: true,
      knowledgeAudioId: "fake-knowledge-id",
      reason: "ok",
    });

    await processRecording(meetingId, { saveToKnowledge: true });

    expect(saveMeetingToKnowledge).toHaveBeenCalledWith(meetingId);
  });

  it("saveToKnowledge: false (default) does NOT call knowledge save", async () => {
    meetingId = await seedMeeting({
      transcript: "t",
      summary: "s",
      status: "READY",
    });

    await processRecording(meetingId);

    expect(saveMeetingToKnowledge).not.toHaveBeenCalled();
  });

  it("generateNextSteps + generateSuggestions: insights merged into actionItems + keyTopics", async () => {
    meetingId = await seedMeeting({
      transcript: "transcript",
      status: "READY",
    });

    vi.mocked(summarizeMeeting).mockResolvedValue({
      summary: "summary",
      actionItems: [{ text: "base action", completed: false }],
      keyTopics: ["base-topic"],
    });
    vi.mocked(generateMeetingInsights).mockResolvedValue({
      nextSteps: ["follow-up call"],
      suggestions: ["consider X"],
    });

    await processRecording(meetingId, {
      generateNextSteps: true,
      generateSuggestions: true,
    });

    expect(generateMeetingInsights).toHaveBeenCalledOnce();
    const m = await adminClient.meeting.findUnique({ where: { id: meetingId } });
    expect(m?.keyTopics).toContain("base-topic");
    expect(m?.keyTopics).toContain("💡 consider X");
    const items = m?.actionItems as Array<Record<string, unknown>>;
    expect(items.some((i) => i.text === "follow-up call")).toBe(true);
  });

  it("autoTranscribe: false skips transcribe entirely even when transcript is null", async () => {
    meetingId = await seedMeeting();

    await processRecording(meetingId, { autoTranscribe: false });

    expect(RecallAiService.fromIntegration).not.toHaveBeenCalled();
    expect(transcribeAudio).not.toHaveBeenCalled();
  });

  it("autoSummarize: false skips summarize even when transcript is present", async () => {
    meetingId = await seedMeeting({
      transcript: "present",
      status: "READY",
    });

    await processRecording(meetingId, { autoSummarize: false });

    expect(summarizeMeeting).not.toHaveBeenCalled();
  });
});
