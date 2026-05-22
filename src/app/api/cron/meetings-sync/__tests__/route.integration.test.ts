import { describe, it, expect, beforeAll, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Sub-etapa 17.0.7: mock `headers()` from `next/headers` (called by the
// cron handler for Cache Components opt-out). Returns empty Headers —
// the handler discards the return value and reads from `request.headers`.
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

/**
 * Sub-etapa 8.5.1 — end-to-end cron route coverage for PROCESSING orphan
 * recovery.
 *
 * Sub-etapa 8.5 added the branch but only exercised it through unit tests
 * that mocked `processRecording`. The cron-route wrapper (auth, query
 * shape, threshold + externalBotId filters, results payload) was
 * untouched by tests. This file fills that gap.
 *
 * Strategy:
 *   - All cron-route dependencies are mocked at module level so the
 *     route only does what we want to observe: query for orphans and
 *     hand each one off to `processRecording`.
 *   - `processRecording` itself is a vi.fn so the test can assert the
 *     exact meetingIds it was invoked with — no real Deepgram /
 *     Anthropic / Recall traffic.
 *   - Prisma is real. Meetings are seeded via `adminClient`, then their
 *     `updatedAt` is back-dated via raw SQL (Prisma's @updatedAt would
 *     otherwise pin it to `now()` on any orm-level write).
 */

vi.mock("@/lib/meetings/meeting-scheduler", () => ({
  syncCalendarMeetings: vi.fn().mockResolvedValue({
    created: 0,
    botsSent: 0,
    providers: [],
  }),
  checkCompletedRecordings: vi.fn().mockResolvedValue(0),
}));

vi.mock("@/lib/meetings/meeting-agent", () => ({
  // Returning null forces the route into the fallback branch
  // (checkCompletedRecordings → no-op via the mock above).
  getAgentConfig: vi.fn().mockRejectedValue(new Error("test: agent disabled")),
  processCompletedMeeting: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/services/recall-ai", () => ({
  RecallAiService: {
    fromIntegration: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock("@/lib/meetings/process-recording", () => ({
  processRecording: vi.fn().mockResolvedValue(undefined),
}));

import { GET } from "../route";
import { processRecording } from "@/lib/meetings/process-recording";

const adminUrl = process.env.DATABASE_URL;
if (!adminUrl) throw new Error("DATABASE_URL required");
const adminClient = new PrismaClient({ adapter: new PrismaPg(adminUrl) });

// Force the auth guard into "no secret set, no guard" mode. The route's
// guard reads CRON_SECRET at request time, so unsetting before each call
// keeps the test free of header juggling without bypassing real-prod
// behavior (deploy environments set the secret).
const originalCronSecret = process.env.CRON_SECRET;

const TEST_PREFIX = `test-cron-orphan-${Date.now()}`;
const SEEDED_IDS: string[] = [];

async function seedMeetingOrphan(
  args: { externalBotId: string | null; updatedAtAgoMs: number },
): Promise<string> {
  const m = await adminClient.meeting.create({
    data: {
      title: `${TEST_PREFIX}-${Math.random().toString(36).slice(2, 8)}`,
      meetingType: "VIRTUAL",
      platform: "GOOGLE_MEET",
      status: "PROCESSING",
      externalBotId: args.externalBotId,
    },
    select: { id: true },
  });
  SEEDED_IDS.push(m.id);

  // Back-date updatedAt via raw SQL — Prisma @updatedAt pins to now()
  // on every ORM-level write, so we have to bypass the ORM for this one.
  const cutoff = new Date(Date.now() - args.updatedAtAgoMs);
  await adminClient.$executeRaw`
    UPDATE "meetings"
       SET "updatedAt" = ${cutoff}
     WHERE id = ${m.id}::uuid
  `;
  return m.id;
}

async function buildRequest(): Promise<Request> {
  return new Request("http://test.local/api/cron/meetings-sync", {
    method: "GET",
  });
}

beforeAll(() => {
  // No secret → guard passes for all tests.
  delete process.env.CRON_SECRET;
});

beforeEach(() => {
  vi.mocked(processRecording).mockReset();
  vi.mocked(processRecording).mockResolvedValue(undefined);
});

afterAll(async () => {
  if (SEEDED_IDS.length > 0) {
    await adminClient.meeting.deleteMany({
      where: { id: { in: SEEDED_IDS } },
    });
  }
  if (originalCronSecret !== undefined) {
    process.env.CRON_SECRET = originalCronSecret;
  }
  await adminClient.$disconnect();
});

describe("meetings-sync cron: PROCESSING orphan recovery", () => {
  it("invokes processRecording for stuck PROCESSING meetings", async () => {
    const stuckId = await seedMeetingOrphan({
      externalBotId: `bot-${TEST_PREFIX}-stuck`,
      updatedAtAgoMs: 20 * 60 * 1000, // 20 minutes — past the 15-min threshold
    });

    const res = await GET(await buildRequest());
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      processingOrphans: { recovered: number } | null;
    };
    expect(body.processingOrphans?.recovered).toBeGreaterThanOrEqual(1);

    expect(processRecording).toHaveBeenCalled();
    const calledWith = vi.mocked(processRecording).mock.calls.map((c) => c[0]);
    expect(calledWith).toContain(stuckId);
  });

  it("ignores PROCESSING meetings under the 15-min threshold", async () => {
    const recentId = await seedMeetingOrphan({
      externalBotId: `bot-${TEST_PREFIX}-recent`,
      updatedAtAgoMs: 5 * 60 * 1000, // 5 minutes — under threshold
    });

    await GET(await buildRequest());

    const calledWith = vi.mocked(processRecording).mock.calls.map((c) => c[0]);
    expect(calledWith).not.toContain(recentId);
  });

  it("ignores PROCESSING meetings without externalBotId", async () => {
    const noBotId = await seedMeetingOrphan({
      externalBotId: null,
      updatedAtAgoMs: 20 * 60 * 1000,
    });

    await GET(await buildRequest());

    const calledWith = vi.mocked(processRecording).mock.calls.map((c) => c[0]);
    expect(calledWith).not.toContain(noBotId);
  });
});
