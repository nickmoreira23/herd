import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/domain-events/process-pending-events", () => ({
  processPendingEvents: vi.fn(),
}));

import { GET } from "../route";
import { processPendingEvents } from "@/lib/domain-events/process-pending-events";

describe("GET /api/cron/domain-events-sync", () => {
  beforeEach(() => {
    process.env.CRON_SECRET = "test-secret-12345";
    vi.clearAllMocks();
  });

  it("returns 401 without Authorization header", async () => {
    const req = new Request("http://localhost/api/cron/domain-events-sync");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 401 with wrong secret", async () => {
    const req = new Request("http://localhost/api/cron/domain-events-sync", {
      headers: { authorization: "Bearer wrong-secret" },
    });
    const res = await GET(req);
    expect(res.status).toBe(401);
  });

  it("returns 200 with valid secret and reports batch results", async () => {
    vi.mocked(processPendingEvents).mockResolvedValue({
      picked: 3,
      succeeded: 2,
      failed: 1,
      noHandler: 0,
      exhausted: 0,
      results: [],
    });

    const req = new Request("http://localhost/api/cron/domain-events-sync", {
      headers: { authorization: "Bearer test-secret-12345" },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("ok");
    expect(body.picked).toBe(3);
    expect(body.succeeded).toBe(2);
    expect(body.failed).toBe(1);
  });

  it("returns 500 when processPendingEvents throws", async () => {
    vi.mocked(processPendingEvents).mockRejectedValue(new Error("DB down"));

    const req = new Request("http://localhost/api/cron/domain-events-sync", {
      headers: { authorization: "Bearer test-secret-12345" },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);

    const body = (await res.json()) as Record<string, unknown>;
    expect(body.status).toBe("error");
    expect(body.error).toContain("DB down");
  });
});
