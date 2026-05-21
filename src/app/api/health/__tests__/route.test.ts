import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    domainEvent: {
      count: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { GET } from "../route";
import { prisma } from "@/lib/prisma";

describe("GET /api/health", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with operational signals when DB is reachable", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
    vi.mocked(prisma.domainEvent.count)
      .mockResolvedValueOnce(7) // pending
      .mockResolvedValueOnce(2); // exhausted
    vi.mocked(prisma.domainEvent.findFirst).mockResolvedValue({
      processedAt: new Date("2026-05-21T10:00:00Z"),
    } as never);

    const res = await GET();
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.db).toBe("connected");
    const outbox = body.outbox as Record<string, unknown>;
    expect(outbox.pending).toBe(7);
    expect(outbox.exhausted).toBe(2);
    expect(outbox.lastProcessedAt).toBe("2026-05-21T10:00:00.000Z");
  });

  it("returns null lastProcessedAt when no events processed yet", async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([{ "?column?": 1 }]);
    vi.mocked(prisma.domainEvent.count)
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(0);
    vi.mocked(prisma.domainEvent.findFirst).mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    const outbox = body.outbox as Record<string, unknown>;
    expect(outbox.lastProcessedAt).toBeNull();
  });

  it("returns 503 when DB ping fails", async () => {
    vi.mocked(prisma.$queryRaw).mockRejectedValue(
      new Error("connection refused"),
    );

    const res = await GET();
    expect(res.status).toBe(503);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("error");
    expect(body.error).toContain("connection refused");
  });
});
